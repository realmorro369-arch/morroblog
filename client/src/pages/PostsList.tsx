import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, useSearch } from "wouter";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Clock3, Eye, Search, SlidersHorizontal, X } from "lucide-react";
import { buildPostIndexLocation, parsePostIndexFilters } from "@/lib/postFilters";
import { formatReadingTime } from "@/lib/readingTime";

const fallbackCover = "/manus-storage/observatory-night_fc4b375d.jpg";

function resolveCover(post: any) {
  const candidate = typeof post.coverImage === "string" ? post.coverImage.trim() : "";
  return candidate.startsWith("/manus-storage/") || candidate.startsWith("https://") || candidate.startsWith("http://") ? candidate : fallbackCover;
}

export default function PostsList() {
  const [, navigate] = useLocation();
  const queryString = useSearch();
  const filtersFromUrl = parsePostIndexFilters(queryString);
  const { tagSlug: tagFromUrl, categoryId: categoryFromUrl, search: searchFromUrl } = filtersFromUrl;
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [selectedTag, setSelectedTag] = useState<string | null>(tagFromUrl);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => { setSearchQuery(searchFromUrl); setSelectedTag(tagFromUrl); setSelectedCategory(categoryFromUrl); setPage(1); }, [searchFromUrl, tagFromUrl, categoryFromUrl]);
  useEffect(() => {
    const nextLocation = buildPostIndexLocation({ search: searchQuery, tagSlug: selectedTag, categoryId: selectedCategory });
    const currentLocation = queryString ? `/posts${queryString.startsWith("?") ? queryString : `?${queryString}`}` : "/posts";
    if (nextLocation !== currentLocation) navigate(nextLocation, { replace: true });
  }, [navigate, queryString, searchQuery, selectedCategory, selectedTag]);

  const query = searchQuery.trim();
  const { data: postsData, isLoading } = trpc.posts.list.useQuery({ page, limit: 10, tagSlug: selectedTag || undefined, categoryId: selectedCategory ? Number(selectedCategory) : undefined, search: query || undefined });
  const { data: tags } = trpc.tags.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const hasFilters = Boolean(query || selectedTag || selectedCategory);
  const totalPages = Math.max(1, Math.ceil((postsData?.total || 0) / (postsData?.limit || 10)));
  const resultCountLabel = hasFilters ? `找到 ${postsData?.total || 0} 篇` : `共 ${postsData?.total || 0} 篇`;
  const reset = () => { setSearchQuery(""); setSelectedTag(null); setSelectedCategory(null); setPage(1); setFiltersOpen(false); };

  return (
    <div className="pb-8">
      <section className="grid gap-8 border-b border-white/[0.28] pb-10 pt-4 sm:pb-14 lg:grid-cols-12 lg:gap-12 lg:pt-10">
        <div className="lg:col-span-5"><p className="editorial-kicker">文章索引</p><h1 className="display-title mt-4 text-5xl sm:text-6xl">想读的内容，<br /><span className="display-accent">都在这里。</span></h1></div>
        <div className="max-w-xl lg:col-span-5 lg:col-start-7 lg:pt-8"><p className="copy-lede">这里列出所有已公开文章。可按标题或摘要中的词、标签和分类筛选，不必记得完整标题。</p><p className="mt-5 text-sm leading-7 text-[#d5d5d0]">筛选条件会写进链接；收藏或转发后，打开的仍是同一组结果。</p></div>
      </section>

      <section className="mt-10 grid gap-10 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
        <aside className="h-fit border-y border-white/[0.22] py-4 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-[#fff8ed]">筛选文章</p><div className="flex items-center gap-1">{hasFilters && <button onClick={reset} className="flex items-center gap-1 border-b border-white/[0.35] px-1 py-1 text-xs text-[#e5e2db] hover:border-[#d0f4ee] hover:text-[#d0f4ee]"><X size={13} />清除</button>}<button onClick={() => setFiltersOpen((open) => !open)} className="flex items-center gap-1 border-b border-white/[0.35] px-1 py-1 text-xs text-[#e5e2db] hover:border-[#d0f4ee] hover:text-[#d0f4ee] lg:hidden" aria-expanded={filtersOpen}><SlidersHorizontal size={13} />{filtersOpen ? "收起" : "筛选"}<ChevronDown size={13} className={filtersOpen ? "rotate-180 transition-transform" : "transition-transform"} /></button></div></div>
          <div className={`mt-5 ${filtersOpen ? "block" : "hidden"} lg:block`}>
            <div className="relative"><Search className="absolute left-3 top-3 text-[#d0cfca]" size={15} /><Input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }} placeholder="搜索标题或摘要" className="quiet-input h-11 pl-10 text-sm" aria-label="搜索文章" /></div>
            <div className="mt-7"><p className="editorial-kicker">标签</p><div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">{tags?.map((tag: any) => <button key={tag.id} onClick={() => { setSelectedTag(selectedTag === tag.slug ? null : tag.slug); setPage(1); }} aria-pressed={selectedTag === tag.slug} className={`border-b pb-1 text-xs transition-colors ${selectedTag === tag.slug ? "border-[#d0f4ee] text-[#d0f4ee]" : "border-transparent text-[#e5e2db] hover:border-white/[0.4] hover:text-white"}`}>#{tag.name}</button>)}</div></div>
            <div className="mt-7 border-t border-white/[0.18] pt-6"><p className="editorial-kicker">分类</p><div className="mt-3 grid gap-1">{categories?.map((category: any) => <button key={category.id} onClick={() => { const value = String(category.id); setSelectedCategory(selectedCategory === value ? null : value); setPage(1); }} aria-pressed={selectedCategory === String(category.id)} className={`px-1 py-2 text-left text-sm transition-colors ${selectedCategory === String(category.id) ? "bg-[#eab78c]/18 text-[#fff0df]" : "text-[#e5e2db] hover:bg-white/[0.07] hover:text-white"}`}>{category.name}</button>)}</div></div>
          </div>
        </aside>

        <div>
          <div className="flex items-end justify-between gap-4 border-b border-white/[0.28] pb-4"><div><span className="text-sm font-medium text-[#fff8ed]">文章</span>{hasFilters && <p className="mt-1 text-xs text-[#d0cfca]">当前列表已按你的条件筛选</p>}</div><span className="text-sm text-[#d5d5d0]" aria-live="polite">{resultCountLabel}</span></div>
          {isLoading ? <div className="space-y-0" aria-label="正在读取文章"><div className="h-40 animate-pulse border-b border-white/[0.18] bg-white/[0.04]" /><div className="h-40 animate-pulse border-b border-white/[0.18] bg-white/[0.04]" /></div> : postsData?.data && postsData.data.length > 0 ? <div className="divide-y divide-white/[0.2]">{postsData.data.map((post: any) => <button key={post.id} type="button" onClick={() => navigate(`/posts/${post.slug}`)} className="group grid w-full cursor-pointer gap-5 py-5 text-left transition-colors hover:bg-white/[0.055] sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6 sm:px-3 sm:py-6" aria-label={`阅读文章：${post.title}`}><div className="article-cover aspect-[1.55] sm:aspect-[1.25]"><img src={resolveCover(post)} alt={post.title} loading="lazy" /></div><div className="min-w-0 sm:py-1"><div className="flex items-center justify-between gap-4"><span className="text-xs text-[#e5e2db]">{post.category?.name || "未分类"}</span><span className="text-xs text-[#d0cfca]">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "尚未发布"}</span></div><h2 className="mt-3 text-xl font-medium leading-snug text-[#fff8ed] transition-colors group-hover:text-[#d0f4ee] sm:text-2xl">{post.title}</h2><p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-7 text-[#dfddd7]">{post.excerpt || "作者没有填写摘要。"}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-x-3 gap-y-2">{post.tags?.slice(0, 3).map((tag: any) => <span key={tag.id} className="text-xs text-[#d5d5d0]">#{tag.name}</span>)}<span title={`预计 ${formatReadingTime(post.content || "")}`} className="flex items-center gap-1 text-xs text-[#d5d5d0]"><Clock3 size={13} />{formatReadingTime(post.content || "")}</span></div><span className="flex items-center gap-1.5 text-xs text-[#d0f4ee]">{post.viewCount || 0} 次阅读 <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" /></span></div></div></button>)}</div> : <div className="border-b border-white/[0.2] py-20 text-center"><p className="text-sm font-medium text-[#fff8ed]">没有找到对应文章</p><p className="mt-3 text-sm text-[#d0cfca]">可以换一个词搜索，或移除其中一项筛选条件。</p>{hasFilters && <button onClick={reset} className="mt-5 border-b border-[#d0f4ee] pb-1 text-sm text-[#d0f4ee] hover:text-white">恢复全部文章</button>}</div>}
          {postsData?.data && postsData.data.length > 0 && <div className="mt-6 flex items-center justify-between border-t border-white/[0.22] pt-5"><Button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} variant="ghost" className="text-[#e5e2db] hover:bg-white/[0.08] hover:text-[#d0f4ee]"><ChevronLeft size={15} className="mr-1" />上一页</Button><span className="text-xs text-[#d0cfca]">第 {page} / {totalPages} 页</span><Button onClick={() => setPage(page + 1)} disabled={page >= totalPages} variant="ghost" className="text-[#e5e2db] hover:bg-white/[0.08] hover:text-[#d0f4ee]">下一页<ChevronRight size={15} className="ml-1" /></Button></div>}
        </div>
      </section>
    </div>
  );
}
