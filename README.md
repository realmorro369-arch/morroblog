# MorroBlog - 个人技术博客系统

一个面向 fnOS 部署的个人技术博客系统，采用“午夜天文台 × 日系独立技术刊物”视觉语言，并提供完整的写作、阅读、评论与管理工作流。

## ✨ 核心功能

### 用户与认证
- 邮箱验证码注册、密码登录、登出与忘记密码安全重设
- 163 SMTP 验证码邮件与频率限制
- 管理员与普通用户角色区分
- 权限管理系统

### 文章管理
- Markdown 编辑器支持
- 文章发布、草稿保存、删除
- 文章封面图上传（S3 存储）
- 阅读量统计与显示

### 内容组织
- 标签系统（创建、筛选）
- 分类系统（创建、筛选）
- 公开文章时间轴与月度归档
- 图片集展示功能

### 互动功能
- 评论系统（支持嵌套回复）
- 评论审核机制
- 实时互动反馈

### 视觉设计
- 午夜天文台 × 日系独立技术刊物视觉语言
- 夜蓝背景、冰蓝信号色、编辑型排版与非对称网格
- 手动触发的三层悬浮播放器，支持顺序播放、真实内嵌封面、实时歌词、拖拽与进度控制
- 首页通过公开一言接口展示可刷新短句，并保留网络异常回退
- 完全响应式布局

### 管理后台
- 文章管理模块（状态概览、编辑、查看与删除反馈）
- 用户管理模块
- 评论审核模块

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 19 + Tailwind CSS 4 + TypeScript |
| **后端** | Express + tRPC + Node.js |
| **数据库** | MySQL 8.0 |
| **存储** | S3（文件存储） |
| **部署** | Docker + fnos |
| **认证** | 邮箱验证码 + 密码哈希 + JWT Cookie 会话 |

## 📦 快速开始

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm check

# 运行测试
pnpm test
```

默认测试套件不会频繁向 163 SMTP 发起 TLS 登录，以避免上游临时认证限制导致与代码无关的失败。部署前需要人工核验 SMTP 凭据时，可显式执行：

```bash
RUN_SMTP_INTEGRATION=true pnpm vitest run server/smtpConnection.test.ts
```

访问 `http://localhost:3000` 查看应用。

### 生产部署

MorroBlog 提供两条独立路径。**fnOS 或其他 Docker 环境**使用 Docker Compose；已有 Node.js 22 与 MySQL 的服务器可直接使用 Node.js 直启。两种方式均执行同一套 Drizzle 迁移、生产构建和 `/healthz` 健康检查。

#### 方式 1：Docker Compose（fnOS 推荐）

```bash
# 创建仅保存在 fnOS 本机的 .env（不要提交到 Git）
cat > .env <<'EOF'
MYSQL_ROOT_PASSWORD=请替换为高强度根密码
MYSQL_DATABASE=morroblog
MYSQL_USER=morroblog
MYSQL_PASSWORD=请替换为高强度应用数据库密码
JWT_SECRET=请替换为至少 32 字符的随机密钥
EOF

# 首次构建并启动；MySQL 不会映射到 fnOS 主机端口
docker compose up -d --build

# 核对应用健康状态与最近日志
docker compose ps
docker compose logs --tail=100 app
```

在 fnOS 中，可通过 Docker 应用导入本仓库的 `docker-compose.yml`，并在界面中配置同名环境变量后启动。

#### 方式 2：普通 Node.js 直启

适用于已经拥有 **Node.js 22、pnpm 与 MySQL 8** 的 Linux 服务器、NAS 或本地环境。完整操作、systemd 托管与健康检查说明见 [`NODE_DEPLOYMENT.md`](./NODE_DEPLOYMENT.md)。

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run build

# 先在当前 shell 安全导入私有环境变量文件，再迁移和启动
set -a && . /etc/morroblog/morroblog.env && set +a
pnpm run start:production
```

#### fnOS 环境变量配置

1. 在 fnos 系统中打开 Docker 应用
2. 上传 `docker-compose.yml` 文件
3. 配置环境变量
4. 点击"启动"按钮

> Compose 已要求 `MYSQL_ROOT_PASSWORD`、`MYSQL_DATABASE`、`MYSQL_USER`、`MYSQL_PASSWORD` 与 `JWT_SECRET` 显式提供；缺失时会拒绝启动。MySQL 仅暴露在 Compose 内部网络，fnOS 主机只映射博客 HTTP 端口 `3000`。

#### 环境变量配置

```env
# 数据库
MYSQL_ROOT_PASSWORD=your-password
MYSQL_DATABASE=morroblog
MYSQL_USER=morroblog
MYSQL_PASSWORD=your-db-password

# 应用
JWT_SECRET=your-jwt-secret
NODE_ENV=production

# 邮件验证码（163 SMTP 示例）
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your-mail@163.com
SMTP_PASS=your-163-smtp-authorization-code
SMTP_FROM="MorroBlog <your-mail@163.com>"

