export const primaryNavigationItems = [
  { id: "home", label: "首页", href: "/" },
  { id: "posts", label: "文章", href: "/posts" },
  { id: "timeline", label: "时间轴", href: "/timeline" },
  { id: "archives", label: "归档", href: "/archives" },
  { id: "tags", label: "标签", href: "/tags" },
  { id: "gallery", label: "图片集", href: "/gallery" },
  { id: "about", label: "关于", href: "/about" },
] as const;

// 所有栏目在任意屏幕尺寸下直接渲染：手机端作为七列导航，宽屏时常显于右上角。
export const primaryNavigationLayout = "order-3 grid w-full grid-cols-7 items-stretch border-y border-white/[0.2] lg:order-2 lg:ml-auto lg:flex lg:w-auto lg:gap-5 lg:border-y-0";
