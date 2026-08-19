# 开源博客首页研究记录

## Ghost 官方首页
来源：https://ghost.org/

Ghost 首屏不是直接展示一组文章，而是先用明确的价值主张说明“发布内容、通讯和订阅”的定位，再用产品能力、会员增长、分析和订阅转化模块展开。导航保持在页首，包含产品、探索、资源、定价、登录和开始使用等入口。对个人技术博客而言，可借鉴其“首屏先建立定位、再展示内容价值”的层级，但不必照搬商业转化模块。

## Hugo Themes 官方主题目录
来源：https://themes.gohugo.io/

Hugo 主题目录本身采用“主题缩略图网格 + 标签筛选”的发现结构，页首包含 News、Docs、Themes、Community、GitHub 和搜索。主题标签覆盖 blog、minimal、personal、dark、light、multilingual、portfolio、magazine、archive、gallery 等，说明开源博客首页常见的方向主要集中在：最新文章或文章流、分类/标签、归档、搜索、图库，以及明确的视觉主题切换。

## 初步结论

用户的首页可以从当前的登录/浏览文章双按钮，改为直接进入内容：首页首屏优先展示最新文章或精选文章，同时保留清晰的栏目导航；登录应降级为页首次要操作，而不是首页主行动。后续还需要继续对比 Jekyll、Hexo、WordPress/Ghost 主题或实际开源个人博客站点，再整理成可选择的首页方案，暂不修改代码。

## Jekyll 官方首页
来源：https://jekyllrb.com/

Jekyll 首页采用“核心定位 + 三个能力支柱”的结构，强调 Simple、Static、Blog-aware；导航提供 Docs、Resources、Showcase、News 和文档搜索。它没有把登录或单一 CTA 作为个人博客首页的主要内容，而是优先解释内容系统的特性，并通过 Showcase/News 进入真实内容。

## Hexo 官方首页
来源：https://hexo.io/

Hexo 首页首屏以“fast, simple & powerful blog framework”作为定位，紧接着展示版本新闻卡片；后续使用能力模块解释速度、Markdown、部署和插件生态，并提供 Get started、Themes、Docs、API、News、Plugins、About 和站内搜索。其结构说明开发者型博客首页可以把“最新内容 + 内容分类/能力入口 + 搜索”并列，而不是只放登录与浏览按钮。

## 更新后的研究方向

目前样本共同出现的高频结构是：页首常驻导航；首屏清晰定位；首页尽早出现最新内容、精选内容或新闻；搜索、标签、归档、主题/分类等发现入口；再根据站点目标加入订阅、社区、文档或项目入口。Ghost 偏内容商业化，Jekyll 偏简单与内容模型，Hexo 偏开发者工具和生态，Hugo 主题目录偏筛选和视觉风格。后续方案应围绕 MorroBlog 的个人技术札记定位做取舍，而不是照搬商业 CTA。

## PaperMod 实际演示首页
来源：https://adityatelange.github.io/hugo-PaperMod/

PaperMod 将首页做成真正的博客入口：页首直接提供 About、Archive、Search、Tags 和 Docs；首屏是简短主题介绍，随后立即列出文章卡片，包含标题、摘要、日期、阅读时间和分页。它的核心思想是“内容居中”，登录、商业转化等动作并不占据首页主位。这与 MorroBlog 直接展示文章的方向最接近。

## Blowfish 实际演示首页
来源：https://blowfish.page/

Blowfish 更偏个人品牌/主题展示：页首提供 Docs、Shortcodes、Examples、Users、Merch、搜索、语言和外观切换；首屏使用大视觉、头像/品牌名、简介和社交链接，下面展示主题演示视频、赞助者和贡献者。它说明首页也可以采用“个人身份与视觉记忆优先”的模式，但对于 MorroBlog，应谨慎避免大视觉挤压最新文章。

## 当前可选首页模式

第一种是“文章优先”：首屏标题简化为博客定位，紧接着展示最新文章列表，登录仅保留在页首。第二种是“精选 + 最新”：首屏保留一篇精选文章的大卡片，下面展示 3 至 6 篇最新文章。第三种是“个人品牌 + 内容”：保留主视觉和一句简介，但把文章列表上移到首屏下方，并提供标签、归档和搜索作为辅助入口。PaperMod 更接近第一种，Blowfish 更接近第三种。
