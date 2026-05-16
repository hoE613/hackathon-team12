import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../auth.js";
import { register } from "../http.js";
import type { AiRecommendationBody, ContentBody } from "../request-types.js";
import { buildAiCandidates, callGeminiJson, getGeminiApiKey, getGeminiModel } from "../services/ai.js";
import { aiRecommendationLogs } from "../state.js";
import { buildSummary, classifyCategory, extractTags, normalizeText, nowIso, parseLimit } from "../utils.js";

export function registerAiRoutes(app: Express) {
  register(app, "post", "/ai/recommendations", async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const body = req.body as AiRecommendationBody;
    const candidates = buildAiCandidates(body);
    const responseCandidates = candidates.map((candidate) => ({
      id: candidate.id,
      score: candidate.score,
      reason: candidate.reason
    }));
    let finalCandidates = responseCandidates;
    let modelName = "gemini-mock";
    let promptVersion = "v1";
    const forceMock = (req.body as { force_mock?: boolean }).force_mock === true;

    if (!forceMock && getGeminiApiKey()) {
      const candidatePayload = candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        category: candidate.category,
        distanceKm: candidate.distanceKm,
        averageRating: candidate.averageRating,
        confidence: candidate.confidence
      }));
      const prompt = [
        "You are a food recommendation assistant. Use ONLY the candidate list.",
        "Return JSON only with this shape:",
        '{"candidates":[{"id":"...","score":0-100,"reason":"..."}] }',
        "Context:",
        JSON.stringify({ request: body, candidates: candidatePayload })
      ].join("\n");

      try {
        const geminiResult = await callGeminiJson<{ candidates?: Array<{ id: string; score?: number; reason?: string }> }>(prompt);
        if (geminiResult?.candidates?.length) {
          const allowedIds = new Set(candidatePayload.map((candidate) => candidate.id));
          const scoreById = new Map(responseCandidates.map((candidate) => [candidate.id, candidate.score]));
          const reasonById = new Map(responseCandidates.map((candidate) => [candidate.id, candidate.reason]));
          const normalized = geminiResult.candidates
            .filter((candidate) => allowedIds.has(candidate.id))
            .map((candidate) => ({
              id: candidate.id,
              score: typeof candidate.score === "number" ? candidate.score : scoreById.get(candidate.id) ?? 70,
              reason: candidate.reason?.trim() || reasonById.get(candidate.id) || "후보 중 조건에 가장 적합합니다."
            }));

          if (normalized.length > 0) {
            finalCandidates = normalized;
            modelName = getGeminiModel();
            promptVersion = "v1-gemini";
          }
        }
      } catch (error) {
        console.warn("Gemini recommendations failed:", (error as Error).message ?? error);
      }
    }

    const logId = `ai_${randomUUID().slice(0, 8)}`;
    aiRecommendationLogs.unshift({
      id: logId,
      userId: user.id,
      requestContext: body as Record<string, unknown>,
      candidateRestaurantIds: candidates.map((candidate) => candidate.id),
      finalRecommendation: {
        candidates: finalCandidates,
        meta: {
          recommendation_id: logId,
          model_name: modelName,
          prompt_version: promptVersion
        }
      },
      modelName,
      promptVersion,
      createdAt: nowIso()
    });

    res.json({
      candidates: finalCandidates,
      meta: {
        recommendation_id: logId,
        model_name: modelName,
        prompt_version: promptVersion,
        candidate_count: finalCandidates.length
      }
    });
  });

  register(app, "post", "/ai/chat", async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const messages = Array.isArray((req.body as { messages?: Array<{ role: string; content: string }> }).messages)
      ? (req.body as { messages: Array<{ role: string; content: string }> }).messages
      : [];
    const lastMessage = messages[messages.length - 1]?.content ?? "";
    const sessionId = (req.body as { session_id?: string }).session_id ?? `session_${user.id}`;
    let reply = lastMessage ? `추천 기준을 더 구체화하면 ${buildSummary(lastMessage, 80)} 방향으로 좁힐 수 있어요.` : "원하는 분위기, 예산, 위치를 말해주면 후보를 좁혀드릴게요.";
    let actions = ["refine_filters", "show_candidates", "ask_again"];
    let modelName = "gemini-mock";
    const forceMock = (req.body as { force_mock?: boolean }).force_mock === true;

    if (!forceMock && getGeminiApiKey() && messages.length > 0) {
      const prompt = [
        "You are a helpful food recommendation assistant.",
        "Return JSON only with this shape:",
        '{"reply":"...","actions":["..."]}',
        "Conversation:",
        JSON.stringify(messages)
      ].join("\n");

      try {
        const geminiResult = await callGeminiJson<{ reply?: string; actions?: string[] }>(prompt, 0.6);
        if (geminiResult?.reply) {
          reply = geminiResult.reply.trim();
          actions = Array.isArray(geminiResult.actions) && geminiResult.actions.length > 0 ? geminiResult.actions : actions;
          modelName = getGeminiModel();
        }
      } catch {
        // Fallback to local response on Gemini errors.
      }
    }

    res.json({ reply, actions, session_id: sessionId, model_name: modelName });
  });

  register(app, "post", "/ai/recommendations/explain", (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const recommendationId = normalizeText((req.body as { recommendation_id?: string }).recommendation_id);
    const log = aiRecommendationLogs.find((entry) => entry.id === recommendationId && entry.userId === user.id);
    if (!log) {
      res.status(404).json({ error: "recommendation_not_found" });
      return;
    }

    res.json({
      explanation: "DB 후보만 사용했고, 거리/예산/카테고리 적합도를 기준으로 재정렬했습니다.",
      confidence: 0.87,
      source: log.finalRecommendation
    });
  });

  register(app, "post", "/ai/content/summarize", async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const body = req.body as ContentBody;
    const text = normalizeText(body.text);
    const limit = parseLimit(body.limit, 120);
    let summary = buildSummary(text, limit);
    let modelName = "gemini-mock";
    const forceMock = (req.body as { force_mock?: boolean }).force_mock === true;

    if (!forceMock && getGeminiApiKey() && text) {
      const prompt = [
        "Summarize the text in Korean.",
        `Max ${limit} characters.`,
        "Return JSON only with this shape:",
        '{"summary":"..."}',
        "Text:",
        text
      ].join("\n");

      try {
        const geminiResult = await callGeminiJson<{ summary?: string }>(prompt, 0.3);
        if (geminiResult?.summary) {
          summary = geminiResult.summary.trim();
          modelName = getGeminiModel();
        }
      } catch {
        // Fallback to local summary on Gemini errors.
      }
    }

    res.json({ summary, model_name: modelName });
  });

  register(app, "post", "/ai/content/tags", (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const text = normalizeText((req.body as ContentBody).text);
    res.json({ tags: extractTags(text) });
  });

  register(app, "post", "/ai/content/category", (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const text = normalizeText((req.body as ContentBody).text);
    const classification = classifyCategory(text);
    res.json({ category_id: classification.categoryId, confidence: classification.confidence });
  });
}
