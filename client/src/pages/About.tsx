const stack = [
  ["01", "写作界面", "React 19 · TypeScript · Tailwind CSS 4"],
  ["02", "服务与认证", "Express · tRPC · 邮箱验证码认证"],
  ["03", "数据与存储", "MySQL · Drizzle ORM · S3 Storage"],
  ["04", "部署方式", "Docker Compose · fnos"],
];

export default function About() {
  return (
    <div>
      <section className="grid border-y border-white/[0.15] py-10 sm:py-14 lg:grid-cols-12">
        <div className="lg:col-span-7"><p className="editorial-kicker">关于本站 · 2026</p><h1 className="display-title mt-4 text-5xl sm:text-6xl">一个用来整理<br /><span className="display-accent">技术记录的地方。</span></h1></div>
        <div className="mt-7 max-w-md lg:col-span-4 lg:col-start-9 lg:mt-1"><p className="copy-lede">MorroBlog 是个人技术记录站。这里放代码、工具、硬件和创作过程中的试验，也保留当时的取舍与后来得到的结论。</p></div>
      </section>

      <section className="grid border-b border-white/[0.15] py-12 sm:py-16 lg:grid-cols-12">
        <div className="lg:col-span-3"><p className="editorial-kicker">写作原则</p></div>
        <div className="lg:col-span-7"><p className="text-2xl leading-[1.8] text-stone-200 sm:text-3xl" style={{ fontFamily: '"Noto Serif SC", serif' }}>“把正在研究的问题、试过的方法和暂时的结论写下来，让以后需要时还能找到。”</p><p className="mt-8 max-w-2xl text-sm leading-8 text-[#c7cbd0]">本站提供发布、阅读、评论、归档、图片集和权限管理。界面尽量把重点留给内容，不用虚构数据或装饰性模块填空。</p></div>
      </section>

      <section className="border-b border-white/[0.15] py-12 sm:py-16"><p className="editorial-kicker">使用的技术</p><div className="mt-7 grid border-t border-white/[0.12] md:grid-cols-2">{stack.map(([number, title, value], index) => <div key={title} className={`grid grid-cols-[54px_1fr] gap-3 border-b border-white/[0.12] py-5 ${index % 2 === 0 ? "md:border-r md:pr-8" : "md:pl-8"}`}><span className="article-index">{number}</span><div><h2 className="font-mono text-[11px] tracking-[0.13em] text-[#c6edf0]">{title}</h2><p className="mt-2 text-sm text-[#c7cbd0]">{value}</p></div></div>)}</div></section>

      <section className="grid gap-8 border-b border-white/[0.15] py-12 sm:py-16 lg:grid-cols-12"><div className="lg:col-span-3"><p className="editorial-kicker">本站在意的事</p></div><div className="grid gap-7 sm:grid-cols-2 lg:col-span-8"><div><h2 className="text-lg text-stone-200">先把内容说清楚</h2><p className="mt-3 text-sm leading-7 text-[#c7cbd0]">图像、动效和色彩帮助阅读，但不应该盖过文章本身。</p></div><div><h2 className="text-lg text-stone-200">保留真实的过程</h2><p className="mt-3 text-sm leading-7 text-[#c7cbd0]">不拿虚构文章、评论或图片填页面；有多少内容，就展示多少内容。</p></div><div><h2 className="text-lg text-stone-200">能部署也能维护</h2><p className="mt-3 text-sm leading-7 text-[#c7cbd0]">项目使用 Docker Compose 组织服务，可部署到 fnos 并继续维护。</p></div><div><h2 className="text-lg text-stone-200">让记录找得回来</h2><p className="mt-3 text-sm leading-7 text-[#c7cbd0]">标签、归档和图片集帮助以后按线索找到当时留下的资料。</p></div></div></section>
    </div>
  );
}
