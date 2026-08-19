# Halo 控制台源码复用研究

## 已核验的初始事实

| 项目 | 发现 | 对 MorroBlog 的直接影响 |
|---|---|---|
| 旧 `halo-dev/console` 仓库 | 官方页面标注其为 Halo 2.0 管理端项目，已归档并迁入 `halo-dev/halo` 主仓库的 `console` 目录 | 研究与引用应以当前主仓库为准，旧仓库只作为历史定位依据。 |
| 许可证 | 归档仓库页面标注为 **GPL-3.0** | 不能把其 Vue 控制台组件、样式或业务代码直接混入当前 React 项目后仍以原项目的独立许可方式分发；若确需复制或修改受版权保护的实现，应先完成 GPL 兼容性评估、源代码与版权声明保留。 |
| 前端技术 | 仓库标签与源码描述显示为 Vue 控制台 | MorroBlog 使用 React 19，因此不能直接运行或局部嵌入 Vue 页面；优先复用信息架构、公开接口设计、无版权事实/行为观察，或仅在获得明确的技术与许可证评估后隔离集成。 |

## 用户授权后的实际适配

用户已明确授权直接复制并适配 Halo 方案。因此项目在固定提交 `d6616cf7031f6113cfb5c317dc88abd9e674c44e` 下复制了 `src/layouts/BasicLayout.vue` 的原始文件，保留在 `third_party/halo-console/src/layouts/BasicLayout.vue`，并将其完整 GPL-3.0 许可证副本保留在 `third_party/halo-console/LICENSE` 与项目根目录 `LICENSE`。

`client/src/components/DashboardLayout.tsx` 以该文件为直接结构来源，保留固定侧栏、分组菜单、移动抽屉菜单、账户区与主内容区；Vue Router、Pinia、Axios、Halo 组件与 Halo REST 调用替换为 React、Wouter、站内 `useAuth`、tRPC 与 Radix/Shadcn 组件。MorroBlog 的 `package.json`、根目录 `LICENSE` 和 README 均同步为 `GPL-3.0-or-later`。完整逐文件归属、适配差异与后续新增源码的记录规则见 `THIRD_PARTY_CONSOLE_ATTRIBUTION.md`。

## 来源

1. [halo-dev/console（已归档仓库）](https://github.com/halo-dev/console)
2. [halo-dev/halo（主仓库）](https://github.com/halo-dev/halo)
