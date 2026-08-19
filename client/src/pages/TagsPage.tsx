import { ArrowUpRight, BookOpen, Hash, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

type TagRecord = {
  id: number | string;
  name: string;
  slug: string;
  postCount?: number | null;
};

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

export default function TagsPage() {
  const { data: tags, isLoading } = trpc.tags.list.useQuery();
  const orderedTags = [...((tags || []) as TagRecord[])].sort((a, b) => (b.postCount || 0) - (a.postCount || 0) || a.name.localeCompare(b.name, "zh-CN"));
  const publishedPostCount = orderedTags.reduce((total, tag) => total + (tag.postCount || 0), 0);

  return (
    <div className="pb-16 sm:pb-20">
      <section className="relative overflow-hidden border-y border-white/[0.17] bg-[#1b242d]/76 py-10 sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 select-none font-mono text-[7rem] font-bold leading-none tracking-[-0.13em] text-[#d0f4ee]/[0.045] sm:text-[12rem]">TAG</div>
        <div className="container relative grid gap-9 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 text-xs font-medium tracking-[0.17em] text-[#bce8eb]"><Hash size={13} /> SUBJECT INDEX / 主题索引</div>
            <h1 className="display-title mt-5 max-w-3xl text-5xl leading-[0.94] sm:text-7xl">让主题成为<br /><span className="display-accent">继续阅读的坐标。</span></h1>
          </div>
          <div className="border-l border-white/[0.18] pl-5 lg:col-span-4 lg:col-start-9">
            <p className="copy-lede">不是词云，也不是摆设。每个主题都通向对应的公开文章索引；没有文章时，也如实保留它的等待状态。</p>
            <dl className="mt-7 grid grid-cols-2 border-t border-white/[0.18] pt-4">
              <div><dt className="text-[10px] tracking-[0.16em] text-[#91a7ac]">已收录主题</dt><dd className="mt-1 font-mono text-2xl text-[#f5f0e7]">{String(orderedTags.length).padStart(2, "0")}</dd></div>
              <div className="border-l border-white/[0.16] pl-4"><dt className="text-[10px] tracking-[0.16em] text-[#91a7ac]">公开关联</dt><dd className="mt-1 font-mono text-2xl text-[#f5f0e7]">{String(publishedPostCount).padStart(2, "0")}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="container mt-8 sm:mt-11">
        <div className="flex flex-col gap-5 border-b border-white/[0.18] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="editorial-kicker">TOPIC CATALOGUE</p><h2 className="display-title mt-2 text-3xl sm:text-4xl">从一个主题出发。</h2></div>
          <p className="max-w-sm text-sm leading-6 text-[#b9c8ca]">按真实公开文章数排序；同数量时按名称排列。点击任一主题可恢复到对应筛选结果。</p>
        </div>

        {isLoading ? (
          <div className="grid min-h-72 place-items-center border-b border-white/[0.17]"><p className="text-sm text-[#c7d6d8]">正在整理真实主题…</p></div>
        ) : orderedTags.length ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:gap-3">
            {orderedTags.map((tag, index) => {
              const count = tag.postCount || 0;
              const anchor = index === 0;
              return (
                <Link
                  key={tag.id}
                  href={`/posts?tag=${encodeURIComponent(tag.slug)}`}
                  className={`group relative flex min-h-44 flex-col justify-between overflow-hidden border border-white/[0.15] bg-[#202a33]/[0.72] p-5 transition-[border-color,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#bce8eb]/55 hover:bg-[#25333d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d0f4ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b242d] sm:min-h-52 ${anchor ? "sm:col-span-2 lg:col-span-7 lg:min-h-[21rem]" : "lg:col-span-5"}`}
                >
                  <div aria-hidden="true" className={`absolute right-3 top-1 font-mono font-medium leading-none text-[#d0f4ee]/[0.06] transition-colors duration-200 group-hover:text-[#d0f4ee]/[0.12] ${anchor ? "text-8xl sm:text-[10rem]" : "text-7xl"}`}>{formatIndex(index)}</div>
                  <div className="relative flex items-start justify-between gap-4"><span className="font-mono text-xs tracking-[0.14em] text-[#91a7ac]">T-{formatIndex(index)}</span><ArrowUpRight size={18} className="text-[#91a7ac] transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[#d0f4ee]" /></div>
                  <div className="relative"><div className="flex items-center gap-2 text-[#bce8eb]"><Sparkles size={14} /><span className="text-[10px] font-medium tracking-[0.16em]">THEME / 主题</span></div><h3 className={`mt-3 break-words font-medium tracking-[-0.045em] text-[#f7f2e9] ${anchor ? "text-4xl sm:text-6xl" : "text-3xl sm:text-4xl"}`}>#{tag.name}</h3><div className="mt-5 flex items-center gap-2 border-t border-white/[0.15] pt-3 text-sm text-[#c7d6d8]"><BookOpen size={14} /><span>{count ? `${count} 篇已公开文章` : "尚无公开文章"}</span><span className="ml-auto text-xs text-[#91a7ac] group-hover:text-[#d0f4ee]">查看索引</span></div></div>
                </Link>
              );
            })}
          </div>
        ) : (
          <section className="mt-5 grid min-h-80 place-items-center border border-dashed border-white/[0.2] bg-[#202a33]/48 px-5 text-center"><div><Hash className="mx-auto text-[#91a7ac]" size={20} /><p className="mt-4 text-sm font-medium text-[#e5e2db]">暂时没有可用标签</p><p className="mt-3 max-w-sm text-sm leading-6 text-[#aebfc1]">等真实文章添加标签后，主题会在这里按公开关联自动出现。</p></div></section>
        )}
      </section>

      <section className="container mt-10 border-y border-white/[0.16] py-5 sm:mt-14 sm:flex sm:items-center sm:justify-between"><div><p className="editorial-kicker">OPEN INDEX</p><p className="mt-2 text-sm text-[#c7d6d8]">不知道从哪个主题开始？直接浏览全部公开文章。</p></div><Link href="/posts" className="mt-4 inline-flex items-center gap-2 text-sm text-[#d0f4ee] transition-colors hover:text-white sm:mt-0">全部文章 <ArrowUpRight size={15} /></Link></section>
    </div>
  );
}
