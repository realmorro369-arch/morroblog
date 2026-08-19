import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getAllGalleries: vi.fn(),
  getGalleryById: vi.fn(),
  getGalleryImages: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

const publicContext = { user: null, req: {}, res: {} } as unknown as TrpcContext;
const userContext = {
  user: { id: 6, openId: "reader-6", email: null, name: "Reader", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {},
  res: {},
} as unknown as TrpcContext;
const adminContext = {
  user: { id: 1, openId: "admin-1", email: null, name: "Admin", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {},
  res: {},
} as unknown as TrpcContext;

describe("gallery routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an honest empty list for visitors when no gallery exists", async () => {
    dbMocks.getAllGalleries.mockResolvedValue([]);

    await expect(appRouter.createCaller(publicContext).galleries.list({ page: 1, limit: 20 })).resolves.toEqual([]);
    expect(dbMocks.getAllGalleries).toHaveBeenCalledWith(20, 0);
  });

  it("returns a public gallery with its real ordered image records", async () => {
    const gallery = { id: 4, title: "Tokyo at night", description: "Field photographs", createdAt: new Date(), updatedAt: new Date() };
    const images = [{ id: 11, galleryId: 4, url: "/manus-storage/tokyo.webp", title: "Station", description: null, order: 0, createdAt: new Date() }];
    dbMocks.getGalleryById.mockResolvedValue(gallery);
    dbMocks.getGalleryImages.mockResolvedValue(images);

    await expect(appRouter.createCaller(publicContext).galleries.getById({ id: 4 })).resolves.toEqual({ ...gallery, images });
    expect(dbMocks.getGalleryImages).toHaveBeenCalledWith(4);
  });

  it("does not expose gallery creation to an ordinary user", async () => {
    await expect(appRouter.createCaller(userContext).galleries.create({ title: "Not allowed" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an admin to update gallery metadata while keeping the operation unavailable to ordinary users", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    dbMocks.getDb.mockResolvedValue({ update });
    dbMocks.getGalleryById.mockResolvedValue({ id: 4, title: "Before", description: null });

    await expect(appRouter.createCaller(userContext).galleries.update({ id: 4, title: "Not allowed" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(adminContext).galleries.update({ id: 4, title: "After", description: "Updated notes" })).resolves.toEqual({ success: true });

    expect(dbMocks.getGalleryById).toHaveBeenCalledWith(4);
    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({ title: "After", description: "Updated notes" });
  });

  it("keeps image binding behind the administrator role", async () => {
    await expect(appRouter.createCaller(userContext).galleries.addImage({
      galleryId: 4,
      url: "/manus-storage/blog/1/images/real-photo.jpg",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects missing galleries before attempting to insert an image record", async () => {
    const values = vi.fn();
    const insert = vi.fn(() => ({ values }));
    dbMocks.getDb.mockResolvedValue({ insert });
    dbMocks.getGalleryById.mockResolvedValue(undefined);

    await expect(appRouter.createCaller(adminContext).galleries.addImage({
      galleryId: 404,
      url: "/manus-storage/blog/1/images/real-photo.jpg",
    })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(values).not.toHaveBeenCalled();
  });

  it("rejects external, inline and non-integral image-binding input before database access", async () => {
    const caller = appRouter.createCaller(adminContext);

    await expect(caller.galleries.addImage({ galleryId: 4, url: "https://example.com/photo.jpg" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.galleries.addImage({ galleryId: 4, url: "data:image/jpeg;base64,AAAA" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.galleries.addImage({ galleryId: 0, url: "/manus-storage/blog/1/images/real-photo.jpg" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.galleries.addImage({ galleryId: 4.5, url: "/manus-storage/blog/1/images/real-photo.jpg" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.galleries.addImage({ galleryId: 4, url: "/manus-storage/blog/1/images/real-photo.jpg", order: -1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.galleries.addImage({ galleryId: 4, url: "/manus-storage/blog/1/images/real-photo.jpg", order: 0.5 })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(dbMocks.getGalleryById).not.toHaveBeenCalled();
  });

  it("writes a valid internal-storage image only after its gallery is confirmed", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 29 }]);
    const insert = vi.fn(() => ({ values }));
    dbMocks.getDb.mockResolvedValue({ insert });
    dbMocks.getGalleryById.mockResolvedValue({ id: 4, title: "Device control interface records", description: null });

    await expect(appRouter.createCaller(adminContext).galleries.addImage({
      galleryId: 4,
      url: "/manus-storage/blog/1/images/real-photo.jpg",
      title: "Control panel",
      description: "A real uploaded image",
      order: 3,
    })).resolves.toEqual({
      id: 29,
      galleryId: 4,
      url: "/manus-storage/blog/1/images/real-photo.jpg",
      title: "Control panel",
      description: "A real uploaded image",
      order: 3,
    });

    expect(dbMocks.getGalleryById).toHaveBeenCalledWith(4);
    expect(values).toHaveBeenCalledWith({
      galleryId: 4,
      url: "/manus-storage/blog/1/images/real-photo.jpg",
      title: "Control panel",
      description: "A real uploaded image",
      order: 3,
    });
  });
});
