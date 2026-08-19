import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("Halo 内容与媒体适配契约", () => {
  it("保留上游 PostEditor、DefaultEditor 与附件库原始来源，并在归属文件中登记", () => {
    expect(source("third_party/halo-console/src/modules/contents/posts/PostEditor.vue")).toContain("VPageHeader title=\"文章\"");
    expect(source("third_party/halo-console/src/components/editor/DefaultEditor.vue")).toContain("RichTextEditor");
    expect(source("third_party/halo-console/src/modules/contents/attachments/AttachmentList.vue")).toContain("VPageHeader title=\"附件库\"");
    const attribution = source("THIRD_PARTY_CONSOLE_ATTRIBUTION.md");
    expect(attribution).toContain("PostEditor.vue");
    expect(attribution).toContain("DefaultEditor.vue");
    expect(attribution).toContain("AttachmentList.vue");
  });

  it("Halo 编辑适配保留工具栏、大纲、详情、拖放与粘贴图片链路", () => {
    const editor = source("client/src/components/HaloPostEditor.tsx");
    expect(editor).toContain("handleDrop");
    expect(editor).toContain("handlePaste");
    expect(editor).toContain("halo-editor-toolbar");
    expect(editor).toContain("大纲");
    expect(editor).toContain("详情");
    expect(editor).toContain("图片不得超过 30MB");
  });

  it("图片集显式限制单文件 30MB，并提供 Halo 附件库式筛选、视图切换与刷新", () => {
    const dashboard = source("client/src/pages/AdminDashboard.tsx");
    const router = source("server/routers.ts");
    expect(dashboard).toContain("maxSize={30}");
    expect(dashboard).toContain("过滤当前图片集");
    expect(dashboard).toContain("mediaView");
    expect(dashboard).toContain("刷新图片集");
    expect(router).toContain("图片不得超过 30MB");
  });
});
