# Halo APlayer 候选播放器研究

更新日期：2026-08-18

候选项目为 [`Aziteee/halo-plugin-aplayer`](https://github.com/Aziteee/halo-plugin-aplayer)，Halo 官方应用市场将其描述为“集成 APlayer 音乐播放器与 MetingJS 到 Halo 2.0”，当前市场版本为 1.1.1，要求 Halo `>= 2.20.0`。[1]

| 维度 | APlayer 插件 | 当前 Navidrome Player |
| --- | --- | --- |
| 主要形态 | 文章内嵌单曲播放器；编辑器可插入 APlayer 或 Meting 节点 | 全站可拖拽悬浮气泡与完整主面板 |
| 音乐来源 | 每篇内容传入 `url`、`cover`、`lrc`；可选 Meting API | 自建 Navidrome / Subsonic API 的歌单与搜索接口 |
| 歌词 | 通过单曲 `lrc` 属性加载 | 通过歌曲 ID、歌手、标题请求歌词端点 |
| 搜索与队列 | 不提供全站队列搜索；Meting 负责外部音乐解析 | 内建当前歌单搜索、分页/滚动与多歌单切换 |
| 移动端策略 | 提供 CSS 变量、暗色模式适配；主体依赖文章内布局 | 专门处理悬浮位置、窄屏压缩和侧边抽屉 |
| 许可证 | GPL-3.0 | MIT |
| 仓库内歌曲 | 未发现音频文件 | 未发现音频文件 |

上游 `APlayerJSInjector.java` 在页面扫描 `div[aplayer]`，用 `name`、`artist`、`url`、`cover`、`lrc` 初始化 APlayer；它还加载 MetingJS 和自定义变量样式。因此它适合在某篇文章中嵌入一首或几首明确提供 URL 的曲目，而不适合作为当前 MorroBlog 的全局悬浮队列播放器。

> 建议：若后续要在文章正文插入与内容主题相关的单曲，可研究采用 APlayer 的原始 MIT 库或自行实现等价的文章嵌入块。不要直接将该 Halo 插件并入当前项目，因为其插件整体为 GPL-3.0，且不包含可再分发歌曲。对于全站悬浮播放器，当前 Navidrome Player 的 MIT 代码路线更匹配。

## 参考

[1]: https://www.halo.run/store/apps/app-stWoc "Halo 应用市场：APlayer"
[2]: https://github.com/Aziteee/halo-plugin-aplayer "Aziteee/halo-plugin-aplayer"
[3]: https://github.com/Aziteee/halo-plugin-aplayer/blob/main/LICENSE "APlayer Halo 插件 GPL-3.0 许可证"
