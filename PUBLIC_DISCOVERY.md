# MorroBlog 公开发现与分享配置

MorroBlog 会基于**真实已发布文章**生成 `/rss.xml` 与 `/sitemap.xml`；`/robots.txt` 会声明 sitemap 地址。文章页面在服务端按 slug 注入标题、摘要、canonical URL、Open Graph 和 Twitter Card 元信息，因此订阅器、搜索引擎和分享预览会读取同一份公开文章数据。

| 入口 | 用途 | 数据边界 |
| --- | --- | --- |
| `/rss.xml` | 订阅最新公开文章 | 仅 `published` 状态文章 |
| `/sitemap.xml` | 公开页面发现 | 静态栏目与真实公开文章 |
| `/robots.txt` | 爬虫发现 sitemap | 允许公开页面，不公开后台语义 |
| 文章 `<head>` | 分享卡片与搜索摘要 | 标题、摘要/正文提取、封面、canonical URL |

## 部署地址

默认情况下，站点会从当前 HTTP 请求的协议与 Host 构造公开 URL，适合 fnOS 的局域网地址与 Manus 预览地址。绑定稳定域名后，可在部署环境设置可选的服务端变量 `PUBLIC_SITE_URL`，例如 `https://blog.morro.asia`，以确保 RSS、sitemap 与分享卡片始终输出该规范域名。该变量不是私钥；没有设置时不会阻塞运行。

## 作者资料与当前状态

作者头像、昵称、自我介绍、关注方向、GitHub、Email 与“现在在做什么”统一维护在 `client/src/lib/siteBrand.ts`。修改该文件会同时更新首页作者卡和文章末尾作者卡，不会写入或伪造文章、评论或图片数据。
