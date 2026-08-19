import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getPublishedPosts: vi.fn(),
  getPostCount: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

const publicContext = { user: null, req: {}, res: {} } as unknown as TrpcContext;

describe("posts.list server-side filters", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes a tag filter and page-two offset to both data and total queries", async () => {
    dbMocks.getPublishedPosts.mockResolvedValue([{ id: 21, slug: "late-tagged-entry" }]);
    dbMocks.getPostCount.mockResolvedValue(21);

    const result = await appRouter.createCaller(publicContext).posts.list({ page: 2, limit: 10, tagSlug: "hardware" });

    expect(dbMocks.getPublishedPosts).toHaveBeenCalledWith(10, 10, { tagSlug: "hardware", categoryId: undefined, search: undefined });
    expect(dbMocks.getPostCount).toHaveBeenCalledWith("published", { tagSlug: "hardware", categoryId: undefined, search: undefined });
    expect(result).toEqual({ data: [{ id: 21, slug: "late-tagged-entry" }], total: 21, page: 2, limit: 10 });
  });

  it("passes a category filter to the server instead of filtering only the loaded client page", async () => {
    dbMocks.getPublishedPosts.mockResolvedValue([{ id: 42, slug: "category-result" }]);
    dbMocks.getPostCount.mockResolvedValue(11);

    const result = await appRouter.createCaller(publicContext).posts.list({ page: 3, limit: 5, categoryId: 7 });

    expect(dbMocks.getPublishedPosts).toHaveBeenCalledWith(5, 10, { tagSlug: undefined, categoryId: 7, search: undefined });
    expect(dbMocks.getPostCount).toHaveBeenCalledWith("published", { tagSlug: undefined, categoryId: 7, search: undefined });
    expect(result.total).toBe(11);
    expect(result.data).toEqual([{ id: 42, slug: "category-result" }]);
  });

  it("keeps tag and category constraints together for a paginated combined filter", async () => {
    dbMocks.getPublishedPosts.mockResolvedValue([{ id: 77, slug: "hardware-in-engineering" }]);
    dbMocks.getPostCount.mockResolvedValue(12);

    const result = await appRouter.createCaller(publicContext).posts.list({ page: 2, limit: 6, tagSlug: "hardware", categoryId: 3 });

    const filters = { tagSlug: "hardware", categoryId: 3, search: undefined };
    expect(dbMocks.getPublishedPosts).toHaveBeenCalledWith(6, 6, filters);
    expect(dbMocks.getPostCount).toHaveBeenCalledWith("published", filters);
    expect(result).toEqual({ data: [{ id: 77, slug: "hardware-in-engineering" }], total: 12, page: 2, limit: 6 });
  });

  it("passes a trimmed search term to both paginated data and total queries", async () => {
    dbMocks.getPublishedPosts.mockResolvedValue([{ id: 89, slug: "search-result" }]);
    dbMocks.getPostCount.mockResolvedValue(1);

    const result = await appRouter.createCaller(publicContext).posts.list({ page: 2, limit: 8, tagSlug: "open-source", categoryId: 4, search: "  compiler  " });

    const filters = { tagSlug: "open-source", categoryId: 4, search: "compiler" };
    expect(dbMocks.getPublishedPosts).toHaveBeenCalledWith(8, 8, filters);
    expect(dbMocks.getPostCount).toHaveBeenCalledWith("published", filters);
    expect(result).toEqual({ data: [{ id: 89, slug: "search-result" }], total: 1, page: 2, limit: 8 });
  });
});