# 首个管理员：填写与你用于注册的收件邮箱，不要填写 SMTP 发件邮箱
INITIAL_ADMIN_EMAIL=your-admin-registration-email@example.com
```

详细字段说明、启动后健康检查及升级命令见 [`FNOS_DOCKER_DEPLOYMENT.md`](./FNOS_DOCKER_DEPLOYMENT.md)。

## 📁 项目结构

```
MorroBlog/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 可复用组件
│   │   ├── lib/           # 工具函数
│   │   └── App.tsx        # 主应用
│   └── index.html
├── server/                # 后端应用
│   ├── routers.ts         # tRPC 路由
│   ├── db.ts              # 数据库查询
│   └── _core/             # 核心框架
├── drizzle/               # 数据库 schema
├── docker-compose.yml     # Docker 编排
├── Dockerfile             # Docker 镜像
└── package.json
```

## 🗄️ 数据库架构

### 核心表

| 表名 | 说明 |
|------|------|
| `users` | 用户表 |
| `posts` | 文章表 |
| `comments` | 评论表（支持嵌套） |
| `tags` | 标签表 |
| `categories` | 分类表 |
| `post_tags` | 文章-标签关联 |
| `galleries` | 图片集表 |
| `images` | 图片表 |

## 🔌 API 路由

### 文章 API
- `GET /api/trpc/posts.list` - 获取文章列表
- `GET /api/trpc/posts.getBySlug` - 获取文章详情
- `POST /api/trpc/posts.create` - 创建文章
- `POST /api/trpc/posts.update` - 更新文章
- `POST /api/trpc/posts.delete` - 删除文章

### 评论 API
- `GET /api/trpc/comments.list` - 获取评论列表
- `POST /api/trpc/comments.create` - 创建评论
- `POST /api/trpc/comments.delete` - 删除评论

### 标签 API
- `GET /api/trpc/tags.list` - 获取标签列表
- `POST /api/trpc/tags.create` - 创建标签（管理员）

### 分类 API
- `GET /api/trpc/categories.list` - 获取分类列表
- `POST /api/trpc/categories.create` - 创建分类（管理员）

### 图片集 API
- `GET /api/trpc/galleries.list` - 获取图片集列表
- `GET /api/trpc/galleries.getById` - 获取图片集详情
- `POST /api/trpc/galleries.create` - 创建图片集（管理员）
- `POST /api/trpc/galleries.addImage` - 添加图片（管理员）

## 🎨 设计特色

### 午夜天文台 × 日系独立技术刊物
- 夜蓝层次背景与经过筛选的天文图像，含加载失败回退
- 暖白正文、冰蓝交互与低饱和珊瑚色标记
- 编辑型标题、等宽元信息与内容优先的文章流
- 不使用不可交互的视觉占位组件或虚构访客内容

### 交互与可访问性
- 阅读、写作、管理与账号恢复场景的轻量过渡，以及键盘可达导航
- 桌面与移动端独立的信息密度和编辑操作布局
- 环境音仅在访客主动点击后播放

## 🔐 安全性

- 邮箱验证码注册与密码重设，验证码按用途隔离并哈希存储、10 分钟有效、60 秒发送冷却和每小时频率限制
- 密码重设后递增会话版本，使此前本地会话失效
- bcrypt 密码哈希与 httpOnly JWT Cookie 会话
- 评论审核机制
- 管理员权限控制
- SQL 注入防护（Drizzle ORM）

## 📝 开发指南

### 添加新页面

1. 在 `client/src/pages/` 创建页面组件
2. 在 `client/src/App.tsx` 中添加路由
3. 在 `BlogLayout` 中更新导航（如需要）

### 添加新 API

1. 在 `server/db.ts` 添加数据库查询函数
2. 在 `server/routers.ts` 添加 tRPC 过程
3. 在前端使用 `trpc.*.useQuery/useMutation` 调用

### 数据库迁移

```bash
# 修改 schema
# 编辑 drizzle/schema.ts

# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移
pnpm drizzle-kit migrate
```

## 🚀 部署到 fnos

### 前置条件
- fnos 系统已安装
- Docker 支持已启用
- MySQL 容器可用

### 部署步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/realmorro369-arch/morroblog.git
   cd morroblog
   ```

2. **配置环境**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

4. **访问应用**
   - 打开浏览器访问 `http://your-fnos-ip:3000`
   - 使用邮箱注册：获取验证码、验证邮箱并设置密码

## 📊 监控与维护

### 查看日志
```bash
docker-compose logs -f app
docker-compose logs -f mysql
```

### 备份数据库
```bash
docker-compose exec mysql mysqldump -u morroblog -p morroblog > backup.sql
```

### 更新应用
```bash
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

## 🐛 故障排除

| 问题 | 解决方案 |
|------|--------|
| 数据库连接失败 | 检查 `DATABASE_URL` 环境变量 |
| 收不到验证码 | 检查 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS` 与垃圾邮件箱 |
| 文件上传失败 | 检查 S3 存储配置 |
| 页面加载缓慢 | 检查网络连接和数据库性能 |

## 📄 许可证

 GNU GPL v3.0 或更高版本（GPL-3.0-or-later）。项目直接适配了 Halo Console 的 GPL-3.0 `BasicLayout.vue`，完整许可证与来源/修改说明见 [`THIRD_PARTY_CONSOLE_ATTRIBUTION.md`](./THIRD_PARTY_CONSOLE_ATTRIBUTION.md)。

## 👤 作者

Morro - 沉浸式宇宙美学博客爱好者

## 🙏 致谢

感谢所有开源项目的贡献者，特别是：
- React & Tailwind CSS 团队
- tRPC 和 Drizzle ORM 开发者
- Manus 平台支持

---

**最后更新**: 2026年8月17日
**版本**: v1.0.0  
**状态**: 首个正式发布版本；详见 [CHANGELOG.md](./CHANGELOG.md)
