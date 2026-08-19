import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getCommentById: vi.fn(),
  getPostComments: vi.fn(),
  getCommentReplies: vi.fn(),
}));
vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";
import { comments } from "../drizzle/schema";

describe("comments.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores a reply under its parent comment as pending moderation", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 21 }]);
    const fakeDb = { insert: vi.fn(() => ({ values })) };
    dbMocks.getDb.mockResolvedValue(fakeDb);
    dbMocks.getCommentById.mockResolvedValue({ id: 9, postId: 3 });
    const ctx = {
      user: {
        id: 5,
        openId: "commenter-5",
        email: null,
        name: "Commenter",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {},
      res: {},
    } as TrpcContext;

    const result = await appRouter.createCaller(ctx).comments.create({
      postId: 3,
      parentCommentId: 9,
      content: "这是一条楼层回复。",
    });

    expect(result.id).toBe(21);
    expect(fakeDb.insert).toHaveBeenCalledWith(comments);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      postId: 3,
      parentCommentId: 9,
      authorId: 5,
      status: "pending",
    }));
  });

  it("rejects a reply whose parent comment belongs to another post", async () => {
    const fakeDb = { insert: vi.fn() };
    dbMocks.getDb.mockResolvedValue(fakeDb);
    dbMocks.getCommentById.mockResolvedValue({ id: 9, postId: 99 });
    const ctx = {
      user: { id: 5, openId: "commenter-5", email: null, name: "Commenter", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: {},
      res: {},
    } as TrpcContext;

    await expect(appRouter.createCaller(ctx).comments.create({ postId: 3, parentCommentId: 9, content: "跨文章回复" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(fakeDb.insert).not.toHaveBeenCalled();
  });

  it("returns a nested reply tree while preserving the authenticated viewer id", async () => {
    const createdAt = new Date();
    dbMocks.getPostComments.mockResolvedValue([{ id: 1, postId: 3, authorId: 2, content: "父评论", status: "approved", parentCommentId: null, createdAt, updatedAt: createdAt }]);
    dbMocks.getCommentReplies.mockResolvedValue([
      {
        id: 2,
        postId: 3,
        authorId: 5,
        content: "子评论",
        status: "approved",
        parentCommentId: 1,
        createdAt,
        updatedAt: createdAt,
        replies: [{ id: 3, postId: 3, authorId: 2, content: "第三层回复", status: "approved", parentCommentId: 2, createdAt, updatedAt: createdAt, replies: [] }],
      },
    ]);
    const ctx = {
      user: { id: 5, openId: "commenter-5", email: null, name: "Commenter", loginMethod: "manus", role: "user", createdAt, updatedAt: createdAt, lastSignedIn: createdAt },
      req: {},
      res: {},
    } as TrpcContext;

    const result = await appRouter.createCaller(ctx).comments.list({ postId: 3 });

    expect(dbMocks.getPostComments).toHaveBeenCalledWith(3, 20, 0, 5);
    expect(dbMocks.getCommentReplies).toHaveBeenCalledWith(1, 5);
    expect(result.data[0]?.replies[0]?.replies[0]?.content).toBe("第三层回复");
  });
});
