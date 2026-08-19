/**
 * React adaptation of Halo Console's `components/editor/DefaultEditor.vue` and `modules/contents/posts/PostEditor.vue`.
 * Upstream commit: d6616cf7031f6113cfb5c317dc88abd9e674c44e · GPL-3.0-or-later.
 * The untouched upstream files live in third_party/halo-console/; this component replaces Vue/Halo APIs with React, tRPC and Markdown persistence.
 */
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { createLowlight, common } from "lowlight";
import { marked } from "marked";
import { AlignCenter, AlignLeft, AlignRight, Bold, CheckSquare, Code2, Heading1, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Redo2, Strikethrough, Table2, Underline as UnderlineIcon, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { trpc } from "@/lib/trpc";

type HaloPostEditorProps = { value: string; onChange: (value: string) => void; placeholder?: string; allowImageUpload?: boolean };
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"] as const;
const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
const lowlight = createLowlight(common);

function markdownToHtml(markdown: string) { return marked.parse(markdown || "", { async: false, gfm: true }) as string; }
function htmlToMarkdown(html: string) {
  const service = new TurndownService({ bulletListMarker: "-", codeBlockStyle: "fenced", emDelimiter: "_" });
  service.use(gfm);
  return service.turndown(html).trimEnd();
}
function readAsBase64(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("无法读取图片文件")); reader.onload = () => { const value = String(reader.result); const base64 = value.split(",")[1]; base64 ? resolve(base64) : reject(new Error("图片编码失败")); }; reader.readAsDataURL(file); }); }

