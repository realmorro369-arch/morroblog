import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ImageUpload from "@/components/ImageUpload";
import DashboardLayout, { type ConsoleSection } from "@/components/DashboardLayout";
import { resolveSiteSettings } from "@/lib/siteSettings";
import { Check, ChevronLeft, Clock3, FileText, FolderOpen, Grid, Image as ImageIcon, ImagePlus, List, Pencil, RefreshCw, Search, ShieldCheck, Trash2, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "");
const formatDate = (value: Date | string | null) => value ? new Date(value).toLocaleDateString("zh-CN") : "—";

function defaultSiteSettingsDraft() {
  const fallback = resolveSiteSettings(null);
  return {
    siteName: fallback.name, siteSubtitle: fallback.subtitle, avatarSrc: fallback.avatarSrc, avatarAlt: fallback.avatarAlt,
    authorName: fallback.author.name, authorLabel: fallback.author.label, authorIntroduction: fallback.author.introduction,
    authorInterests: fallback.author.interests.join(", "), statusLabel: fallback.author.now.label, statusText: fallback.author.now.text,
    statusUpdatedLabel: fallback.author.now.updatedLabel, githubLabel: fallback.author.contact.github.label,
    githubHandle: fallback.author.contact.github.handle, githubHref: fallback.author.contact.github.href,
    emailLabel: fallback.author.contact.email.label, emailAddress: fallback.author.contact.email.address,
    emailHref: fallback.author.contact.email.href, homeOpeningTitle: fallback.home.openingTitle,
    homeOpeningDescription: fallback.home.openingDescription, quoteFallback: fallback.quoteFallback,
    featuredPostIds: "", backgroundWhitelist: "", navigationOrder: fallback.navigationOrder.join(", "),
  };
}

type SiteSettingsDraft = ReturnType<typeof defaultSiteSettingsDraft>;
type SiteSettingsField = keyof SiteSettingsDraft;

