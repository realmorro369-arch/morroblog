import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getCategoryById: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";
import { postTags, posts } from "../drizzle/schema";

describe("posts.create metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a post and persists unique selected tag relations", async () => {
    const postValues = vi.fn().mockResolvedValue([{ insertId: 99 }]);
    const tagValues = vi.fn().mockResolvedValue([]);
    const fakeDb = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ id: 4 }, { id: 8 }]),
        })),
      })),
      insert: vi.fn((table) => ({ values: table === posts ? postValues : tagValues })),
    };
    dbMocks.getDb.mockResolvedValue(fakeDb);
    dbMocks.getCategoryById.mockResolvedValue({ id: 2, name: "工程", slug: "engineering" });

    const ctx = {
      user: {
        id: 1,
        openId: "author-1",
        email: null,
        name: "Author",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {},
      res: {},
    } as TrpcContext;

    const result = await appRouter.createCaller(ctx).posts.create({
      title: "Metadata-aware article",
      slug: "metadata-aware-article",
      content: "# Body",
      categoryId: 2,
      tagIds: [4, 8, 4],
      status: "published",
    });

    expect(result.id).toBe(99);
    expect(postValues).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 2, authorId: 1 }));
    expect(tagValues).toHaveBeenCalledWith([
      { postId: 99, tagId: 4 },
      { postId: 99, tagId: 8 },
    ]);
    expect(fakeDb.insert).toHaveBeenCalledWith(postTags);
  });
});