export default function HaloPostEditor({ value, onChange, placeholder = "输入 / 以选择输入类型", allowImageUpload = true }: HaloPostEditorProps) {
  const uploadMutation = trpc.media.uploadImage.useMutation();
  const [activeSide, setActiveSide] = useState<"outline" | "details">("outline");
  const lastEmitted = useRef(value);
  const uploadImageFile = useCallback(async (file: File) => {
    if (!IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])) throw new Error("仅支持 JPG、PNG、WebP、GIF 或 AVIF 图片");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("图片不得超过 30MB");
    const base64 = await readAsBase64(file);
    const result = await uploadMutation.mutateAsync({ fileName: file.name, mimeType: file.type as (typeof IMAGE_TYPES)[number], base64 });
    return result.url;
  }, [uploadMutation]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }), CodeBlockLowlight.configure({ lowlight }), Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { loading: "lazy" } }),
      TaskList, TaskItem.configure({ nested: true }), Link.configure({ autolink: true, openOnClick: false }), TextAlign.configure({ types: ["heading", "paragraph"] }), Underline,
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell, Subscript, Superscript, Highlight, CharacterCount, Placeholder.configure({ placeholder }),
    ],
    content: markdownToHtml(value),
    autofocus: "start",
    editorProps: {
      attributes: { class: "halo-editor-canvas", "aria-label": "文章正文" },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files || []).filter(file => file.type.startsWith("image/"));
        if (!files.length || !allowImageUpload) return false;
        event.preventDefault();
        void Promise.all(files.map(uploadImageFile)).then(urls => editor?.chain().focus().insertContent(urls.map(src => ({ type: "image", attrs: { src } }))).run()).catch(() => undefined);
        return true;
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []).filter(file => file.type.startsWith("image/"));
        if (!files.length || !allowImageUpload) return false;
        event.preventDefault();
        void Promise.all(files.map(uploadImageFile)).then(urls => editor?.chain().focus().insertContent(urls.map(src => ({ type: "image", attrs: { src } }))).run()).catch(() => undefined);
        return true;
      },
    },
    onUpdate: ({ editor: activeEditor }) => { const next = htmlToMarkdown(activeEditor.getHTML()); lastEmitted.current = next; onChange(next); },
  }, [allowImageUpload, placeholder]);

  useEffect(() => { if (!editor || value === lastEmitted.current) return; editor.commands.setContent(markdownToHtml(value), { emitUpdate: false }); }, [editor, value]);

  const headings = useMemo(() => value.split("\n").flatMap((line, index) => { const match = /^(#{1,6})\s+(.+)$/.exec(line); return match ? [{ id: `heading-${index + 1}`, level: match[1].length, text: match[2] }] : []; }), [value]);
  const insertImage = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file || !editor) return; try { const src = await uploadImageFile(file); editor.chain().focus().setImage({ src }).run(); } catch (error) { window.alert(error instanceof Error ? error.message : "图片上传失败"); } };
  const toolbar = [
    { label: "撤销", icon: Undo2, action: () => editor?.chain().focus().undo().run(), active: false }, { label: "重做", icon: Redo2, action: () => editor?.chain().focus().redo().run(), active: false },
    { label: "标题一", icon: Heading1, action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive("heading", { level: 1 }) }, { label: "标题二", icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) }, { label: "标题三", icon: Heading3, action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive("heading", { level: 3 }) },
    { label: "加粗", icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") }, { label: "斜体", icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") }, { label: "下划线", icon: UnderlineIcon, action: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive("underline") }, { label: "删除线", icon: Strikethrough, action: () => editor?.chain().focus().toggleStrike().run(), active: editor?.isActive("strike") },
    { label: "引用", icon: Quote, action: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive("blockquote") }, { label: "代码块", icon: Code2, action: () => editor?.chain().focus().toggleCodeBlock().run(), active: editor?.isActive("codeBlock") }, { label: "无序列表", icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList") }, { label: "有序列表", icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList") }, { label: "任务列表", icon: CheckSquare, action: () => editor?.chain().focus().toggleTaskList().run(), active: editor?.isActive("taskList") },
    { label: "左对齐", icon: AlignLeft, action: () => editor?.chain().focus().setTextAlign("left").run(), active: editor?.isActive({ textAlign: "left" }) }, { label: "居中", icon: AlignCenter, action: () => editor?.chain().focus().setTextAlign("center").run(), active: editor?.isActive({ textAlign: "center" }) }, { label: "右对齐", icon: AlignRight, action: () => editor?.chain().focus().setTextAlign("right").run(), active: editor?.isActive({ textAlign: "right" }) }, { label: "表格", icon: Table2, action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), active: editor?.isActive("table") },
  ];

  if (!editor) return <div className="halo-editor-loading">正在初始化编辑器…</div>;
  return <section className="halo-editor-shell"><div className="halo-editor-toolbar" aria-label="编辑器工具栏">{toolbar.map(item => <button type="button" key={item.label} onClick={item.action} aria-label={item.label} title={item.label} className={item.active ? "is-active" : ""}><item.icon size={15} /></button>)}{allowImageUpload && <label className="halo-upload-button" title="插入附件"><ImagePlus size={15} /><span>附件</span><input type="file" accept={IMAGE_TYPES.join(",")} onChange={insertImage} /></label>}</div><div className="halo-editor-body"><div className="min-w-0"><EditorContent editor={editor} /></div><aside className="halo-editor-sidebar"><div className="flex border-b border-white/[0.13]"><button type="button" onClick={() => setActiveSide("outline")} className={activeSide === "outline" ? "is-active" : ""}>大纲</button><button type="button" onClick={() => setActiveSide("details")} className={activeSide === "details" ? "is-active" : ""}>详情</button></div>{activeSide === "outline" ? <div className="p-3">{headings.length ? <nav aria-label="文章大纲" className="grid gap-1">{headings.map(heading => <button key={heading.id} type="button" onClick={() => document.querySelector<HTMLElement>(`.halo-editor-canvas h${heading.level}:nth-of-type(1)`)?.scrollIntoView({ behavior: "smooth", block: "center" })} style={{ paddingLeft: `${(heading.level - 1) * 10 + 8}px` }} className="halo-outline-item">{heading.text}</button>)}</nav> : <p className="px-2 py-8 text-center text-xs text-[#91a7ac]">暂无大纲</p>}</div> : <div className="grid gap-2 p-3"><div className="halo-editor-stat"><span>字符数</span><strong>{editor.storage.characterCount.characters().toLocaleString()}</strong></div><div className="halo-editor-stat"><span>词数</span><strong>{editor.storage.characterCount.words().toLocaleString()}</strong></div><div className="halo-editor-stat"><span>格式</span><strong>Markdown</strong></div></div>}</aside></div></section>;
}
