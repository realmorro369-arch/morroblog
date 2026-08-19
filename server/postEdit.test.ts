import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getPostDetailById: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

const post = {
  id: 8,
  authorId: 4,
  title: "Editable field note",
  slug: "editable-field-note",
  content: "# Entry",
  excerpt: null,
  coverImage: null,
  categoryId: null,
  status: "published" as const,
  viewCount: 0,
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  category: undefined,
  tags: [],
};

const createContext = (id: number, role: "user" | "admin" = "user") => ({
  user: { id, openId: `user-${id}`, email: null, name: "Writer", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {},
  res: {},
} as unknown as TrpcContext);

describe("posts.getForEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getPostDetailById.mockResolvedValue(post);
  });

  it("returns complete editable metadata to the article author", async () => {
    const result = await appRouter.createCaller(createContext(4)).posts.getForEdit({ id: 8 });

    expect(dbMocks.getPostDetailById).toHaveBeenCalledWith(8);
    expect(result).toEqual(post);
  });

  it("rejects a different ordinary user", async () => {
    await expect(appRouter.createCaller(createContext(9)).posts.getForEdit({ id: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows administrators to load another author's article for edit", async () => {
    await expect(appRouter.createCaller(createContext(1, "admin")).posts.getForEdit({ id: 8 })).resolves.toEqual(post);
  });
});
