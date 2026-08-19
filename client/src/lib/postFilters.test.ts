import { describe, expect, it } from "vitest";
import { buildPostIndexLocation, parsePostIndexFilters } from "./postFilters";

describe("post index URL filters", () => {
  it("restores a decoded search, tag, and positive category from a shareable URL", () => {
    expect(parsePostIndexFilters("?q=%20compiler%20&tag=open-source&category=4")).toEqual({
      search: "compiler",
      tagSlug: "open-source",
      categoryId: "4",
    });
  });

  it("drops invalid or empty optional filters instead of sending invalid tRPC inputs", () => {
    expect(parsePostIndexFilters("?q=%20%20&tag=%20&category=not-a-number")).toEqual({
      search: "",
      tagSlug: null,
      categoryId: null,
    });
  });

  it("writes canonical combined filter URLs and returns the base index after reset", () => {
    expect(buildPostIndexLocation({ search: " compiler ", tagSlug: "open-source", categoryId: "4" })).toBe(
      "/posts?q=compiler&tag=open-source&category=4",
    );
    expect(buildPostIndexLocation({ search: "", tagSlug: null, categoryId: null })).toBe("/posts");
  });
});
