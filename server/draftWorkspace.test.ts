import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getUserPosts: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

const context = {
  user: { id: 5, openId: "writer-5", email: null, name: "Writer", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {},
  res: {},
} as unknown as TrpcContext;

describe("author workspace", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the current author's drafts and published entries with the requested page window", async () => {
    const entries = [{ id: 1, status: "draft" }, { id: 2, status: "published" }];
    dbMocks.getUserPosts.mockResolvedValue(entries);

    const result = await appRouter.createCaller(context).posts.myPosts({ page: 2, limit: 20 });

    expect(dbMocks.getUserPosts).toHaveBeenCalledWith(5, 20, 20);
    expect(result).toEqual({ data: entries, page: 2 });
  });
});
