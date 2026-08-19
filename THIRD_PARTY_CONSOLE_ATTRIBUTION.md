# Halo Console 管理中心归属与适配说明

## 直接复用的上游文件

| 上游项目 | 固定提交 | 原始文件 | 本项目位置 | 许可证 |
|---|---|---|---|---|
| [`halo-dev/console`](https://github.com/halo-dev/console) | `d6616cf7031f6113cfb5c317dc88abd9e674c44e` | `src/layouts/BasicLayout.vue` | `third_party/halo-console/src/layouts/BasicLayout.vue` | GNU GPL v3.0 或更高版本 |
| [`halo-dev/console`](https://github.com/halo-dev/console) | `d6616cf7031f6113cfb5c317dc88abd9e674c44e` | `src/modules/contents/posts/PostEditor.vue` | `third_party/halo-console/src/modules/contents/posts/PostEditor.vue` | GNU GPL v3.0 或更高版本 |
| [`halo-dev/console`](https://github.com/halo-dev/console) | `d6616cf7031f6113cfb5c317dc88abd9e674c44e` | `src/components/editor/DefaultEditor.vue` | `third_party/halo-console/src/components/editor/DefaultEditor.vue` | GNU GPL v3.0 或更高版本 |
| [`halo-dev/console`](https://github.com/halo-dev/console) | `d6616cf7031f6113cfb5c317dc88abd9e674c44e` | `src/modules/contents/attachments/AttachmentList.vue` | `third_party/halo-console/src/modules/contents/attachments/AttachmentList.vue` | GNU GPL v3.0 或更高版本 |
| [`halo-dev/console`](https://github.com/halo-dev/console) | `d6616cf7031f6113cfb5c317dc88abd9e674c44e` | `src/modules/dashboard/Dashboard.vue` | `third_party/halo-console/src/modules/dashboard/Dashboard.vue` | GNU GPL v3.0 或更高版本 |
| [`halo-dev/console`](https://github.com/halo-dev/console) | `d6616cf7031f6113cfb5c317dc88abd9e674c44e` | `src/modules/contents/posts/PostList.vue` | `third_party/halo-console/src/modules/contents/posts/PostList.vue` | GNU GPL v3.0 或更高版本 |

完整上游许可证以未修改副本保留在 `third_party/halo-console/LICENSE`；本项目根目录 `LICENSE` 同步为 GNU GPL v3.0。

## 适配文件

`client/src/components/DashboardLayout.tsx` 是对上述原始布局的 React 适配。它保留上游的核心布局关系：桌面固定侧栏、分组菜单、移动抽屉菜单、账户区和主内容区；将 Vue、Pinia、Vue Router、Axios 与 Halo 专属 API 替换为 React、Wouter、站内 `useAuth` 与既有 tRPC 工作流。

`client/src/pages/AdminDashboard.tsx` 直接适配 `Dashboard.vue` 与 `PostList.vue` 的“页面标题/动作区 + 统计组件网格 + 最近内容 + 快捷入口 + 内容工作区”组织方式。`client/src/components/HaloPostEditor.tsx` 直接适配 `PostEditor.vue` 与 `DefaultEditor.vue`：保留“标题/保存/设置/发布动作区 + 全高编辑区 + 富文本工具栏 + 大纲/详情侧栏 + 图片拖放、粘贴与附件插入”的编辑组织方式。MorroBlog 将 Halo 的 HTML/插件/附件策略改写为 Tiptap、S3、tRPC 与 Markdown 持久化；图片上传统一为单文件不超过 30MB。`GalleryManagement` 则参考并适配 `AttachmentList.vue` 的目录—当前项—上传—网格整理顺序，但不构造 Halo 的不存在存储策略、用户筛选或伪造附件数据。

本项目没有复制 Halo 的后端 API、用户界面文字、图标资产、构建产物或其他未在上表列出的源码。后续任何新增的直接复用文件必须在本表追加其精确路径、提交、许可证和适配说明。
