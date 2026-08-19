import { describe, expect, it, vi } from "vitest";
import { getCommentRepliesFromDb } from "./db";

describe("getCommentRepliesFromDb", () => {
  it("recursively loads child and grandchild replies from the same query source", async () => {
    const now = new Date();
    const queryResults = [
      [{ id: 2, postId: 1, authorId: 2, content: "child", status: "approved", parentCommentId: 1, createdAt: now, updatedAt: now }],
      [{ id: 3, postId: 1, authorId: 3, content: "grandchild", status: "approved", parentCommentId: 2, createdAt: now, updatedAt: now }],
      [],
    ];
    const orderBy = vi.fn(() => Promise.resolve(queryResults.shift() || []));
    const fakeDb = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy })) })) })),
    };

    const tree = await getCommentRepliesFromDb(fakeDb, 1, 7);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.content).toBe("child");
    expect(tree[0]?.replies[0]?.content).toBe("grandchild");
    expect(tree[0]?.replies[0]?.replies).toEqual([]);
    expect(orderBy).toHaveBeenCalledTimes(3);
  });
});
