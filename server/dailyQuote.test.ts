import { describe, expect, it } from "vitest";
import { getAdjacentQuoteIndex, getQuoteIndexForDate, observatoryQuotes } from "../client/src/lib/dailyQuote";

describe("首页一言短句", () => {
  it("为同一天稳定选择同一句原创短句", () => {
    const date = new Date(2026, 7, 17, 9, 30);

    expect(getQuoteIndexForDate(date)).toBe(getQuoteIndexForDate(date));
    expect(observatoryQuotes[getQuoteIndexForDate(date)]?.source).toBe("MorroBlog · 此刻一言");
  });

  it("允许访客在不依赖外部服务的情况下循环换一句", () => {
    expect(getAdjacentQuoteIndex(observatoryQuotes.length - 1, 1)).toBe(0);
    expect(getAdjacentQuoteIndex(0, -1)).toBe(observatoryQuotes.length - 1);
  });
});