function Panel({ label, title, count, children }: { label: string; title: string; count?: number; children: React.ReactNode }) {
  return <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><p className="text-xs text-slate-400">{label}</p><h2 className="mt-1 text-base font-semibold text-slate-800">{title}</h2></div>{count !== undefined && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">{count} 条</span>}</div><div className="p-5">{children}</div></section>;
}

function Empty({ title, description }: { title: string; description: string }) {
  return <div className="grid min-h-44 place-items-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-5 text-center"><div><p className="text-sm font-medium text-slate-700">{title}</p><p className="mt-3 text-sm text-slate-500">{description}</p></div></div>;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState<ConsoleSection>("overview");
  const { data: overviewPosts, refetch: refreshPosts, isFetching: refreshingPosts } = trpc.admin.posts.list.useQuery({ page: 1, limit: 50 }, { enabled: user?.role === "admin" });
  const { data: overviewComments, refetch: refreshComments, isFetching: refreshingComments } = trpc.admin.comments.pending.useQuery({ page: 1, limit: 50 }, { enabled: user?.role === "admin" });

  if (loading) return <div className="grid min-h-[45vh] place-items-center"><p className="text-sm text-[#e5e2db]">正在验证管理员权限…</p></div>;
  if (user?.role !== "admin") return <div className="grid min-h-[55vh] place-items-center text-center"><div className="border-y border-white/[0.25] px-7 py-10"><p className="text-sm text-[#e5e2db]">此页面只对管理员开放</p><h1 className="display-title mt-4 text-4xl">当前账号没有<br />后台管理权限。</h1><Button onClick={() => navigate("/")} className="editorial-button mt-7 px-5">返回首页</Button></div></div>;

  const publishedCount = overviewPosts?.filter((post: any) => post.status === "published").length || 0;
  const draftCount = overviewPosts?.filter((post: any) => post.status === "draft").length || 0;
  const refreshOverview = async () => { await Promise.all([refreshPosts(), refreshComments()]); toast.success("后台概览已刷新"); };

  const consoleMeta: Record<ConsoleSection, { title: string; description: string }> = {
    overview: { title: "仪表盘", description: "查看当前站点的真实内容状态与待处理事项。" },
    posts: { title: "文章", description: "管理已发布文章与草稿，不创建演示内容。" },
    comments: { title: "评论", description: "处理真实访客提交的待审核评论。" },
    terms: { title: "标签与分类", description: "维护用于内容索引的真实术语。" },
    gallery: { title: "图片集", description: "整理公开图库中的真实图片与图片集。" },
    settings: { title: "站点设置", description: "维护公开站点身份、首页文案与经过白名单校验的展示配置。" },
    users: { title: "用户", description: "查看站内账号角色与最近登录信息。" },
  };
  const meta = consoleMeta[selectedTab];

  return <DashboardLayout activeSection={selectedTab} onSectionChange={setSelectedTab}><div className="halo-console-page pb-10">
    <section className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-semibold tracking-tight text-slate-800">{meta.title}</h1><p className="mt-1 text-sm text-slate-500">{meta.description}</p></div><div className="flex items-center gap-2">{selectedTab === "overview" && <Button variant="outline" onClick={() => void refreshOverview()} disabled={refreshingPosts || refreshingComments} className="h-9 border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50"><RefreshCw size={14} className={`mr-1.5 ${refreshingPosts || refreshingComments ? "animate-spin" : ""}`} />刷新</Button>}{selectedTab === "posts" && <Button onClick={() => navigate("/admin/content/new")} className="h-9 bg-[#2d8a86] px-3 text-sm text-white hover:bg-[#23716e]"><Pencil size={14} className="mr-1.5" />写文章</Button>}</div></section>
    <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as ConsoleSection)}><TabsList className="sr-only"><TabsTrigger value="overview">概览</TabsTrigger><TabsTrigger value="posts">文章</TabsTrigger><TabsTrigger value="comments">审核</TabsTrigger><TabsTrigger value="terms">标签与分类</TabsTrigger><TabsTrigger value="gallery">图片集</TabsTrigger><TabsTrigger value="settings">站点设置</TabsTrigger><TabsTrigger value="users">用户</TabsTrigger></TabsList>
      <TabsContent value="overview" className="mt-0"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><button type="button" onClick={() => setSelectedTab("posts")} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"><p className="text-sm text-slate-500">已发布文章</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-800">{publishedCount}</p><p className="mt-4 text-xs text-[#2d8a86]">查看文章 <ChevronLeft size={12} className="ml-1 inline rotate-180" /></p></button><button type="button" onClick={() => setSelectedTab("posts")} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"><p className="text-sm text-slate-500">草稿</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-800">{draftCount}</p><p className="mt-4 text-xs text-[#2d8a86]">继续编辑 <ChevronLeft size={12} className="ml-1 inline rotate-180" /></p></button><button type="button" onClick={() => setSelectedTab("comments")} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"><p className="text-sm text-slate-500">待审核评论</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-800">{overviewComments?.length || 0}</p><p className="mt-4 text-xs text-[#2d8a86]">处理评论 <ChevronLeft size={12} className="ml-1 inline rotate-180" /></p></button><button type="button" onClick={() => navigate("/admin/content/new")} className="rounded-lg border border-[#2d8a86]/35 bg-[#eff8f7] p-5 text-left shadow-sm transition-shadow hover:shadow-md"><p className="text-sm text-[#397875]">快速操作</p><p className="mt-3 text-lg font-semibold text-[#215f5c]">创建一篇文章</p><p className="mt-5 text-xs text-[#2d8a86]">打开编辑器 <ChevronLeft size={12} className="ml-1 inline rotate-180" /></p></button></div><div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]"><Panel label="最近内容" title="文章状态"><div className="divide-y divide-slate-100">{overviewPosts?.slice(0, 6).map((post: any) => <button type="button" key={post.id} onClick={() => navigate(`/admin/content/${post.id}/edit`)} className="flex w-full items-center justify-between gap-4 py-3 text-left hover:bg-slate-50"><span className="min-w-0 truncate text-sm font-medium text-slate-700">{post.title}</span><span className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${post.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{post.status === "published" ? "已发布" : "草稿"}</span></button>) || <Empty title="暂时没有文章记录" description="创建真实草稿或发布文章后会显示在这里。" />}</div></Panel><Panel label="快捷入口" title="继续管理"><div className="grid gap-2"><button type="button" onClick={() => setSelectedTab("gallery")} className="flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50">管理图片集 <ChevronLeft size={14} className="rotate-180 text-slate-400" /></button><button type="button" onClick={() => setSelectedTab("terms")} className="flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50">维护标签与分类 <ChevronLeft size={14} className="rotate-180 text-slate-400" /></button><button type="button" onClick={() => setSelectedTab("users")} className="flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50">查看用户 <ChevronLeft size={14} className="rotate-180 text-slate-400" /></button></div></Panel></div></TabsContent>
      <TabsContent value="posts" className="mt-0"><PostsManagement /></TabsContent><TabsContent value="comments" className="mt-0"><CommentsModeration /></TabsContent><TabsContent value="terms" className="mt-0"><TermsManagement /></TabsContent><TabsContent value="gallery" className="mt-0"><GalleryManagement /></TabsContent><TabsContent value="settings" className="mt-0"><SiteSettingsManagement /></TabsContent><TabsContent value="users" className="mt-0"><UsersDirectory /></TabsContent>
    </Tabs>
  </div></DashboardLayout>;

}

