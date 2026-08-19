import { describe, expect, it } from "vitest";
import { formatHomeQuote } from "./homeQuote";

describe("home quote presentation", () => {
  it("formats the quote as the content directly below the featured heading", () => {
    expect(formatHomeQuote("先留下证据，再给结论一个位置。")).toBe("“先留下证据，再给结论一个位置。”");
  });
});
