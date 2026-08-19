import { describe, expect, it } from "vitest";
import { siteBrand } from "./siteBrand";

describe("site brand", () => {
  it("uses the uploaded Morro avatar and keeps an accessible identity", () => {
    expect(siteBrand.avatarSrc).toContain("/manus-storage/morro-blog-avatar_");
    expect(siteBrand.avatarAlt).toBe("MorroBlog 头像");
    expect(siteBrand.name).toBe("MORROBLOG");
    expect(siteBrand.subtitle).toBe("个人技术札记");
  });
});
