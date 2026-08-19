export type BackgroundImage = {
  id: string;
  src: string;
  alt: string;
};

// 只放入已确认适合公开首页、低干扰且可叠加文字的素材。
export const safeBackgroundImages: readonly BackgroundImage[] = [
  {
    id: "observatory-night",
    src: "/manus-storage/observatory-night_fc4b375d.jpg",
    alt: "夜空下的天文观测台",
  },
];

/** 将管理员保存的白名单路径转换为可公开使用的背景集合；非站内存储路径一律忽略。 */
export function resolveManagedBackgroundImages(paths: readonly string[]) {
  const uniquePaths = Array.from(new Set(paths.filter((path) => path.startsWith("/manus-storage/"))));
  if (uniquePaths.length === 0) return safeBackgroundImages;
  return uniquePaths.map((src, index) => ({
    id: `managed-background-${index}-${src.replace(/[^a-z0-9]/gi, "").slice(-24) || "image"}`,
    src,
    alt: "站点自定义背景",
  }));
}

export function chooseBackgroundImage(
  images: readonly BackgroundImage[] = safeBackgroundImages,
  randomValue = Math.random(),
) {
  if (images.length === 0) return undefined;
  const index = Math.min(images.length - 1, Math.floor(Math.max(0, randomValue) * images.length));
  return images[index];
}
