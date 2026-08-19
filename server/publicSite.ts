import type { Request } from "express";
import * as db from "./db";

const siteName = "MorroBlog";
const siteDescription = "Morro 的个人技术札记：记录开源项目、AI 工具、系统与硬件。";
const fallbackImage = "/manus-storage/observatory-night_fc4b375d.jpg";

type PageMetadata = {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  type: "website" | "article";
};

function xmlEscape(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] || character);
}

function stripMarkup(value: string, maxLength = 180) {
  const compact = value.replace(/```[\s\S]*?```/g, "").replace(/[`*_>#\[\]()!-]/g, " ").replace(/\s+/g, " ").trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1)}…` : compact;
}

export function getPublicSiteUrl(req: Request) {
  const configured = process.env.PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return `${forwardedProto || req.protocol}://${req.get("host")}`;
}

function absoluteUrl(baseUrl: string, value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, `${baseUrl}/`).toString();
}

export async function getPageMetadata(pathname: string, baseUrl: string): Promise<PageMetadata> {
  const normalizedPath = pathname.split("?")[0] || "/";
  const defaultMetadata: PageMetadata = {
    title: `${siteName} — Midnight Field Notes`,
    description: siteDescription,
    canonicalUrl: absoluteUrl(baseUrl, normalizedPath),
    imageUrl: absoluteUrl(baseUrl, fallbackImage),
    type: "website",
  };

  const match = normalizedPath.match(/^\/posts\/([^/]+)$/);
  if (!match) return defaultMetadata;
  const post = await db.getPostDetailBySlug(decodeURIComponent(match[1]));
  if (!post || post.status !== "published") return defaultMetadata;
  return {
    title: `${post.title} · ${siteName}`,
    description: post.excerpt?.trim() || stripMarkup(post.content),
    canonicalUrl: absoluteUrl(baseUrl, `/posts/${post.slug}`),
    imageUrl: absoluteUrl(baseUrl, post.coverImage || fallbackImage),
    type: "article",
  };
}

export function injectPageMetadata(template: string, metadata: PageMetadata) {
  const tags = [
    `<title>${xmlEscape(metadata.title)}</title>`,
    `<meta name="description" content="${xmlEscape(metadata.description)}" />`,
    `<link rel="canonical" href="${xmlEscape(metadata.canonicalUrl)}" />`,
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta property="og:type" content="${metadata.type}" />`,
    `<meta property="og:title" content="${xmlEscape(metadata.title)}" />`,
    `<meta property="og:description" content="${xmlEscape(metadata.description)}" />`,
    `<meta property="og:url" content="${xmlEscape(metadata.canonicalUrl)}" />`,
    `<meta property="og:image" content="${xmlEscape(metadata.imageUrl)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${xmlEscape(metadata.title)}" />`,
    `<meta name="twitter:description" content="${xmlEscape(metadata.description)}" />`,
    `<meta name="twitter:image" content="${xmlEscape(metadata.imageUrl)}" />`,
  ].join("\n    ");
  return template.replace("<!-- site-meta -->", tags);
}

export async function createRssXml(baseUrl: string) {
  const items = await db.getPublishedPosts(100, 0);
  const entries = items.map((post) => {
    const link = absoluteUrl(baseUrl, `/posts/${post.slug}`);
    const description = post.excerpt?.trim() || stripMarkup(post.content);
    const publishedAt = post.publishedAt || post.createdAt;
    return `<item><title>${xmlEscape(post.title)}</title><link>${xmlEscape(link)}</link><guid isPermaLink="true">${xmlEscape(link)}</guid><pubDate>${new Date(publishedAt).toUTCString()}</pubDate><description>${xmlEscape(description)}</description><content:encoded><![CDATA[${post.content}]]></content:encoded></item>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>${siteName}</title><link>${xmlEscape(baseUrl)}</link><description>${xmlEscape(siteDescription)}</description><language>zh-CN</language><atom:link href="${xmlEscape(absoluteUrl(baseUrl, "/rss.xml"))}" rel="self" type="application/rss+xml"/>${entries}</channel></rss>`;
}

export async function createSitemapXml(baseUrl: string) {
  const staticPaths = ["/", "/posts", "/timeline", "/archives", "/tags", "/gallery", "/about"];
  const posts = await db.getPublishedPosts(1000, 0);
  const entries = [
    ...staticPaths.map((pathname) => ({ pathname, lastmod: undefined as Date | undefined })),
    ...posts.map((post) => ({ pathname: `/posts/${post.slug}`, lastmod: post.updatedAt || post.publishedAt || post.createdAt })),
  ];
  const urls = entries.map(({ pathname, lastmod }) => `<url><loc>${xmlEscape(absoluteUrl(baseUrl, pathname))}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}</url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function createRobotsTxt(baseUrl: string) {
  return `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl(baseUrl, "/sitemap.xml")}\n`;
}
