export type HitokotoQuote = {
  text: string;
  source: string;
  fallback: boolean;
};

export type QuoteFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const HITOKOTO_URL = "https://v1.hitokoto.cn?max_length=24";
const HITOKOTO_TIMEOUT_MS = 1000;
const HITOKOTO_CACHE_TTL_MS = 10 * 60 * 1000;
const fallbackQuote: HitokotoQuote = {
  text: "一言服务暂时不可用，先把眼前的问题看清。",
  source: "MorroBlog · 本地回退",
  fallback: true,
};

let cachedQuote: { value: HitokotoQuote; expiresAt: number } | null = null;

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function getHitokotoQuote(fetchImpl: QuoteFetch = fetch): Promise<HitokotoQuote> {
  const canUseCache = fetchImpl === fetch;
  if (canUseCache && cachedQuote && cachedQuote.expiresAt > Date.now()) return cachedQuote.value;

  try {
    const response = await fetchImpl(HITOKOTO_URL, { signal: AbortSignal.timeout(HITOKOTO_TIMEOUT_MS) });
    if (!response.ok) return fallbackQuote;

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object") return fallbackQuote;
    const record = payload as Record<string, unknown>;
    const text = readText(record.hitokoto);
    const source = readText(record.from);
    if (!text || text.length > 80) return fallbackQuote;

    const quote = {
      text,
      source: source || "未署名",
      fallback: false,
    };
    if (canUseCache) cachedQuote = { value: quote, expiresAt: Date.now() + HITOKOTO_CACHE_TTL_MS };
    return quote;
  } catch {
    return fallbackQuote;
  }
}

/** 仅供测试重置，不在业务代码中调用。 */
export function resetHitokotoQuoteCacheForTest() {
  cachedQuote = null;
}
