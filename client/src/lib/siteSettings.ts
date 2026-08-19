import { siteBrand } from "@/lib/siteBrand";

type PersistedSiteSettings = {
  siteName: string;
  siteSubtitle: string;
  avatarSrc: string;
  avatarAlt: string;
  authorName: string;
  authorLabel: string;
  authorIntroduction: string;
  authorInterests: string;
  statusLabel: string;
  statusText: string;
  statusUpdatedLabel: string;
  githubLabel: string;
  githubHandle: string;
  githubHref: string;
  emailLabel: string;
  emailAddress: string;
  emailHref: string;
  homeOpeningTitle: string;
  homeOpeningDescription: string;
  quoteFallback: string;
  featuredPostIds: string;
  backgroundWhitelist: string;
  navigationOrder: string;
};

function parseStringArray(value: string | undefined, fallback: readonly string[]) {
  if (!value) return [...fallback];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) return parsed;
  } catch {
    // 损坏的持久化数组不可影响公开页面；使用经过代码审阅的回退配置。
  }
  return [...fallback];
}

export function resolveSiteSettings(settings?: PersistedSiteSettings | null) {
  const fallbackNavigation = ["home", "posts", "timeline", "archives", "tags", "gallery", "about"];
  if (!settings) {
    return {
      ...siteBrand,
      quoteFallback: "正在摘取一句话…",
      featuredPostIds: [] as number[],
      backgroundWhitelist: [] as string[],
      navigationOrder: fallbackNavigation,
    };
  }

  return {
    name: settings.siteName,
    subtitle: settings.siteSubtitle,
    avatarSrc: settings.avatarSrc,
    avatarAlt: settings.avatarAlt,
    author: {
      name: settings.authorName,
      label: settings.authorLabel,
      introduction: settings.authorIntroduction,
      interests: parseStringArray(settings.authorInterests, siteBrand.author.interests),
      now: { label: settings.statusLabel, text: settings.statusText, updatedLabel: settings.statusUpdatedLabel },
      contact: {
        github: { label: settings.githubLabel, handle: settings.githubHandle, href: settings.githubHref },
        email: { label: settings.emailLabel, address: settings.emailAddress, href: settings.emailHref },
      },
    },
    home: { openingTitle: settings.homeOpeningTitle, openingDescription: settings.homeOpeningDescription },
    quoteFallback: settings.quoteFallback,
    featuredPostIds: parseStringArray(settings.featuredPostIds, []).flatMap(id => Number.isInteger(Number(id)) ? [Number(id)] : []),
    backgroundWhitelist: parseStringArray(settings.backgroundWhitelist, []),
    navigationOrder: parseStringArray(settings.navigationOrder, fallbackNavigation),
  };
}

export type ResolvedSiteSettings = ReturnType<typeof resolveSiteSettings>;
