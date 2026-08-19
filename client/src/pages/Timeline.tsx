import { ArrowUpRight, Clock3, Eye, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type TimelinePost = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  viewCount?: number | null;
};

function entryDate(post: TimelinePost) {
  return new Date(post.publishedAt || post.createdAt);
}

function dayLabel(post: TimelinePost) {
  return entryDate(post).toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
}

function yearLabel(post: TimelinePost) {
  return String(entryDate(post).getFullYear());
}

export default function Timeline() {
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.posts.list.useQuery({ page: 1, limit: 1000 });
  const posts = (data?.data || []) as TimelinePost[];
  const groups = posts.reduce<Record<string, TimelinePost[]>>((result, post) => {
    const key = yearLabel(post);
    (result[key] ||= []).push(post);
    return result;
  }, {});
  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));

  return <div className="pb-10">
    <section className="timeline-hero grid overflow-hidden border-y border-white/[0.28] px-1 py-10 sm:py-14 lg:grid-cols-12">
      <div className="lg:col-span-6"><p className="editorial-kicker">阅读时间轴</p><h1 className="display-title mt-4 text-5xl sm:text-6xl">沿着时间，<br /><span className="display-accent">回到写下它的那天。</span></h1></div>
      <div className="mt-7 max-w-lg lg:col-span-4 lg:col-start-9 lg:mt-2"><p className="copy-lede">这里只整理已经公开的真实文章。每一个节点都保留发布日期、阅读线索与进入原文的路径。</p></div>
    </section>
    {isLoading ? <div className="grid min-h-72 place-items-center"><p className="text-sm text-slate-300">正在整理时间轴…</p></div> : years.length ? <section className="timeline-rail mt-8 sm:mt-12">{years.map(year => <div key={year} className="timeline-year grid gap-6 pb-10 sm:grid-cols-[126px_minmax(0,1fr)] sm:gap-10 sm:pb-14"><div className="timeline-year-label"><p className="font-mono text-sm tracking-[0.16em] text-[#d0f4ee]">{year}</p><p className="mt-2 text-xs text-[#d0cfca]">{groups[year]?.length || 0} 篇公开记录</p></div><div className="grid gap-5">{groups[year]?.map(post => <article key={post.id} className="timeline-entry group grid gap-3 border-b border-white/[0.16] pb-5 sm:grid-cols-[104px_minmax(0,1fr)] sm:gap-6"><div className="flex items-start gap-3 sm:block"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#d0f4ee] bg-[#26323c] shadow-[0_0_0_5px_rgb(208_244_238_/_0.06)]" /><p className="text-xs leading-5 text-[#d0cfca]">{dayLabel(post)}</p></div><button type="button" onClick={() => navigate(`/posts/${post.slug}`)} className="min-w-0 text-left"><div className="flex items-start justify-between gap-4"><h2 className="text-xl font-medium text-[#fff8ed] transition-colors group-hover:text-[#d0f4ee] sm:text-2xl">{post.title}</h2><ArrowUpRight size={17} className="mt-1 shrink-0 text-[#d0cfca] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#d0f4ee]" /></div><p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-7 text-[#e5e2db]">{post.excerpt || "作者没有填写摘要。"}</p><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#d0cfca]"><span className="inline-flex items-center gap-1.5"><Clock3 size={12} />公开时间记录</span><span className="inline-flex items-center gap-1.5"><Eye size={12} />{post.viewCount || 0} 次阅读</span></div></button></article>)}</div></div>)}</section> : <section className="mt-8 grid min-h-80 place-items-center border-y border-dashed border-white/[0.22] px-5 text-center"><div><FileText size={20} className="mx-auto text-[#d0f4ee]" /><p className="mt-4 text-sm font-medium text-[#f0ede7]">时间轴正在等待第一篇公开文章</p><p className="mt-3 max-w-sm text-sm leading-6 text-[#d0cfca]">发布后的真实文章会自动按日期出现在这里；不会以示例内容填充时间线。</p></div></section>}
  </div>;
}
