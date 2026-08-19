import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, CornerDownRight, Eye, MessageCircle, Pencil, Send, Trash2, UserRound, X } from "lucide-react";
import { formatReadingTime } from "@/lib/readingTime";
import { AuthorIdentityCard } from "@/components/AuthorIdentityCard";
import { ArticleShareActions } from "@/components/ArticleShareActions";
import { resolveSiteSettings } from "@/lib/siteSettings";

const fallbackCover = "/manus-storage/observatory-night_fc4b375d.jpg";
const COMMENT_MAX_LENGTH = 2000;

export default function PostDetail() {
  const [, params] = useRoute("/posts/:slug");
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [commentContent, setCommentContent] = useState("");
  const [replyTarget, setReplyTarget] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [commentNotice, setCommentNotice] = useState("");
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);

  const { data: post, isLoading } = trpc.posts.getBySlug.useQuery({ slug: params?.slug || "" }, { enabled: Boolean(params?.slug) });
  const { data: persistedSettings } = trpc.site.settings.useQuery(undefined, { staleTime: 1000 * 60 * 5 });
  const { data: comments, refetch: refetchComments } = trpc.comments.list.useQuery({ postId: post?.id || 0 }, { enabled: Boolean(post?.id) });
  const relatedTagIds = useMemo(() => post?.tags.map((tag) => tag.id) ?? [], [post?.tags]);
  const { data: relatedPosts } = trpc.posts.related.useQuery({ postId: post?.id || 0, tagIds: relatedTagIds, limit: 3 }, { enabled: Boolean(post?.id && relatedTagIds.length) });
  const createCommentMutation = trpc.comments.create.useMutation({ onSuccess: (comment) => { setCommentContent(""); setReplyContent(""); setReplyTarget(null); setCommentNotice(comment.parentCommentId ? "回复已提交，审核通过后会显示在对应讨论下。" : "评论已提交，审核通过后会显示在文章下方。"); void refetchComments(); } });
  const deleteCommentMutation = trpc.comments.delete.useMutation({ onSuccess: () => void refetchComments() });

  useEffect(() => {
    if (replyTarget) replyInputRef.current?.focus();
  }, [replyTarget]);

  if (isLoading) return <div className="grid min-h-[55vh] place-items-center"><p className="text-sm text-[#e5e2db]">正在载入文章…</p></div>;
  if (!post) return <div className="grid min-h-[55vh] place-items-center text-center"><div className="border-y border-white/[0.25] px-7 py-10"><p className="text-sm text-[#e5e2db]">没有找到这篇文章</p><h1 className="display-title mt-4 text-4xl">它可能已被删除，<br />或链接并不正确。</h1><Button onClick={() => navigate("/posts")} className="editorial-button mt-7 px-5">回到文章列表</Button></div></div>;

  const dateLabel = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }) : "尚未发布";
  const commentCount = comments?.data?.length || 0;
  const canDelete = (comment: any) => user?.id === comment.authorId || user?.role === "admin";
  const canEditPost = user?.id === post.authorId || user?.role === "admin";
  const authorName = post.author?.name?.trim() || resolveSiteSettings(persistedSettings).author.name;
  const submitReply = (parentCommentId: number) => { if (replyContent.trim()) createCommentMutation.mutate({ postId: post.id, content: replyContent, parentCommentId }); };

  const renderComment = (comment: any, index: string, isReply = false) => (
    <article id={`comment-${comment.id}`} key={comment.id} data-comment-status={comment.status} className={`${isReply ? "ml-3 border-l-2 border-white/[0.22] pl-4 sm:ml-8 sm:pl-6" : ""} grid gap-3 border-b border-white/[0.2] py-6 sm:grid-cols-[110px_1fr] sm:gap-6`}>
      <div><p className="article-index">{index} / {isReply ? "回复" : "评论"}</p><p className="mt-2 text-xs text-[#d0cfca]">作者 #{comment.authorId}</p><p className="mt-1 text-[10px] text-[#b8b9b5]">{new Date(comment.createdAt).toLocaleDateString()}</p>{comment.status === "pending" && <span className="mt-3 inline-block border border-[#eab78c]/70 bg-[#eab78c]/10 px-2 py-1 font-mono text-[9px] tracking-[0.08em] text-[#fff0df]">仅你可见 · 待审核</span>}</div>
      <div><p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#f0ede7]">{comment.content}</p><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2"><button type="button" onClick={() => { setReplyTarget(replyTarget === comment.id ? null : comment.id); setReplyContent(""); setCommentNotice(""); }} aria-expanded={replyTarget === comment.id} aria-controls={`reply-to-${comment.id}`} className="flex items-center gap-1.5 border-b border-transparent pb-1 text-xs text-[#d0cfca] hover:border-[#d0f4ee] hover:text-[#d0f4ee]"><CornerDownRight size={13} />回复</button>{canDelete(comment) && <button type="button" disabled={deleteCommentMutation.isPending} onClick={() => deleteCommentMutation.mutate({ id: comment.id })} className="flex items-center gap-1.5 border-b border-transparent pb-1 text-xs text-[#d0cfca] hover:border-[#eab78c] hover:text-[#fff0df]"><Trash2 size={12} />删除</button>}</div>{replyTarget === comment.id && <div id={`reply-to-${comment.id}`} className="mt-5 border-l-2 border-[#d0f4ee] bg-white/[0.025] pl-4 pr-3 py-3"><div className="mb-2 flex items-center justify-between"><p className="editorial-kicker">回复作者 #{comment.authorId}</p><button type="button" onClick={() => setReplyTarget(null)} className="text-[#d0cfca] hover:text-white" aria-label="取消回复"><X size={14} /></button></div><textarea ref={replyInputRef} value={replyContent} maxLength={COMMENT_MAX_LENGTH} onChange={(event) => setReplyContent(event.target.value)} placeholder="写下你的回复。" className="quiet-input min-h-20 w-full resize-y p-3 text-sm leading-6" /><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-[#d0cfca]">{replyContent.length}/{COMMENT_MAX_LENGTH}</span><Button disabled={createCommentMutation.isPending || !replyContent.trim()} onClick={() => submitReply(comment.id)} className="editorial-button editorial-button-primary px-3">{createCommentMutation.isPending ? "正在发送…" : "发送回复"}</Button></div></div>}{Array.isArray(comment.replies) && comment.replies.map((reply: any, replyIndex: number) => renderComment(reply, `${index}.${replyIndex + 1}`, true))}</div>
    </article>
  );

  return (
    <article className="pb-16">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><button onClick={() => navigate("/posts")} className="group flex items-center gap-2 border-b border-transparent pb-1 text-sm text-[#e5e2db] transition-colors hover:border-[#d0f4ee] hover:text-[#d0f4ee]"><ArrowLeft size={15} />回到文章列表</button><ArticleShareActions title={post.title} onSearch={() => navigate("/posts")} /></div>

      <header className="grid border-y border-white/[0.28] lg:grid-cols-12">
        <div className="flex flex-col justify-between px-1 py-9 sm:py-12 lg:col-span-7 lg:pr-14">
          <div><p className="editorial-kicker">{post.category?.name || "随手记"} · {post.status === "published" ? "已发布" : "草稿"}</p><h1 className="display-title mt-5 text-4xl sm:text-5xl lg:text-6xl">{post.title}</h1>{post.excerpt && <p className="copy-lede mt-7 max-w-2xl">{post.excerpt}</p>}</div>
          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 text-xs text-[#e5e2db]"><span className="flex items-center gap-1.5"><CalendarDays size={14} />{dateLabel}</span><span className="flex items-center gap-1.5" aria-label={`预计 ${formatReadingTime(post.content)}`}><Clock3 size={14} />{formatReadingTime(post.content)}</span><span className="flex items-center gap-1.5"><Eye size={14} />{post.viewCount || 0} 次阅读</span><span className="flex items-center gap-1.5"><MessageCircle size={14} />{commentCount} 条评论</span></div>
        </div>
        <div className="article-cover min-h-[280px] lg:col-span-5"><img src={post.coverImage || fallbackCover} alt={post.title} fetchPriority="high" /></div>
      </header>

      <div className="grid gap-10 pt-10 lg:grid-cols-12 lg:gap-12 lg:pt-14">
        <aside className="h-fit border-y border-white/[0.2] py-5 lg:sticky lg:top-24 lg:col-span-3"><div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1"><div><p className="editorial-kicker">作者</p><p className="mt-2 flex items-center gap-2 text-sm text-[#fff8ed]"><UserRound size={15} className="text-[#d0f4ee]" />{authorName}</p>{canEditPost && <Button onClick={() => navigate(`/edit/${post.id}`)} variant="ghost" className="mt-4 h-9 px-0 text-xs text-[#d0f4ee] hover:bg-transparent hover:text-white"><Pencil size={13} className="mr-1.5" />编辑文章</Button>}</div><div><p className="editorial-kicker">标签</p><div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">{post.tags.length ? post.tags.map((tag) => <button onClick={() => navigate(`/posts?tag=${tag.slug}`)} key={tag.id} className="border-b border-transparent pb-1 text-xs text-[#e5e2db] hover:border-[#d0f4ee] hover:text-[#d0f4ee]">#{tag.name}</button>) : <span className="text-xs text-[#d0cfca]">暂未添加标签</span>}</div></div><div><p className="editorial-kicker">阅读提示</p><p className="mt-2 text-xs leading-6 text-[#d5d5d0]">正文中的外部链接会在新窗口打开，方便随时回到这里。</p></div></div></aside>
        <section className="min-w-0 lg:col-span-8 lg:col-start-5"><div className="prose-cosmic"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ h1: ({ node, ...props }) => <h1 className="mb-6 mt-12 text-3xl" {...props} />, h2: ({ node, ...props }) => <h2 className="mb-5 text-2xl" {...props} />, h3: ({ node, ...props }) => <h3 className="mb-4 mt-9 text-xl" {...props} />, p: ({ node, ...props }) => <p className="mb-7" {...props} />, code: ({ node, inline, children, ...props }: any) => inline ? <code className="rounded bg-white/[0.1] px-1.5 py-0.5 text-sm" {...props}>{children}</code> : <code {...props}>{children}</code>, pre: ({ node, ...props }) => <pre className="mb-8 overflow-x-auto p-5 text-sm leading-7" {...props} />, blockquote: ({ node, ...props }) => <blockquote className="mb-8 italic" {...props} />, ul: ({ node, ...props }) => <ul className="mb-7 list-disc space-y-2 pl-6" {...props} />, ol: ({ node, ...props }) => <ol className="mb-7 list-decimal space-y-2 pl-6" {...props} />, table: ({ node, ...props }) => <div className="mb-8 overflow-x-auto"><table className="w-full border-collapse text-sm" {...props} /></div>, th: ({ node, ...props }) => <th className="border border-white/20 bg-white/[0.06] p-3 text-left font-sans text-[#d0f4ee]" {...props} />, td: ({ node, ...props }) => <td className="border border-white/15 p-3" {...props} />, a: ({ node, ...props }) => <a target="_blank" rel="noreferrer" {...props} />, img: ({ node, ...props }) => <img className="my-9 w-full border-y border-white/20" loading="lazy" {...props} /> }}>{post.content}</ReactMarkdown></div><div className="mt-12 flex justify-end border-t border-white/[0.2] pt-5"><button onClick={() => navigate("/posts")} className="group flex items-center gap-2 border-b border-transparent pb-1 text-sm text-[#e5e2db] hover:border-[#d0f4ee] hover:text-[#d0f4ee]">回到文章列表 <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button></div><div className="mt-12 grid gap-6 border-t border-white/[0.2] pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.72fr)]"><section aria-labelledby="related-posts-heading"><p className="editorial-kicker">继续阅读</p><h2 id="related-posts-heading" className="display-title mt-3 text-3xl">同一条线索里的记录</h2>{relatedPosts?.length ? <div className="mt-5 divide-y divide-white/[0.18] border-y border-white/[0.18]">{relatedPosts.map((item) => <button key={item.id} type="button" onClick={() => navigate(`/posts/${item.slug}`)} className="group flex w-full items-center justify-between gap-4 py-4 text-left"><span className="min-w-0"><span className="block truncate text-sm text-[#fff8ed] transition-colors group-hover:text-[#d0f4ee]">{item.title}</span><span className="mt-1 block truncate text-xs text-[#d0cfca]">{item.excerpt || "继续读这篇记录。"}</span></span><ArrowUpRight size={15} className="shrink-0 text-[#d0cfca] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#d0f4ee]" /></button>)}</div> : <p className="mt-5 border-y border-white/[0.18] py-5 text-sm leading-7 text-[#d0cfca]">{post.tags.length ? "暂时没有可继续阅读的同标签公开文章。" : "这篇文章尚未添加标签，之后可以从标签继续延伸阅读。"}</p>}</section><AuthorIdentityCard compact showStatus={false} /></div></section>
      </div>

      <section className="mx-auto mt-16 max-w-4xl border-t border-white/[0.28] pt-8 sm:mt-24 sm:pt-10"><div className="flex items-end justify-between"><div><p className="editorial-kicker">评论</p><h2 className="display-title mt-3 text-3xl">参与讨论。</h2></div><span className="text-sm text-[#d5d5d0]">{commentCount} 条评论</span></div>{isAuthenticated ? <div className="mt-8 border-y border-white/[0.2] py-4"><label className="editorial-kicker" htmlFor="new-comment">留下你的看法</label><textarea id="new-comment" value={commentContent} maxLength={COMMENT_MAX_LENGTH} onChange={(event) => setCommentContent(event.target.value)} placeholder="补充你的看法。审核通过后，评论会显示在文章下方。" className="quiet-input mt-3 min-h-28 w-full resize-y p-4 text-sm leading-6" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-[#d0cfca]">提交后只有你能看到，直到审核完成。</p><p className="mt-1 text-xs text-[#b8b9b5]">{commentContent.length}/{COMMENT_MAX_LENGTH}</p></div><Button disabled={createCommentMutation.isPending || !commentContent.trim()} onClick={() => createCommentMutation.mutate({ postId: post.id, content: commentContent })} className="editorial-button editorial-button-primary shrink-0 px-4">{createCommentMutation.isPending ? "正在提交…" : <><Send size={13} className="mr-1.5" />提交评论</>}</Button></div></div> : <div className="mt-8 border-y border-white/[0.2] px-2 py-8 text-center"><p className="text-sm text-[#f0ede7]">登录后才能发表或回复评论。</p><button type="button" onClick={() => navigate("/login")} className="mt-3 border-b border-[#d0f4ee] pb-1 text-sm text-[#d0f4ee] hover:text-white">前往登录</button></div>}{commentNotice && <p role="status" className="mt-4 border-l-2 border-[#d0f4ee] bg-[#d0f4ee]/10 px-4 py-3 text-sm text-[#e7fffc]">{commentNotice}</p>}{createCommentMutation.error && <p role="alert" className="mt-4 border-l-2 border-[#eab78c] bg-[#eab78c]/15 px-4 py-3 text-sm text-[#fff0df]">{createCommentMutation.error.message}</p>}{deleteCommentMutation.error && <p role="alert" className="mt-4 border-l-2 border-[#eab78c] bg-[#eab78c]/15 px-4 py-3 text-sm text-[#fff0df]">{deleteCommentMutation.error.message}</p>}<div className="mt-5 border-t border-white/[0.2]">{comments?.data?.length ? comments.data.map((comment: any, index: number) => renderComment(comment, String(index + 1).padStart(2, "0"))) : <div className="py-12 text-center"><p className="text-sm font-medium text-[#f0ede7]">还没有人留言</p><p className="mt-3 text-sm text-[#d0cfca]">第一条留言会从上方开始；登录后即可提交，审核通过后对所有访客可见。</p></div>}</div></section>
    </article>
  );
}
