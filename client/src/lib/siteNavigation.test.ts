import { describe, expect, it } from "vitest";
import { primaryNavigationItems, primaryNavigationLayout } from "./siteNavigation";

describe("primary navigation", () => {
  it("keeps every main section in the permanently rendered navigation", () => {
    expect(primaryNavigationItems.map((item) => item.label)).toEqual([
      "首页", "文章", "时间轴", "归档", "标签", "图片集", "关于",
    ]);
    expect(primaryNavigationLayout).toContain("grid-cols-7");
    expect(primaryNavigationLayout).toContain("lg:gap-5");
    expect(primaryNavigationLayout).toContain("lg:ml-auto");
    expect(primaryNavigationLayout).not.toContain("lg:ml-6");
    expect(primaryNavigationLayout).not.toContain("hidden");
  });
});
