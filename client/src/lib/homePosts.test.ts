import { describe, expect, it } from "vitest";
import { splitHomePosts } from "./homePosts";

describe("home post selection", () => {
  it("uses the newest item as the featured article and preserves the remainder as latest articles", () => {
    const posts = [
      { id: 9, title: "Newest" },
      { id: 8, title: "Earlier" },
      { id: 7, title: "Older" },
    ];

    expect(splitHomePosts(posts)).toEqual({
      featured: { id: 9, title: "Newest" },
      latest: [
        { id: 8, title: "Earlier" },
        { id: 7, title: "Older" },
      ],
    });
  });

  it("returns no featured article when no published article is available", () => {
    expect(splitHomePosts([])).toEqual({ featured: undefined, latest: [] });
  });
});
