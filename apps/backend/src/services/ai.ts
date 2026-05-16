import { restaurants } from "../data.js";
import type { AiRecommendationBody } from "../request-types.js";
import { haversineKm, safeJsonParse } from "../utils.js";
import { getCategoryById, getRestaurantById } from "./posts.js";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export function getGeminiApiKey() {
  return process.env.GOOGLE_API_KEY ?? "";
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
}

export function buildAiCandidates(body: AiRecommendationBody) {
  const location = body.location;
  const budget = body.budget ?? Number.POSITIVE_INFINITY;
  const preferredCategory = body.filters?.find((filter) => filter.field === "category")?.value;
  const preferredIntent = body.intent?.trim().toLowerCase() ?? "";

  return restaurants
    .map((restaurant) => {
      const distanceKm = location?.lat !== undefined && location?.lng !== undefined ? haversineKm(location.lat, location.lng, restaurant.lat, restaurant.lng) : 1.2;
      const categoryMatch = preferredCategory && restaurant.categoryId === preferredCategory ? 8 : 0;
      const budgetMatch = budget === Number.POSITIVE_INFINITY || Number(restaurant.priceRange.split("-")[0].replace(/,/g, "")) <= budget ? 4 : -6;
      const intentMatch = preferredIntent && restaurant.name.toLowerCase().includes(preferredIntent) ? 3 : 0;
      const rating = 4.0 + restaurant.categoryId.length * 0.05;
      const score = Number((100 - distanceKm * 12 + rating * 10 + categoryMatch + budgetMatch + intentMatch).toFixed(2));
      return {
        id: restaurant.id,
        score,
        reason: `${restaurant.name}은(는) ${restaurant.priceRange}대이며 ${restaurant.businessHours}에 운영됩니다.`
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((item) => {
      const restaurant = getRestaurantById(item.id);
      const category = restaurant ? getCategoryById(restaurant.categoryId) : null;
      return {
        id: item.id,
        score: item.score,
        reason: `${category?.name ?? "추천"} 후보로 적합하고, 현재 후보군 중 점수가 높습니다. ${item.reason}`,
        name: restaurant?.name ?? item.id,
        category: category?.name ?? "기타",
        distanceKm: Number((location?.lat !== undefined && location?.lng !== undefined && restaurant ? haversineKm(location.lat, location.lng, restaurant.lat, restaurant.lng) : 1.2).toFixed(1)),
        averageRating: 4.2 + (restaurant?.categoryId === "japanese" ? 0.3 : 0.1),
        confidence: Math.max(0.6, Math.min(0.98, item.score / 120))
      };
    });
}

export async function callGemini(prompt: string, temperature = 0.4) {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const response = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GEMINI_ERROR:${response.status}:${errorText}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) {
    throw new Error("GEMINI_EMPTY_RESPONSE");
  }

  return text;
}

export async function callGeminiJson<T>(prompt: string, temperature = 0.4): Promise<T | null> {
  const text = await callGemini(prompt, temperature);
  return safeJsonParse<T>(text);
}
