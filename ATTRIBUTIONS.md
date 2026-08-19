# 素材归属

## 管理中心壳层

MorroBlog 的管理员 Console Shell 直接适配自 Halo Console 的 `src/layouts/BasicLayout.vue`：上游仓库为 [`halo-dev/console`](https://github.com/halo-dev/console)，固定提交为 `d6616cf7031f6113cfb5c317dc88abd9e674c44e`，原始文件和完整 GPL-3.0 许可证保留在 `third_party/halo-console/`。

适配内容将 Vue Router、Pinia、Halo REST 客户端和 Halo UI 组件替换为 Wouter、MorroBlog `useAuth`、tRPC 与现有 Radix/Shadcn 基础组件，同时保留其“固定侧栏、分组菜单、移动端菜单、个人资料区、主内容区”的布局结构。MorroBlog 因此将项目许可证声明为 `GPL-3.0-or-later`；每次继续引入 Halo 源文件都必须记录其固定来源、版权、许可证与修改说明。

## 音乐播放列表与歌词

MorroBlog 的站内播放器使用来自 `https://morro.asia/music/` 的七首曲目及其对应 LRC 时间轴文件，包括《Love Song》《红尘客栈》《花海》《三人游》《讨厌红楼梦》《烟花易冷》和《发如雪》。

站点所有者已于 2026-08-15 确认 MorroBlog 可以使用该项目的音乐与歌词资源。播放器引用原项目的公开音频和 LRC 地址，不自动在访客首次进入时播放；只有访客主动点击“播放歌单”后才开始播放。播放开始后，曲目会按列表顺序自动切换，并以音频时间驱动当前歌词行。

- 音乐脚本来源：`https://morro.asia/js/music.js?v=2`
- 音频与歌词基础路径：`https://morro.asia/music/`
- 当前播放器逻辑：恢复为 05b1a7c 版本的站内三级悬浮播放器。它直接读取上述已授权曲目清单、真实封面与 LRC 地址，支持一级闲置胶囊、二级控制条、三级歌词/选曲面板、进度拖动、上下切歌与位置拖拽；不依赖 Halo、Navidrome、Meting 或第三方音乐接口。

此前使用的 `Smile Drone` CC BY-SA 环境音已不再作为站点当前默认播放源；其原有来源记录仅保留在项目历史版本中。
