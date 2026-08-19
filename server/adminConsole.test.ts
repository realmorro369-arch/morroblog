import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getAdminPosts: vi.fn(),
  getAllUsers: vi.fn(),
  getDb: vi.fn(),
}));
vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

const date = new Date();
const createContext = (role: "admin" | "user") => ({
  user: { id: role === "admin" ? 1 : 2, openId: `${role}-user`, email: null, name: role, loginMethod: "manus", role, createdAt: date, updatedAt: date, lastSignedIn: date },
  req: {},
  res: {},
} as TrpcContext);

describe("admin console routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects non-admin access to the user directory", async () => {
    await expect(appRouter.createCaller(createContext("user")).admin.users.list({ page: 1, limit: 50 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns global post and user directories to an administrator", async () => {
    dbMocks.getAdminPosts.mockResolvedValue([{ id: 10, title: "Record", status: "published" }]);
    dbMocks.getAllUsers.mockResolvedValue([{ id: 1, name: "admin", role: "admin" }]);
    const caller = appRouter.createCaller(createContext("admin"));

    const [posts, users] = await Promise.all([
      caller.admin.posts.list({ page: 2, limit: 10 }),
      caller.admin.users.list({ page: 1, limit: 10 }),
    ]);

    expect(dbMocks.getAdminPosts).toHaveBeenCalledWith(10, 10);
    expect(dbMocks.getAllUsers).toHaveBeenCalledWith(10, 0);
    expect(posts[0]?.title).toBe("Record");
    expect(users[0]?.role).toBe("admin");
  });
});
