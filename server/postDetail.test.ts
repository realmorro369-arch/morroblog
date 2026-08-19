import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getPostDetailBySlug: vi.fn(),
  incrementPostViewCount: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

describe("posts.getBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the article together with real category and tag metadata", async () => {
    const post = {
      id: 42,
      title: "Nightly build notes",
      slug: "nightly-build-notes",
      content: "# Notes",
      excerpt: "A record",
      coverImage: null,
      authorId: 1,
      author: { id: 1, name: "Morro" },
      categoryId: 3,
      category: { id: 3, name: "工程", slug: "engineering", description: null },
      tags: [{ id: 7, name: "TypeScript", slug: "typescript", description: null }],
      status: "published" as const,
      viewCount: 12,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    };
    dbMocks.getPostDetailBySlug.mockResolvedValue(post);
    dbMocks.incrementPostViewCount.mockResolvedValue(undefined);

    const ctx = { user: null, req: {}, res: {} } as TrpcContext;
    const result = await appRouter.createCaller(ctx).posts.getBySlug({ slug: post.slug });

    expect(result.category?.name).toBe("工程");
    expect(result.tags).toEqual([{ id: 7, name: "TypeScript", slug: "typescript", description: null }]);
    expect(result.author).toEqual({ id: 1, name: "Morro" });
    expect(dbMocks.incrementPostViewCount).toHaveBeenCalledWith(42);
  });
});
