import { describe, expect, it } from "vitest";
import { beforeEach, vi } from "vitest";
import { getHitokotoQuote, resetHitokotoQuoteCacheForTest, type QuoteFetch } from "./hitokoto";

describe("公开一言接口", () => {
  beforeEach(() => resetHitokotoQuoteCacheForTest());
  it("映射 hitokoto 与 from 字段，不向首页泄露第三方原始响应", async () => {
    const fetcher: QuoteFetch = async () => new Response(JSON.stringify({ hitokoto: "知其不可奈何而安之若命。", from: "庄子" }), { status: 200 });

    await expect(getHitokotoQuote(fetcher)).resolves.toEqual({ text: "知其不可奈何而安之若命。", source: "庄子", fallback: false });
  });

  it("在网络或响应异常时返回稳定中文回退", async () => {
    const unavailable: QuoteFetch = async () => { throw new Error("offline"); };
    const malformed: QuoteFetch = async () => new Response(JSON.stringify({ from: "缺少正文" }), { status: 200 });

    await expect(getHitokotoQuote(unavailable)).resolves.toMatchObject({ fallback: true, source: "MorroBlog · 本地回退" });
    await expect(getHitokotoQuote(malformed)).resolves.toMatchObject({ fallback: true });
  });

  it("在生产默认请求成功后复用短期缓存，避免每次首页请求都等待外部一言服务", async () => {
    const previousFetch = globalThis.fetch;
    const fetcher = vi.fn<QuoteFetch>().mockResolvedValue(new Response(JSON.stringify({ hitokoto: "缓存过的一句话。", from: "Morro" }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);

    await expect(getHitokotoQuote()).resolves.toMatchObject({ text: "缓存过的一句话。", fallback: false });
    await expect(getHitokotoQuote()).resolves.toMatchObject({ text: "缓存过的一句话。", fallback: false });
    expect(fetcher).toHaveBeenCalledTimes(1);

    vi.stubGlobal("fetch", previousFetch);
  });
});
