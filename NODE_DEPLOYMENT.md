# 普通 Node.js 生产部署

本方式不使用 Docker，适用于已具备 **Node.js 22、Corepack/pnpm 与 MySQL 8** 的 Linux 服务器、NAS 或本地设备。应用使用与 Docker 镜像相同的 `pnpm run build` 产物、Drizzle 迁移和 `/healthz` 健康检查。

## 1. 准备私有运行环境

将环境变量文件置于仓库外，例如 `/etc/morroblog/morroblog.env`，并限制为运行账户可读。不要将该文件提交 Git。

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://morroblog:替换为高强度数据库密码@127.0.0.1:3306/morroblog
JWT_SECRET=替换为至少32字符的随机密钥

# 按需启用邮箱注册和文件上传。
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
INITIAL_ADMIN_EMAIL=
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=
VITE_FRONTEND_FORGE_API_KEY=
```

数据库账号仅授予 `morroblog` 数据库权限；不要使用 MySQL root 账号作为 `DATABASE_URL`。`INITIAL_ADMIN_EMAIL` 必须是注册时使用的收件邮箱，不是 SMTP 发件账号。

## 2. 安装、构建与启动

```bash
git clone https://github.com/realmorro369-arch/morroblog.git
cd morroblog
corepack enable
pnpm install --frozen-lockfile
pnpm run build

set -a && . /etc/morroblog/morroblog.env && set +a
pnpm run db:migrate
pnpm run start:production
```

`db:migrate` 是明确的一次性数据库变更步骤；`start:production` 只启动 `dist/index.js`，因此日常重启不会意外重复执行建表语句。对于已存在但从未使用 Drizzle 迁移管理的旧数据库，先备份并完成迁移台账基线后再执行 `db:migrate`；不要通过忽略迁移错误继续发布。

## 3. 健康检查与 systemd 托管

启动后在服务器本机检查：

```bash
curl -fsS http://127.0.0.1:3000/healthz
```

返回 `ok` 表示进程已开始接收 HTTP 请求。以下 systemd 单元将使用非 root 的 `morroblog` 账户运行；将路径和账户名替换为实际值。

```ini
[Unit]
Description=MorroBlog Node.js service
After=network.target mysql.service

[Service]
Type=simple
User=morroblog
WorkingDirectory=/srv/morroblog
EnvironmentFile=/etc/morroblog/morroblog.env
ExecStartPre=/usr/bin/env pnpm run db:migrate
ExecStart=/usr/bin/env pnpm run start:production
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

保存为 `/etc/systemd/system/morroblog.service` 后执行 `sudo systemctl daemon-reload && sudo systemctl enable --now morroblog`。用 `sudo systemctl status morroblog` 和 `journalctl -u morroblog -f` 查看状态与日志。

## 4. 更新

```bash
git pull --ff-only
corepack pnpm install --frozen-lockfile
corepack pnpm run build
sudo systemctl restart morroblog
```

重启后再次调用 `/healthz`。升级前请备份 MySQL 数据库；不要通过删除数据库目录来“重置”部署。
