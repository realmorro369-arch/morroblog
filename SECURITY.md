# 安全政策

## 报告安全漏洞

我们非常重视安全问题。如果你发现了安全漏洞，请**不要**通过公开 Issue 报告，而是通过以下方式私密报告：

### 报告方式

1. **发送电子邮件**到 `security@manusblog.dev`（如果可用）
2. **使用 GitHub 的私密安全通知**：
   - 访问 [Security Advisories](https://github.com/realmorro369-arch/morroblog/security/advisories)
   - 点击 "Report a vulnerability"
   - 填写详细信息

### 报告内容

请在报告中包含以下信息：

- **漏洞描述**：清晰描述安全问题
- **受影响版本**：哪些版本受到影响
- **复现步骤**：如何复现这个问题
- **潜在影响**：这个漏洞可能造成什么后果
- **建议修复**：如果有的话

### 响应时间

我们承诺：

- **24 小时内**：确认收到报告
- **7 天内**：提供初步评估
- **30 天内**：发布补丁或安全更新

## 安全最佳实践

### 依赖管理

- 定期更新依赖：`pnpm update`
- 检查已知漏洞：`pnpm audit`
- 只使用来自可信来源的包

### 环境变量

- **不要**将 `.env` 文件提交到版本控制
- 使用 `.env.example` 作为模板
- 在生产环境中使用强密钥
- 定期轮换敏感凭证

### 数据库安全

- 使用强密码
- 限制数据库访问权限
- 定期备份数据
- 使用 SSL/TLS 加密连接
- 定期审计数据库日志

### 认证与授权

- 使用邮箱验证码验证、bcrypt 密码哈希与 httpOnly JWT Cookie 会话进行身份验证；密码重设会失效旧本地会话
- 验证码只保存哈希摘要，10 分钟失效，并限制发送频率与失败尝试次数
- 实现适当的权限检查
- 定期更新会话签名密钥与 SMTP 授权码

### API 安全

- 验证所有输入
- 使用 HTTPS 进行所有通信
- 实现速率限制
- 使用 CORS 限制跨域请求
- 记录和监控 API 活动

### 前端安全

- 避免存储敏感信息在本地存储
- 使用 Content Security Policy (CSP)
- 防止 XSS 攻击（React 默认转义）
- 防止 CSRF 攻击（使用 CSRF token）

### 代码审查

- 所有代码更改都需要审查
- 至少两人审查敏感更改
- 使用自动化工具检查安全问题
- 定期进行安全审计

## 已知安全问题

### 当前版本（v1.3.0）

暂无已知安全问题。

### 历史版本

暂无历史安全问题记录。

## 安全更新

当发现安全漏洞时，我们将：

1. 立即开始修复工作
2. 发布安全补丁版本
3. 通知所有受影响的用户
4. 在公开渠道发布安全公告

## 依赖安全

本项目使用以下安全工具：

- **npm audit**：检查已知漏洞
- **Dependabot**：自动依赖更新
- **OWASP Dependency-Check**：依赖安全扫描

## 部署安全

### Docker 安全

- 使用官方基础镜像
- 定期更新镜像
- 不要以 root 用户运行容器
- 使用只读文件系统
- 限制容器资源

### fnos 部署

- 使用防火墙限制访问
- 启用 SSL/TLS
- 定期备份数据
- 监控系统日志
- 及时应用安全补丁

## 安全检查清单

在部署前，请确保：

- [ ] 所有依赖都是最新的
- [ ] 没有已知的安全漏洞
- [ ] 环境变量已正确配置
- [ ] 数据库密码是强密码
- [ ] 启用了 HTTPS
- [ ] 实现了身份验证和授权
- [ ] 进行了代码审查
- [ ] 运行了安全测试
- [ ] 备份系统已配置
- [ ] 监控和日志已启用

## 安全资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js 安全最佳实践](https://nodejs.org/en/docs/guides/security/)
- [React 安全](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [Express 安全](https://expressjs.com/en/advanced/best-practice-security.html)

## 联系方式

- **安全问题**：security@manusblog.dev
- **一般问题**：support@manusblog.dev
- **GitHub Issues**：[报告非安全问题](https://github.com/realmorro369-arch/morroblog/issues)

---

感谢你帮助我们保持项目的安全！
