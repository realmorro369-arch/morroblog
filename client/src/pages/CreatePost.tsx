import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import MarkdownEditor from "@/components/MarkdownEditor";
import ImageUpload from "@/components/ImageUpload";
import { Check, ChevronLeft, FileText, Save, Send, Settings2, X } from "lucide-react";
import { toast } from "sonner";

const toSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "");

export default function CreatePost() {
  const { isAuthenticated, loading: isAuthLoading } = useAuth();
  const [, navigate] = useLocation();
  const [, editParams] = useRoute("/edit/:id");
  const [, consoleEditParams] = useRoute("/admin/content/:id/edit");
  const [isConsoleNew] = useRoute("/admin/content/new");
  const isConsoleEditor = Boolean(consoleEditParams?.id || isConsoleNew);
  const editId = Number(editParams?.id || consoleEditParams?.id || 0);
  const isEditing = editId > 0;
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugLocked, setSlugLocked] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadedEditId, setLoadedEditId] = useState<number | null>(null);
  const [cleanSnapshot, setCleanSnapshot] = useState(() => JSON.stringify({ title: "", slug: "", excerpt: "", coverImage: "", content: "", categoryId: null, tagIds: [] }));

  const { data: tags } = trpc.tags.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: editablePost, isLoading: isEditLoading, error: editError } = trpc.posts.getForEdit.useQuery({ id: editId }, { enabled: isEditing });
  const createMutation = trpc.posts.create.useMutation();
  const updateMutation = trpc.posts.update.useMutation();
  useEffect(() => {
    if (!editablePost || loadedEditId === editablePost.id) return;
    setTitle(editablePost.title); setSlug(editablePost.slug); setSlugLocked(true); setExcerpt(editablePost.excerpt || ""); setCoverImage(editablePost.coverImage || ""); setContent(editablePost.content); setCategoryId(editablePost.categoryId || undefined); setTagIds(editablePost.tags.map((tag: any) => tag.id));
    setCleanSnapshot(JSON.stringify({ title: editablePost.title, slug: editablePost.slug, excerpt: editablePost.excerpt || "", coverImage: editablePost.coverImage || "", content: editablePost.content, categoryId: editablePost.categoryId || null, tagIds: editablePost.tags.map((tag: any) => tag.id) }));
    setLoadedEditId(editablePost.id);
  }, [editablePost, loadedEditId]);

  const currentSnapshot = JSON.stringify({ title, slug, excerpt, coverImage, content, categoryId: categoryId ?? null, tagIds });
  const dirty = currentSnapshot !== cleanSnapshot;
  const canSubmit = Boolean(title.trim() && slug.trim() && content.trim());
  const wordCount = content.replace(/\s/g, "").length;
  const readingMinutes = useMemo(() => Math.max(1, Math.ceil(wordCount / 400)), [wordCount]);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const canSaveDraft = !isEditing || editablePost?.status === "draft";
  const changeTitle = (nextTitle: string) => { setTitle(nextTitle); if (!slugLocked) setSlug(toSlug(nextTitle)); };
  const toggleTag = (id: number) => setTagIds((current) => current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]);
  const persist = (status: "draft" | "published") => {
    if (isEditing) {
      updateMutation.mutate({ id: editId, title: title.trim(), slug: slug.trim(), content, excerpt: excerpt.trim() || null, coverImage: coverImage.trim() || null, categoryId: categoryId ?? null, tagIds, status }, {
        onSuccess: () => {
        if (status === "draft") { setCleanSnapshot(currentSnapshot); toast.success("草稿已保存，仍可继续编辑"); return; }
          toast.success("文章已更新");
          navigate(`/posts/${slug}`);
        },
        onError: (error) => toast.error(error.message),
      });
      return;
    }
    createMutation.mutate({ title: title.trim(), slug: slug.trim(), content, excerpt: excerpt.trim() || undefined, coverImage: coverImage.trim() || undefined, categoryId, tagIds, status }, {
      onSuccess: (created) => {
        if (status === "draft") { toast.success("草稿已创建，正在打开工作台"); navigate(isConsoleEditor ? `/admin/content/${created.id}/edit` : `/edit/${created.id}`); return; }
        toast.success("文章已发布");
        navigate(`/posts/${created.slug}`);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  useEffect(() => {
    const confirmUnsaved = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", confirmUnsaved);
    return () => window.removeEventListener("beforeunload", confirmUnsaved);
  }, [dirty]);

  useEffect(() => {
    const saveWithShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (canSaveDraft && canSubmit && !isSubmitting) persist("draft");
      }
    };
    window.addEventListener("keydown", saveWithShortcut);
    return () => window.removeEventListener("keydown", saveWithShortcut);
  }, [canSaveDraft, canSubmit, isSubmitting, persist]);

  if (isAuthLoading) return <div className="grid min-h-[55vh] place-items-center"><p className="text-sm text-[#e5e2db]">正在打开写作页…</p></div>;
  if (!isAuthenticated) return <div className="grid min-h-[55vh] place-items-center text-center"><div className="border-y border-white/[0.25] px-7 py-10"><p className="text-sm text-[#e5e2db]">登录后才能新建或编辑自己的文章</p><h1 className="display-title mt-4 text-4xl">先写下过程，<br />细节可以慢慢补。</h1><Button onClick={() => navigate("/")} className="editorial-button mt-7 px-5">返回首页登录</Button></div></div>;
  if (isEditing && isEditLoading) return <div className="grid min-h-[55vh] place-items-center"><p className="text-sm text-[#e5e2db]">正在载入文章…</p></div>;
  if (isEditing && editError) return <div className="grid min-h-[55vh] place-items-center text-center"><div className="border-y border-white/[0.25] px-7 py-10"><p className="text-sm text-[#e5e2db]">暂时无法打开这篇文章</p><h1 className="display-title mt-4 text-4xl">你可能没有编辑权限，<br />或文章已不存在。</h1><p className="mt-4 text-sm text-[#e5e2db]">{editError.message}</p><Button onClick={() => navigate("/posts")} className="editorial-button mt-7 px-5">回到文章列表</Button></div></div>;

  return <div className="pb-16"><header className="sticky top-3 z-30 mx-auto max-w-6xl border-y border-white/[0.28] bg-[#3a4a54]/84 px-3 py-2 backdrop-blur-xl sm:px-4"><div className="mx-auto flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><button onClick={() => navigate(isConsoleEditor ? "/admin" : "/workspace")} className="grid h-9 w-9 shrink-0 place-items-center border border-white/[0.28] text-[#f0ede7] hover:border-[#d0f4ee] hover:text-[#d0f4ee]" aria-label={isConsoleEditor ? "返回管理中心" : "返回我的文章"}><ChevronLeft size={16} /></button><div className="min-w-0"><p className="truncate text-xs font-medium text-[#fff8ed]">{title || (isEditing ? "正在编辑文章" : "未命名文章")}</p><p className={`mt-0.5 text-[11px] ${dirty ? "text-[#fff0df]" : "text-[#d0cfca]"}`}>{dirty ? "有未保存的修改" : isEditing ? (editablePost?.status === "published" ? "已发布，暂无新修改" : "草稿已保存") : "尚未保存"} · 正文 {wordCount.toLocaleString()} 字 · 约 {readingMinutes} 分钟</p></div></div><div className="flex items-center gap-1.5"><Button type="button" onClick={() => setSettingsOpen(true)} variant="ghost" className="h-9 gap-1.5 px-2.5 text-xs text-[#f0ede7] hover:bg-white/[0.08] hover:text-[#d0f4ee]"><Settings2 size={14} /><span className="hidden sm:inline">设置</span></Button>{canSaveDraft && <Button disabled={isSubmitting || !canSubmit} onClick={() => persist("draft")} variant="ghost" className="hidden h-9 px-2.5 text-xs text-[#fff8ed] hover:bg-white/[0.08] sm:inline-flex"><Save size={13} className="mr-1.5" />保存草稿<span className="ml-1 hidden font-mono text-[10px] text-[#d0cfca] lg:inline">⌘S</span></Button>}<Button disabled={isSubmitting || !canSubmit} onClick={() => persist("published")} className="editorial-button editorial-button-primary h-9 px-3.5 text-xs">{isSubmitting ? "正在处理…" : <><Send size={13} className="mr-1.5" />{isEditing ? "更新文章" : "发布文章"}</>}</Button></div></div></header>

    <main className="mx-auto max-w-[860px] pt-12 sm:pt-16"><div className="border-l border-[#eab78c] px-5 py-3 sm:px-8"><div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#d0cfca]"><span>{isEditing ? "编辑文章" : "新建文章"}</span><span className="h-1 w-1 rounded-full bg-[#eab78c]" /><span>文稿 → 设置 → {isEditing ? "更新" : "发布"}</span></div><Input value={title} onChange={(event) => changeTitle(event.target.value)} placeholder="给这篇文章起一个明确的标题" className="mt-4 h-auto border-0 bg-transparent px-0 py-0 font-serif text-4xl leading-tight text-[#fff8ed] placeholder:text-[#c4c6c2] focus-visible:ring-0 sm:text-6xl" /><p className="mt-5 max-w-xl text-sm leading-7 text-[#e5e2db]">先写正文；分类、标签、封面、摘要和链接可在右上角的设置中补充。草稿保存后会留在当前工作台，不会打断写作。</p></div><section className="border-t border-white/[0.2] pt-5"><MarkdownEditor value={content} onChange={setContent} placeholder="从这里开始：写下问题、过程、依据和暂时的结论。" /></section>{(createMutation.error || updateMutation.error) && <p className="mt-5 border-l-2 border-[#eab78c] bg-[#eab78c]/15 px-4 py-3 text-sm text-[#fff0df]">{createMutation.error?.message || updateMutation.error?.message}</p>}<footer className="mt-8 flex flex-col justify-between gap-4 border-y border-white/[0.2] px-1 py-4 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-[#d0cfca]">{isEditing ? "更新会直接反映到公开页面；未保存的修改离开页面前会请求确认。" : "草稿只保存在你的工作区；发布后才会出现在公开文章列表。"}</p><div className="flex gap-2 sm:hidden">{canSaveDraft && <Button disabled={isSubmitting || !canSubmit} onClick={() => persist("draft")} variant="ghost" className="editorial-button px-3 text-xs"><Save size={13} className="mr-1" />保存草稿</Button>}<Button disabled={isSubmitting || !canSubmit} onClick={() => persist("published")} className="editorial-button editorial-button-primary px-3 text-xs"><Send size={13} className="mr-1" />{isEditing ? "更新文章" : "发布文章"}</Button></div></footer></main>

    {settingsOpen && <div className="fixed inset-0 z-50"><button aria-label="关闭文档设置" onClick={() => setSettingsOpen(false)} className="absolute inset-0 bg-[#18252d]/55 backdrop-blur-sm" /><aside className="absolute inset-x-0 bottom-0 flex max-h-[86vh] w-full flex-col rounded-t-[1.1rem] border border-white/[0.3] bg-[#40515c] shadow-2xl sm:inset-y-0 sm:left-auto sm:max-h-none sm:max-w-md sm:rounded-none sm:border-y-0 sm:border-l"><div className="flex items-center justify-between border-b border-white/[0.2] px-5 py-5"><div><p className="text-sm text-[#e5e2db]">文章设置</p><h2 className="mt-1 text-xl text-[#fff8ed]">补全文章信息</h2></div><button onClick={() => setSettingsOpen(false)} className="grid h-9 w-9 place-items-center border border-white/[0.3] text-[#f0ede7] hover:border-[#d0f4ee] hover:text-[#d0f4ee]" aria-label="关闭"><X size={16} /></button></div><div className="flex-1 overflow-y-auto px-5 py-6"><section><label className="text-sm font-medium text-[#f0ede7]">文章链接</label><Input value={slug} onChange={(event) => { setSlugLocked(true); setSlug(toSlug(event.target.value)); }} placeholder="例如：my-small-experiment" className="quiet-input mt-3 h-11 px-3 font-mono text-xs" /><p className="mt-2 text-xs leading-5 text-[#d0cfca]">发布后地址：/posts/{slug || "文章链接"}</p></section><section className="mt-8 border-t border-white/[0.2] pt-6"><label className="text-sm font-medium text-[#f0ede7]">摘要</label><textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="用一两句话说明读者会从这篇文章得到什么。" className="quiet-input mt-3 min-h-28 w-full resize-y p-3 text-sm leading-7" /></section><section className="mt-8 border-t border-white/[0.2] pt-6"><label className="text-sm font-medium text-[#f0ede7]">分类</label><select value={categoryId ?? ""} onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : undefined)} className="quiet-input mt-3 h-11 w-full px-3 text-sm"><option value="">未分类</option>{categories?.map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></section><section className="mt-8 border-t border-white/[0.2] pt-6"><label className="text-sm font-medium text-[#f0ede7]">标签</label><div className="mt-3 flex flex-wrap gap-2">{tags?.length ? tags.map((tag: any) => <button key={tag.id} onClick={() => toggleTag(tag.id)} className={`border-b px-1 py-2 text-xs transition-colors ${tagIds.includes(tag.id) ? "border-[#d0f4ee] text-[#d0f4ee]" : "border-transparent text-[#f0ede7] hover:border-white/[0.5]"}`}>{tagIds.includes(tag.id) && <Check size={12} className="mr-1 inline" />}#{tag.name}</button>) : <p className="text-xs text-[#d0cfca]">尚未创建标签；可在管理员后台新增。</p>}</div></section><section className="mt-8 border-t border-white/[0.2] pt-6"><ImageUpload value={coverImage} onUpload={setCoverImage} label="封面图片" /><label className="mt-5 block text-xs leading-5 text-[#d0cfca]">也可以粘贴公开图片或 `/manus-storage/` 中已有图片的地址。</label><Input value={coverImage} onChange={(event) => setCoverImage(event.target.value)} placeholder="https://…" className="quiet-input mt-2 h-11 px-3 text-sm" /></section></div><div className="border-t border-white/[0.2] px-5 py-4"><p className="flex items-center gap-2 text-xs text-[#e5e2db]"><FileText size={13} />正文 {wordCount.toLocaleString()} 字 · {content.length.toLocaleString()} 个字符</p></div></aside></div>}
  </div>;
}
