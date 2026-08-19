# fnOS Docker Compose 部署与验证

本项目通过 `docker-compose.yml` 启动 `mysql`、一次性 `migrate` 与常驻 `app` 三个服务。`migrate` 会在 MySQL 健康检查通过后执行 Drizzle 迁移，成功退出后 `app` 才启动编译后的 Express 服务。MySQL 不映射 fnOS 主机端口；访客仅通过 `http://<fnOS-IP>:3000` 访问博客。

## 1. 在 fnOS 本机创建 `.env`

请在包含 `docker-compose.yml` 的目录创建 `.env`，该文件仅保留在 fnOS，不提交 Git。以下变量为 Compose 启动必填项。

```env
MYSQL_ROOT_PASSWORD=替换为独立高强度根密码
MYSQL_DATABASE=morroblog
MYSQL_USER=morroblog
MYSQL_PASSWORD=替换为独立高强度应用数据库密码
JWT_SECRET=替换为至少32字符的随机密钥
```

邮件注册与管理员初始化可按需补充：`SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`SMTP_FROM`、`INITIAL_ADMIN_EMAIL`。`INITIAL_ADMIN_EMAIL` 必须是用于注册的收件邮箱，不能填写 SMTP 发件账号。

内置存储相关变量 `BUILT_IN_FORGE_API_URL`、`BUILT_IN_FORGE_API_KEY`、`VITE_FRONTEND_FORGE_API_URL`、`VITE_FRONTEND_FORGE_API_KEY` 需要由实际自托管运行环境提供；缺失时，依赖该服务的图片上传会明确失败，博客阅读不受影响。

## 2. 构建并启动

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 app
```

预期状态为 `mysql` 先变为 `healthy`，`migrate` 成功退出，随后 `app` 启动。若 `migrate` 失败，请先读取 `docker compose logs migrate`；不要绕过失败直接启动 `app`。应用内置的 `/healthz` 仅返回 `ok`，不读取账户或文章数据；Docker 健康检查每 30 秒调用它。

## 3. 验证与维护

```bash
curl -fsS http://127.0.0.1:3000/healthz
docker compose logs -f app
docker compose exec mysql mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"
```

升级时先在 Git 拉取已验证版本，再执行：

```bash
docker compose up -d --build
```

不要执行 `docker compose down -v`，除非已完成 MySQL 数据备份且明确要清除所有博客数据。