function SiteSettingsManagement() {
  const { data: persisted, isLoading, refetch } = trpc.admin.siteSettings.get.useQuery();
  const [draft, setDraft] = useState<SiteSettingsDraft>(defaultSiteSettingsDraft);
  useEffect(() => {
    if (!persisted) return;
    const settings = resolveSiteSettings(persisted);
    setDraft({
      siteName: settings.name, siteSubtitle: settings.subtitle, avatarSrc: settings.avatarSrc, avatarAlt: settings.avatarAlt,
      authorName: settings.author.name, authorLabel: settings.author.label, authorIntroduction: settings.author.introduction,
      authorInterests: settings.author.interests.join(", "), statusLabel: settings.author.now.label, statusText: settings.author.now.text,
      statusUpdatedLabel: settings.author.now.updatedLabel, githubLabel: settings.author.contact.github.label,
      githubHandle: settings.author.contact.github.handle, githubHref: settings.author.contact.github.href,
      emailLabel: settings.author.contact.email.label, emailAddress: settings.author.contact.email.address,
      emailHref: settings.author.contact.email.href, homeOpeningTitle: settings.home.openingTitle,
      homeOpeningDescription: settings.home.openingDescription, quoteFallback: settings.quoteFallback,
      featuredPostIds: settings.featuredPostIds.join(", "), backgroundWhitelist: settings.backgroundWhitelist.join("\n"), navigationOrder: settings.navigationOrder.join(", "),
    });
  }, [persisted?.updatedAt]);
  const saveMutation = trpc.admin.siteSettings.save.useMutation({
    onSuccess: () => { toast.success("站点设置已保存，公开页面将在下次读取时更新"); void refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const update = (field: SiteSettingsField, value: string) => setDraft(current => ({ ...current, [field]: value }));
  const field = (key: SiteSettingsField, label: string, type: "text" | "email" | "url" = "text") => <label className="grid gap-2 text-sm text-slate-700"><span>{label}</span><Input type={type} value={draft[key]} onChange={(event) => update(key, event.target.value)} className="border-slate-200 bg-white text-slate-800" /></label>;
  const textarea = (key: SiteSettingsField, label: string, hint?: string) => <label className="grid gap-2 text-sm text-slate-700"><span>{label}</span>{hint && <span className="-mt-1 text-xs text-slate-400">{hint}</span>}<textarea value={draft[key]} onChange={(event) => update(key, event.target.value)} className="min-h-24 rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#2d8a86] focus:ring-2 focus:ring-[#2d8a86]/15" /></label>;
  const save = () => saveMutation.mutate({
    ...draft,
    authorInterests: draft.authorInterests.split(",").map(item => item.trim()).filter(Boolean),
    featuredPostIds: draft.featuredPostIds.split(",").map(item => Number(item.trim())).filter(value => Number.isInteger(value) && value > 0),
    backgroundWhitelist: draft.backgroundWhitelist.split("\n").map(item => item.trim()).filter(Boolean),
    navigationOrder: draft.navigationOrder.split(",").map(item => item.trim()).filter((item): item is "home" | "posts" | "timeline" | "archives" | "tags" | "gallery" | "about" => ["home", "posts", "timeline", "archives", "tags", "gallery", "about"].includes(item)),
  });
  if (isLoading) return <Panel label="站点设置" title="加载配置"><p className="text-sm text-slate-500">正在读取已保存的站点设置…</p></Panel>;
  return <Panel label="公开站点" title="站点设置"><div className="border-b border-slate-100 pb-5 text-sm leading-6 text-slate-500">保存后，首页、作者身份卡和公开导航会从持久化配置读取。未保存时公开页继续使用稳定回退配置；不会生成文章、评论、图片或其他示例数据。</div><div className="grid gap-8 py-6"><section className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><p className="text-xs font-medium tracking-wide text-[#2d8a86]">站点识别</p></div>{field("siteName", "站点名称")}{field("siteSubtitle", "站点副标题")}{field("avatarSrc", "头像 URL", "url")}{field("avatarAlt", "头像替代文本")}</section><section className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><p className="text-xs font-medium tracking-wide text-[#2d8a86]">作者与当前状态</p></div>{field("authorName", "作者名称")}{field("authorLabel", "作者标签")}{textarea("authorIntroduction", "作者介绍")}{textarea("authorInterests", "关注方向", "用英文逗号分隔，最多 8 项")}{field("statusLabel", "状态标题")}{field("statusUpdatedLabel", "状态更新时间标签")}{textarea("statusText", "当前状态")}</section><section className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><p className="text-xs font-medium tracking-wide text-[#2d8a86]">社交链接</p></div>{field("githubLabel", "GitHub 标签")}{field("githubHandle", "GitHub 用户名")}{field("githubHref", "GitHub 地址", "url")}{field("emailLabel", "Email 标签")}{field("emailAddress", "联系邮箱", "email")}{field("emailHref", "Email 链接")}</section><section className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><p className="text-xs font-medium tracking-wide text-[#2d8a86]">首页与公开策略</p></div>{textarea("homeOpeningTitle", "首页开场标题")}{textarea("homeOpeningDescription", "首页开场说明")}{textarea("quoteFallback", "一言接口不可用时的回退文案")}{textarea("featuredPostIds", "精选文章 ID", "用英文逗号分隔；仅保存真实且已发布文章的 ID")}{textarea("backgroundWhitelist", "背景白名单", "每行一个 /manus-storage/ 路径")}{textarea("navigationOrder", "导航顺序", "可用项：home, posts, timeline, archives, tags, gallery, about")}</section></div><div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5"><p className="max-w-xl text-xs leading-5 text-slate-400">服务端会继续校验 URL、邮箱、数组数量、背景来源和导航白名单。</p><Button onClick={save} disabled={saveMutation.isPending} className="bg-[#2d8a86] text-white hover:bg-[#23716e]">{saveMutation.isPending ? "正在保存…" : "保存站点设置"}</Button></div></Panel>;
}

function PostsManagement() {
  const [, navigate] = useLocation();
  const { data: posts, refetch, isLoading } = trpc.admin.posts.list.useQuery({ page: 1, limit: 50 });
  const deleteMutation = trpc.posts.delete.useMutation({ onSuccess: () => { void refetch(); toast.success("文章已删除"); }, onError: (error) => toast.error(error.message) });
  return <Panel label="内容管理" title="文章" count={posts?.length}>{isLoading ? <p className="text-sm text-slate-300">正在读取文章…</p> : posts?.length ? <div className="grid gap-3">{posts.map((post: any) => <article key={post.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.12] bg-white/[0.035] p-4 transition-colors hover:border-[#bce8eb]/35 hover:bg-white/[0.055] sm:flex-row sm:items-center"><div className="min-w-0"><p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400"><span className={post.status === "published" ? "text-[#bce8eb]" : "text-[#f3c18a]"}>{post.status === "published" ? "已发布" : "草稿"}</span><span>·</span><span>{post.viewCount || 0} 次阅读</span><span>·</span><span className="inline-flex items-center gap-1"><Clock3 size={11} />更新于 {formatDate(post.updatedAt)}</span></p><h3 className="mt-2 truncate text-lg font-medium text-white">{post.title}</h3></div><div className="flex flex-wrap gap-2"><Button onClick={() => navigate(`/admin/content/${post.id}/edit`)} variant="ghost" className="h-9 px-2.5 text-xs text-[#bce8eb] hover:bg-white/[0.08] hover:text-white"><Pencil size={13} className="mr-1.5" />编辑</Button>{post.status === "published" && <Button onClick={() => navigate(`/posts/${post.slug}`)} variant="ghost" className="h-9 px-2.5 text-xs text-slate-200 hover:bg-white/[0.08] hover:text-[#bce8eb]">查看</Button>}<Button disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`确定删除「${post.title}」吗？此操作不可恢复。`)) deleteMutation.mutate({ id: post.id }); }} variant="ghost" className="h-9 px-2.5 text-xs text-slate-300 hover:bg-[#efaa91]/10 hover:text-[#ffd1c4]"><Trash2 size={13} className="mr-1.5" />删除</Button></div></article>)}</div> : <Empty title="暂时没有文章记录" description="新建草稿或发布文章后，都会显示在这里。" />}</Panel>;
}

function CommentsModeration() {
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const { data: comments, refetch, isLoading, isFetching } = trpc.admin.comments.list.useQuery({ page: 1, limit: 50, status: reviewFilter });
  const setStatusMutation = trpc.admin.comments.setStatus.useMutation({ onSuccess: (_, variables) => { toast.success(variables.status === "approved" ? "评论已通过并公开显示" : variables.status === "rejected" ? "评论已拒绝，不会公开显示" : "评论已退回待审核队列"); void refetch(); }, onError: (error) => toast.error(error.message) });
  const labels = { all: "全部", pending: "待审核", approved: "已通过", rejected: "已拒绝" } as const;
  const statusClass = { pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700", rejected: "bg-rose-50 text-rose-700" } as const;
  return <Panel label="互动治理" title="评论审核" count={comments?.length}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"><div className="flex flex-wrap gap-1" role="tablist" aria-label="评论审核状态">{(Object.keys(labels) as Array<keyof typeof labels>).map((status) => <button type="button" role="tab" aria-selected={reviewFilter === status} key={status} onClick={() => setReviewFilter(status)} className={`rounded-md px-3 py-2 text-xs transition-colors ${reviewFilter === status ? "bg-[#e5f5f4] font-medium text-[#216f6b]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>{labels[status]}</button>)}</div><Button variant="outline" disabled={isFetching} onClick={() => void refetch()} className="h-8 border-slate-200 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50"><RefreshCw size={13} className={`mr-1.5 ${isFetching ? "animate-spin" : ""}`} />刷新</Button></div>{isLoading ? <p className="py-8 text-sm text-slate-500">正在读取评论…</p> : comments?.length ? <div className="divide-y divide-slate-100">{comments.map((comment: any) => <article key={comment.id} className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto]"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[11px] ${statusClass[comment.status as keyof typeof statusClass]}`}>{labels[comment.status as keyof typeof labels]}</span>{comment.parentCommentId && <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">回复 #{comment.parentCommentId}</span>}</div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{comment.content}</p><p className="mt-3 text-xs text-slate-400">用户 #{comment.authorId} · 文章 #{comment.postId} · {formatDate(comment.createdAt)}</p></div><div className="flex flex-wrap items-start gap-2 lg:justify-end">{comment.status === "pending" && <><Button disabled={setStatusMutation.isPending} onClick={() => setStatusMutation.mutate({ id: comment.id, status: "approved" })} className="h-9 bg-[#2d8a86] px-3 text-xs text-white hover:bg-[#23716e]"><Check size={13} className="mr-1.5" />通过</Button><Button disabled={setStatusMutation.isPending} onClick={() => setStatusMutation.mutate({ id: comment.id, status: "rejected" })} variant="outline" className="h-9 border-rose-200 px-3 text-xs text-rose-700 hover:bg-rose-50"><X size={13} className="mr-1.5" />拒绝</Button></>}{comment.status === "approved" && <Button disabled={setStatusMutation.isPending} onClick={() => setStatusMutation.mutate({ id: comment.id, status: "pending" })} variant="outline" className="h-9 border-amber-200 px-3 text-xs text-amber-700 hover:bg-amber-50">退回审核</Button>}{comment.status === "rejected" && <Button disabled={setStatusMutation.isPending} onClick={() => setStatusMutation.mutate({ id: comment.id, status: "pending" })} variant="outline" className="h-9 border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50">重新审核</Button>}</div></article>)}</div> : <Empty title={reviewFilter === "pending" ? "没有等待处理的评论" : `没有${labels[reviewFilter]}评论`} description={reviewFilter === "pending" ? "新评论提交后，会先在这里等待审核。" : "切换状态可以查看已有评论；不会生成示例数据。"} />}</Panel>;
}

function TermsManagement() {
  const { data: tags, refetch: refetchTags } = trpc.tags.list.useQuery();
  const { data: categories, refetch: refetchCategories } = trpc.categories.list.useQuery();
  const [tagName, setTagName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const createTag = trpc.tags.create.useMutation({ onSuccess: () => { setTagName(""); void refetchTags(); } });
  const createCategory = trpc.categories.create.useMutation({ onSuccess: () => { setCategoryName(""); void refetchCategories(); } });
  const termForm = (label: string, value: string, setValue: (next: string) => void, submit: () => void, pending: boolean) => <div className="rounded-2xl border border-white/[0.12] bg-white/[0.035] p-4"><p className="text-sm font-medium text-slate-100">{label}</p><div className="mt-3 flex gap-2"><Input value={value} onChange={(event) => setValue(event.target.value)} placeholder={`输入${label}名称`} className="quiet-input h-10 flex-1 px-3 text-sm" /><Button disabled={pending || !value.trim()} onClick={submit} className="editorial-button editorial-button-primary h-10 px-3 text-xs">添加</Button></div></div>;
  return <Panel label="内容术语" title="标签与分类"><div className="grid gap-4 lg:grid-cols-2"><div>{termForm("标签", tagName, setTagName, () => createTag.mutate({ name: tagName.trim(), slug: slugify(tagName) }), createTag.isPending)}<div className="mt-4 flex flex-wrap gap-2">{tags?.map((tag: any) => <span key={tag.id} className="rounded-full border border-white/[0.15] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200">#{tag.name}</span>)}</div></div><div>{termForm("分类", categoryName, setCategoryName, () => createCategory.mutate({ name: categoryName.trim(), slug: slugify(categoryName) }), createCategory.isPending)}<div className="mt-4 flex flex-wrap gap-2">{categories?.map((category: any) => <span key={category.id} className="rounded-full border border-white/[0.15] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200">{category.name}</span>)}</div></div></div></Panel>;
}

function UsersDirectory() {
  const { data: users, isLoading } = trpc.admin.users.list.useQuery({ page: 1, limit: 50 });
  return <Panel label="用户管理" title="用户" count={users?.length}>{isLoading ? <p className="text-sm text-slate-300">正在读取用户…</p> : users?.length ? <div className="grid gap-3">{users.map((member: any) => <article key={member.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.035] p-4 sm:flex-row sm:items-center"><div className="min-w-0"><p className="flex items-center gap-2 text-sm text-slate-100"><UserRound size={15} className="text-[#bce8eb]" /> {member.name || "未命名用户"}</p><p className="mt-2 truncate text-xs text-slate-400">{member.email || member.openId}</p></div><div className="text-left sm:text-right"><span className={`rounded-full px-2.5 py-1 text-xs ${member.role === "admin" ? "bg-[#bce8eb]/14 text-[#d6fbfc]" : "bg-white/[0.08] text-slate-300"}`}>{member.role === "admin" ? "管理员" : "用户"}</span><p className="mt-2 text-xs text-slate-400">最近登录：{formatDate(member.lastSignedIn)}</p></div></article>)}</div> : <Empty title="还没有用户记录" description="完成注册的账号会显示在这里。" />}</Panel>;
}

function GalleryManagement() {
  const { data: galleries, refetch: refetchGalleries } = trpc.galleries.list.useQuery({ page: 1, limit: 50 });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [imageQuery, setImageQuery] = useState("");
  const [mediaView, setMediaView] = useState<"grid" | "list">("grid");
  const { data: selectedGallery, refetch: refetchSelected } = trpc.galleries.getById.useQuery({ id: selectedGalleryId || 0 }, { enabled: Boolean(selectedGalleryId) });
  const createMutation = trpc.galleries.create.useMutation({ onSuccess: (gallery) => { setTitle(""); setDescription(""); setSelectedGalleryId(Number(gallery.id)); void refetchGalleries(); } });
  const updateMutation = trpc.galleries.update.useMutation({ onSuccess: () => { void refetchSelected(); void refetchGalleries(); } });
  const addImageMutation = trpc.galleries.addImage.useMutation({ onSuccess: () => { void refetchSelected(); void refetchGalleries(); } });
  const removeImageMutation = trpc.galleries.removeImage.useMutation({ onSuccess: () => void refetchSelected() });
  const deleteGalleryMutation = trpc.galleries.delete.useMutation({ onSuccess: () => { setSelectedGalleryId(null); void refetchGalleries(); } });

  useEffect(() => {
    if (selectedGallery) {
      setDraftTitle(selectedGallery.title);
      setDraftDescription(selectedGallery.description || "");
    }
  }, [selectedGallery?.id, selectedGallery?.title, selectedGallery?.description]);

  const addUploadedImage = (url: string) => { if (selectedGalleryId && url) addImageMutation.mutate({ galleryId: selectedGalleryId, url, order: selectedGallery?.images.length || 0 }); };
  const hasMetadataChanges = Boolean(selectedGallery && (draftTitle.trim() !== selectedGallery.title || draftDescription.trim() !== (selectedGallery.description || "")));
  const shownImages = (selectedGallery?.images || []).filter((image: any, index: number) => `${image.title || ""} 图片 ${index + 1}`.toLowerCase().includes(imageQuery.trim().toLowerCase()));
  const refreshMedia = async () => { await Promise.all([refetchGalleries(), refetchSelected()]); toast.success("图片集已刷新"); };

  return <Panel label="图片管理" title="图片集" count={galleries?.length}>
    <div className="grid border-y border-white/[0.2] lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="border-b border-white/[0.2] px-1 py-5 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="flex items-center gap-2"><FolderOpen size={16} className="text-[#d0f4ee]" /><p className="text-sm font-medium text-[#fff8ed]">图片集目录</p></div>
        <p className="mt-2 text-xs leading-5 text-[#d0cfca]">先选择一个图片集，再上传或整理其中的真实图片。</p>
        <div className="mt-5 border-t border-white/[0.16] pt-5"><p className="text-xs font-medium text-[#e5e2db]">新建图片集</p><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="图片集名称" className="quiet-input mt-3 h-10 px-3 text-sm" /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="可选说明" className="quiet-input mt-3 min-h-20 w-full resize-y p-3 text-sm" /><Button disabled={createMutation.isPending || !title.trim()} onClick={() => createMutation.mutate({ title: title.trim(), description: description.trim() || undefined })} className="editorial-button editorial-button-primary mt-3 w-full">{createMutation.isPending ? "正在创建…" : "创建图片集"}</Button></div>
        <div className="mt-6 border-t border-white/[0.16] pt-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#e5e2db]">已有图片集</p><span className="text-xs text-[#d0cfca]">{galleries?.length || 0} 个</span></div>{galleries?.length ? <div className="mt-3 grid gap-1">{galleries.map((gallery: any, index: number) => <button key={gallery.id} onClick={() => setSelectedGalleryId(gallery.id)} className={`flex items-center gap-3 border-l-2 px-3 py-3 text-left transition-colors ${selectedGalleryId === gallery.id ? "border-[#d0f4ee] bg-[#d0f4ee]/10 text-[#e8fffb]" : "border-transparent text-[#e5e2db] hover:border-white/[0.5] hover:bg-white/[0.045]"}`}><span className="font-mono text-[10px] text-[#d0cfca]">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate text-sm">{gallery.title}</span>{selectedGalleryId === gallery.id && <span className="text-[10px] text-[#d0f4ee]">当前</span>}</button>)}</div> : <p className="mt-3 text-xs leading-5 text-[#d0cfca]">还没有图片集。创建后可在右侧添加真实图片。</p>}</div>
      </aside>
      <section className="min-w-0 px-1 py-5 lg:px-7 lg:py-6">{selectedGallery ? <>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.16] pb-5"><div><p className="editorial-kicker">当前图片集 · {selectedGallery.images.length} 张图片</p><h3 className="display-title mt-2 text-3xl">{selectedGallery.title}</h3></div><span className="border-b border-[#d0f4ee] px-1 pb-1 text-xs text-[#d0f4ee]">可公开浏览</span></div>
          <div className="grid gap-5 border-b border-white/[0.16] py-6 lg:grid-cols-[minmax(0,1fr)_220px]"><div><p className="text-sm font-medium text-[#fff8ed]">图片集信息</p><p className="mt-2 text-xs leading-5 text-[#d0cfca]">修改名称或说明后需要点击保存。不会改变已上传图片。</p><Input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="图片集名称" className="quiet-input mt-4 h-10 px-3 text-sm" /><textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} placeholder="图片集说明" className="quiet-input mt-3 min-h-24 w-full resize-y p-3 text-sm" /><Button disabled={updateMutation.isPending || !draftTitle.trim() || !hasMetadataChanges} onClick={() => updateMutation.mutate({ id: selectedGallery.id, title: draftTitle.trim(), description: draftDescription.trim() || undefined })} className="editorial-button editorial-button-primary mt-3 px-4">{updateMutation.isPending ? "正在保存…" : "保存图片集信息"}</Button></div><div className="border-l border-[#eab78c] pl-4"><p className="text-xs font-medium text-[#fff8ed]">上传前确认</p><p className="mt-2 text-xs leading-5 text-[#d0cfca]">图片会进入当前图片集，并在公开图库中按顺序展示。</p><p className="mt-3 border-l-2 border-[#d0f4ee] pl-3 text-xs leading-5 text-[#d0f4ee]">单文件不得超过 30MB。浏览器与服务端都会拒绝超限文件。</p></div></div>
        <div className="border-b border-white/[0.16] py-6"><div className="flex items-center gap-2"><ImagePlus size={16} className="text-[#d0f4ee]" /><div><p className="text-sm font-medium text-[#fff8ed]">添加真实图片</p><p className="mt-1 text-xs text-[#d0cfca]">上传完成后会自动加入当前图片集；单文件最大 30MB。</p></div></div><div className="mt-4 border border-dashed border-white/[0.28] p-4"><ImageUpload onUpload={addUploadedImage} maxSize={30} label="上传图片到当前图片集（最大 30MB）" /></div></div>
        <div className="py-6"><div className="flex flex-col justify-between gap-4 border-b border-white/[0.14] pb-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#fff8ed]">已收录图片</p><p className="mt-1 text-xs text-[#d0cfca]">沿用 Halo 附件库的筛选、视图切换和刷新节奏；移除会立即从公开图片集消失。</p></div><span className="text-xs text-[#d0cfca]">{selectedGallery.images.length} 张</span></div><div className="flex flex-col gap-3 border-b border-white/[0.14] py-3 sm:flex-row sm:items-center"><label className="relative min-w-0 flex-1"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#91a7ac]" /><Input value={imageQuery} onChange={(event) => setImageQuery(event.target.value)} placeholder="过滤当前图片集" className="quiet-input h-9 w-full pl-9 text-xs" /></label><div className="flex items-center gap-1"><button type="button" aria-label="网格模式" title="网格模式" onClick={() => setMediaView("grid")} className={`grid h-9 w-9 place-items-center border transition-colors ${mediaView === "grid" ? "border-[#d0f4ee] bg-[#d0f4ee]/12 text-[#d0f4ee]" : "border-white/[0.16] text-[#d0cfca] hover:bg-white/[0.06]"}`}><Grid size={15} /></button><button type="button" aria-label="列表模式" title="列表模式" onClick={() => setMediaView("list")} className={`grid h-9 w-9 place-items-center border transition-colors ${mediaView === "list" ? "border-[#d0f4ee] bg-[#d0f4ee]/12 text-[#d0f4ee]" : "border-white/[0.16] text-[#d0cfca] hover:bg-white/[0.06]"}`}><List size={15} /></button><button type="button" aria-label="刷新图片集" title="刷新图片集" onClick={() => void refreshMedia()} className="grid h-9 w-9 place-items-center border border-white/[0.16] text-[#d0cfca] transition-colors hover:bg-white/[0.06] hover:text-[#d0f4ee]"><RefreshCw size={15} /></button></div></div>{selectedGallery.images.length ? shownImages.length ? <div className={mediaView === "grid" ? "mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "mt-4 grid gap-2"}>{shownImages.map((image: any, index: number) => <div key={image.id} className={`overflow-hidden border border-white/[0.16] bg-white/[0.025] ${mediaView === "list" ? "flex items-center gap-3 p-2" : ""}`}><img src={image.url} alt={image.title || `图片 ${index + 1}`} className={mediaView === "list" ? "h-14 w-20 shrink-0 object-cover" : "aspect-[1.4] w-full object-cover"} /><div className={`flex min-w-0 flex-1 items-center justify-between gap-3 ${mediaView === "grid" ? "p-3" : "py-1 pr-1"}`}><span className="truncate text-xs text-[#e5e2db]">{image.title || `图片 ${String(index + 1).padStart(2, "0")}`}</span><Button disabled={removeImageMutation.isPending} onClick={() => { if (window.confirm(`确定从「${selectedGallery.title}」移除图片 ${index + 1} 吗？此操作不可恢复。`)) removeImageMutation.mutate({ id: image.id }); }} variant="ghost" className="h-8 shrink-0 px-2 text-xs text-[#d0cfca] hover:bg-[#efaa91]/10 hover:text-[#ffd1c4]"><Trash2 size={13} className="mr-1" />移除</Button></div></div>)}</div> : <div className="mt-4"><Empty title="没有匹配的图片" description="可清除过滤词，或继续上传当前图片集的真实图片。" /></div> : <div className="mt-4"><Empty title="这个图片集还没有图片" description="可从上方上传真实图片；上传前不会出现无效预览或示例素材。" /></div>}</div>
        <div className="border-t border-[#eab78c]/50 py-6"><p className="text-sm font-medium text-[#fff0df]">危险操作</p><p className="mt-2 text-xs leading-5 text-[#d0cfca]">删除图片集会同时删除其中的图片记录，无法撤销；存储中的原文件不会在此界面被伪装为可恢复内容。</p><Button disabled={deleteGalleryMutation.isPending} onClick={() => { if (window.confirm(`确定删除图片集「${selectedGallery.title}」及其 ${selectedGallery.images.length} 张图片记录吗？此操作不可恢复。`)) deleteGalleryMutation.mutate({ id: selectedGallery.id }); }} variant="ghost" className="mt-3 h-9 px-2.5 text-xs text-[#ffd1c4] hover:bg-[#efaa91]/10"><Trash2 size={13} className="mr-1.5" />删除这个图片集</Button></div>
      </> : <Empty title="先选择一个图片集" description="从左侧目录选择已有图片集，或先创建一个图片集；选择后才会显示上传和整理操作。" />}</section>
    </div>
  </Panel>;
}
