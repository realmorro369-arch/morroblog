import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { TrpcContext } from "./_core/context";

const storageMocks = vi.hoisted(() => ({ storagePut: vi.fn() }));
vi.mock("./storage", () => storageMocks);

import { appRouter } from "./routers";

const now = new Date();
const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString("base64");
const ctx = {
  user: { id: 5, openId: "uploader-5", email: null, name: "Uploader", loginMethod: "manus", role: "user", createdAt: now, updatedAt: now, lastSignedIn: now },
  req: {},
  res: {},
} as TrpcContext;

describe("media.uploadImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores an authenticated image and returns its public storage path", async () => {
    storageMocks.storagePut.mockResolvedValue({ key: "blog/5/images/record.png", url: "/manus-storage/blog/5/images/record.png" });
    const result = await appRouter.createCaller(ctx).media.uploadImage({
      fileName: "night signal.png",
      mimeType: "image/png",
      base64: pngBase64,
    });

    expect(result.url).toBe("/manus-storage/blog/5/images/record.png");
    expect(storageMocks.storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^blog\/5\/images\//),
      expect.any(Buffer),
      "image/png"
    );
  });

  it("rejects an image that exceeds the 30MB binary limit", async () => {
    const oversizedBase64 = Buffer.alloc(30 * 1024 * 1024 + 1).toString("base64");
    await expect(appRouter.createCaller(ctx).media.uploadImage({
      fileName: "oversized.png",
      mimeType: "image/png",
      base64: oversizedBase64,
    })).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    expect(storageMocks.storagePut).not.toHaveBeenCalled();
  });

  it("keeps the Express JSON parser large enough for a 30MB image after Base64 encoding", () => {
    const serverEntry = fs.readFileSync(path.resolve(import.meta.dirname, "_core/index.ts"), "utf8");
    expect(serverEntry).toContain('express.json({ limit: "45mb" })');
    expect(serverEntry).toContain("30 MiB 原始图片经过 Base64 编码后约为 40 MiB");
  });

  it("rejects malformed payloads and content whose signature does not match the declared MIME type", async () => {
    await expect(appRouter.createCaller(ctx).media.uploadImage({
      fileName: "not-a-png.png",
      mimeType: "image/png",
      base64: Buffer.from("not an image").toString("base64"),
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(ctx).media.uploadImage({
      fileName: "encoded.png",
      mimeType: "image/png",
      base64: "%%%not-base64%%%",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storageMocks.storagePut).not.toHaveBeenCalled();
  });

  it("does not expose uploading to an unauthenticated visitor", async () => {
    await expect(appRouter.createCaller({ user: null, req: {}, res: {} } as TrpcContext).media.uploadImage({
      fileName: "night.png",
      mimeType: "image/png",
      base64: pngBase64,
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
