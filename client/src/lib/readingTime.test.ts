import { describe, expect, it } from "vitest";
import { estimateReadingMinutes, formatReadingTime } from "./readingTime";

describe("reading time", () => {
  it("returns a one-minute minimum for an empty or short entry", () => {
    expect(estimateReadingMinutes("")).toBe(1);
    expect(formatReadingTime("简短记录")).toBe("01 MIN READ");
  });

  it("uses Chinese character density for Chinese-language technical entries", () => {
    expect(estimateReadingMinutes("技".repeat(301))).toBe(2);
  });

  it("uses word density for Latin-language entries and counts linked labels instead of URLs", () => {
    const content = `[documentation](/reference) ${"signal ".repeat(200)}`;
    expect(estimateReadingMinutes(content)).toBe(2);
  });
});
