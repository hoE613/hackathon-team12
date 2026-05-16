export function nowIso() {
  return new Date().toISOString();
}

export function parsePage(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function parseLimit(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 50) : fallback;
}

export function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildSummary(text: string, limit = 120) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= limit) {
    return compact;
  }

  return `${compact.slice(0, Math.max(0, limit - 1)).trimEnd()}...`;
}

export function extractTags(text: string) {
  const pairs = [
    ["혼밥", "혼밥"],
    ["가성비", "가성비"],
    ["데이트", "데이트"],
    ["가족", "가족"],
    ["매운", "매운맛"],
    ["일식", "일식"],
    ["양식", "양식"],
    ["중식", "중식"],
    ["술", "술집"]
  ] as const;

  const lowerText = text.toLowerCase();
  const tags = pairs.filter(([keyword]) => lowerText.includes(keyword.toLowerCase())).map(([, tag]) => tag);
  return tags.length > 0 ? [...new Set(tags)] : ["맛집", "추천"];
}

export function classifyCategory(text: string) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("초밥") || lowerText.includes("스시") || lowerText.includes("회")) {
    return { categoryId: "japanese", confidence: 0.92 };
  }

  if (lowerText.includes("파스타") || lowerText.includes("피자") || lowerText.includes("양식")) {
    return { categoryId: "western", confidence: 0.89 };
  }

  if (lowerText.includes("짜장") || lowerText.includes("짬뽕") || lowerText.includes("중식")) {
    return { categoryId: "chinese", confidence: 0.88 };
  }

  if (lowerText.includes("술") || lowerText.includes("안주") || lowerText.includes("맥주")) {
    return { categoryId: "pub", confidence: 0.86 };
  }

  return { categoryId: "western", confidence: 0.55 };
}

export function haversineKm(leftLat: number, leftLng: number, rightLat: number, rightLng: number) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(rightLat - leftLat);
  const deltaLng = toRadians(rightLng - leftLng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(leftLat)) * Math.cos(toRadians(rightLat)) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}
