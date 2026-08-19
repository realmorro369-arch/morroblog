import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("timeline and scene-transition experience contract", () => {
  it("organizes only real published posts into a dedicated lazy-loaded timeline", () => {
    const timeline = source("client/src/pages/Timeline.tsx");
    const app = source("client/src/App.tsx");
    const navigation = source("client/src/lib/siteNavigation.ts");

    expect(timeline).toContain("trpc.posts.list.useQuery({ page: 1, limit: 1000 })");
    expect(timeline).toContain("不会以示例内容填充时间线");
    expect(timeline).toContain("navigate(`/posts/${post.slug}`)");
    expect(app).toContain('lazy(() => import("./pages/Timeline"))');
    expect(app).toContain('path="/timeline"');
    expect(navigation).toContain('{ id: "timeline", label: "时间轴", href: "/timeline" }');
  });

  it("keeps differentiated page transitions and an explicit reduced-motion path", () => {
    const layout = source("client/src/components/BlogLayout.tsx");
    const css = source("client/src/index.css");

    expect(layout).toContain("useReducedMotion");
    expect(layout).toContain('pageScene === "workbench"');
    expect(layout).toContain('pageScene === "console"');
    expect(layout).toContain("<motion.div key={location}");
    expect(css).toContain(".timeline-rail::before");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});
