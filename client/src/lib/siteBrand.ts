export const siteBrand = {
  avatarSrc: "/manus-storage/morro-blog-avatar_1e735c73.webp",
  avatarAlt: "MorroBlog 头像",
  name: "MORROBLOG",
  subtitle: "个人技术札记",
  author: {
    name: "Morro",
    label: "个人技术记录者",
    introduction: "记录开源项目、AI 工具、系统与硬件，也把那些值得复盘的创作过程慢慢写下来。",
    interests: ["开源实践", "AI 工具", "系统与硬件"] as const,
    now: {
      label: "现在在做什么",
      text: "持续维护 MorroBlog：把阅读、创作和运行体验一点点补齐。",
      updatedLabel: "2026.08 · 维护中",
    },
    contact: {
      github: {
        label: "GitHub",
        handle: "realmorro369-arch",
        href: "https://github.com/realmorro369-arch",
      },
      email: {
        label: "Email",
        address: "realmorro369@gmail.com",
        href: "mailto:realmorro369@gmail.com",
      },
    },
  },
  home: {
    openingTitle: "折腾不是履历，\n是下一次少走弯路的底稿。",
    openingDescription: "把踩过的坑、做过的取舍和确认有效的工具整理成短记录，给未来的自己，也给路过这里的人。",
  },
} as const;
