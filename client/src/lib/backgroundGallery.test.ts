import { describe, expect, it } from "vitest";
import { chooseBackgroundImage, resolveManagedBackgroundImages, safeBackgroundImages } from "./backgroundGallery";

describe("safe background gallery", () => {
  it("only chooses from the approved image list", () => {
    const images = [
      { id: "a", src: "/a.webp", alt: "A" },
      { id: "b", src: "/b.webp", alt: "B" },
    ] as const;

    expect(chooseBackgroundImage(images, 0)?.id).toBe("a");
    expect(chooseBackgroundImage(images, 0.999)?.id).toBe("b");
  });

  it("falls back safely when the approved list is empty", () => {
    expect(chooseBackgroundImage([], 0.5)).toBeUndefined();
    expect(safeBackgroundImages.length).toBeGreaterThan(0);
  });

  it("uses only configured Manus storage backgrounds and falls back safely when none are configured", () => {
    expect(resolveManagedBackgroundImages(["https://example.com/unsafe.jpg", "/manus-storage/approved.jpg", "/manus-storage/approved.jpg"])).toEqual([
      expect.objectContaining({ src: "/manus-storage/approved.jpg" }),
    ]);
    expect(resolveManagedBackgroundImages(["https://example.com/unsafe.jpg"])).toBe(safeBackgroundImages);
  });
});
