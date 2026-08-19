# 🤝 贡献指南

感谢你对 **MorroBlog** 的关注和支持！我们欢迎 Bug 报告、功能建议、代码改进和文档完善。请勿在 issue、提交记录、截图或测试夹具中提交真实凭据、用户数据或未取得授权的媒体素材。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交 Pull Request](#提交-pull-request)
- [报告 Bug](#报告-bug)
- [功能建议](#功能建议)
- [问题讨论](#问题讨论)

## 行为准则

### 我们的承诺

为了营造开放和欢迎的社区环境，我们承诺：

- 对所有人保持尊重和包容
- 接受建设性的批评
- 关注社区最佳利益
- 尊重他人的隐私和安全

### 不可接受的行为

以下行为在我们的社区中是不可接受的：

- 骚扰、威胁或辱骂他人
- 发布他人的私人信息
- 发表仇恨、歧视或骚扰言论
- 其他不专业或有害的行为

违反行为准则的贡献者可能被从项目中移除。

## 如何贡献

### 1. 报告 Bug

如果你发现了 Bug，请通过以下方式报告：

- 检查 [Issues](https://github.com/realmorro369-arch/morroblog/issues) 中是否已有相同报告
- 如果没有，请创建新的 Issue
- 提供尽可能详细的信息（见下方 Bug 报告模板）

### 2. 建议功能

我们欢迎新功能的建议：

- 检查 [Issues](https://github.com/realmorro369-arch/morroblog/issues) 中是否已有相同建议
- 创建新 Issue 并标记为 `enhancement`
- 详细描述你的想法和用例

### 3. 提交代码

- Fork 本仓库
- 创建特性分支
- 进行开发和测试
- 提交 Pull Request

### 4. 改进文档

- 修复文档中的错误或不清楚的地方
- 添加新的文档或示例
- 改进现有文档的可读性

## 开发流程

### 环境设置

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上 Fork 项目
   ```

2. **克隆到本地**
   ```bash
   git clone https://github.com/YOUR_USERNAME/morroblog.git
   cd morroblog
   ```

3. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/realmorro369-arch/morroblog.git
   ```

4. **安装依赖**
   ```bash
   pnpm install
   ```

5. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env，填入必要的配置；不要提交该文件
   ```

6. **启动开发服务器**
   ```bash
   pnpm dev
   ```

### 创建特性分支

```bash
# 更新本地 main 分支
git fetch upstream
git checkout main
git merge upstream/main

# 创建新的特性分支
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 代码重构
- `perf/` - 性能优化
- `test/` - 测试相关
- `chore/` - 其他杂项

## 代码规范

### TypeScript

- 所有代码必须使用 TypeScript
- 新增或修改的代码应避免不必要的 `any`，并为可复用边界提供清晰类型
- 为函数参数和返回值添加类型注解

```typescript
// ✅ 好的例子
function getUserById(id: number): Promise<User | null> {
  // ...
}

// ❌ 不好的例子
function getUserById(id: any): any {
  // ...
}
```

### React 组件

- 使用函数式组件和 Hooks
- 为组件添加 JSDoc 注释
- 使用 TypeScript 定义 Props 接口

```typescript
// ✅ 好的例子
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * 自定义按钮组件
 * @param props - 按钮属性
 */
export function CustomButton({ label, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### 样式

- 使用 Tailwind CSS 进行样式设计
- 避免内联样式
- 使用 CSS 类而不是样式对象

```typescript
// ✅ 好的例子
<div className="border border-white/20 rounded-xl p-4">
  {/* 内容 */}
</div>

// ❌ 不好的例子
<div style={{ backgroundColor: '#1e293b', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
  {/* 内容 */}
</div>
```

### 命名规范

- 文件名：使用 PascalCase（组件）或 camelCase（工具函数）
- 变量名：使用 camelCase
- 常量名：使用 UPPER_SNAKE_CASE
- 类名：使用 PascalCase

```typescript
// ✅ 好的例子
const MAX_RETRIES = 3;
const userName = "Morro";
function getUserData() {}
class UserService {}
export function CustomButton() {}

// ❌ 不好的例子
const max_retries = 3;
const UserName = "Morro";
function get_user_data() {}
class userservice {}
```

### 注释

- 为复杂逻辑添加注释
- 使用 JSDoc 为公共 API 添加文档
- 避免冗余注释

```typescript
// ✅ 好的例子
/**
 * 计算用户的订阅费用
 * @param userId - 用户 ID
 * @param months - 订阅月数
 * @returns 总费用
 */
function calculateSubscriptionFee(userId: string, months: number): number {
  // 获取用户的折扣率
  const discountRate = getUserDiscount(userId);
  // 计算基础费用
  const baseFee = months * MONTHLY_RATE;
  // 应用折扣
  return baseFee * (1 - discountRate);
}

// ❌ 不好的例子
// 这个函数计算费用
function calculateFee(id: string, m: number): number {
  const d = getDiscount(id); // 获取折扣
  const b = m * 100; // 基础费用
  return b * (1 - d); // 返回费用
}
```

### 错误处理

- 总是处理可能的错误
- 提供有意义的错误消息
- 使用 try-catch 或 Promise 的 .catch()

```typescript
// ✅ 好的例子
try {
  const data = await fetchUserData(userId);
  return data;
} catch (error) {
  console.error(`Failed to fetch user data for ID ${userId}:`, error);
  throw new Error("Unable to load user data. Please try again later.");
}

// ❌ 不好的例子
const data = await fetchUserData(userId);
return data;
```

### 测试

- 为新功能编写单元测试
- 测试覆盖率应 > 80%
- 使用 Vitest 编写测试

```typescript
// ✅ 好的例子
describe("calculateSubscriptionFee", () => {
  it("should calculate fee without discount", () => {
    const fee = calculateSubscriptionFee("user1", 12);
    expect(fee).toBe(1200);
  });

  it("should apply discount for eligible users", () => {
    const fee = calculateSubscriptionFee("vip-user", 12);
    expect(fee).toBeLessThan(1200);
  });
});
```

## 提交 Pull Request

### 准备工作

1. **更新本地分支**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **运行检查**
   ```bash
   pnpm check    # TypeScript 类型检查
   pnpm test     # 运行测试
  pnpm build    # 生产构建
   ```

3. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

### Commit 消息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**：
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码风格（不影响功能）
- `refactor` - 代码重构
- `perf` - 性能优化
- `test` - 测试相关
- `chore` - 构建、依赖等

**示例**：
```
feat(editor): add markdown preview mode

Add real-time markdown preview functionality to the editor component.
Users can now toggle between edit and preview modes.

Closes #123
```

### 推送并创建 PR

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request，填写以下信息：

- **标题**：简洁的功能描述
- **描述**：
  - 这个 PR 做了什么？
  - 为什么需要这个改动？
  - 如何测试这个改动？
  - 相关的 Issue 编号（如 `Closes #123`）

### PR 检查清单

在提交 PR 前，请确保：

- [ ] 代码遵循项目的代码规范
- [ ] 已运行 `pnpm check` 且无错误
- [ ] 已运行 `pnpm test` 且所有测试通过
- [ ] 已添加必要的测试
- [ ] 已更新相关文档
- [ ] Commit 消息遵循规范
- [ ] 没有合并冲突
- [ ] 没有调试代码（console.log 等）
- [ ] 不包含真实凭据、真实用户数据或未经授权的媒体
- [ ] 涉及权限、输入、上传或公开接口时，已补充对应 Vitest 回归测试

## 报告 Bug

### Bug 报告模板

```markdown
## 描述
清晰简洁地描述这个 Bug。

## 复现步骤
1. 打开...
2. 点击...
3. 看到错误...

## 预期行为
应该发生什么

## 实际行为
实际发生了什么

## 环境信息
- OS: [e.g. macOS 12.1]
- Browser: [e.g. Chrome 96.0]
- Node.js 版本: [e.g. 16.13.0]
- 项目版本: [e.g. v1.0.0]

## 附加信息
- 错误日志
- 截图
- 其他相关信息
```

## 功能建议

### 功能建议模板

```markdown
## 功能描述
清晰描述你想要的功能。

## 用例
为什么需要这个功能？什么场景下会用到？

## 可能的实现方式
（可选）你有什么想法吗？

## 附加信息
其他相关的想法或建议。
```

## 问题讨论

- 使用 [GitHub Discussions](https://github.com/realmorro369-arch/morroblog/discussions) 进行一般性讨论
- 使用 [GitHub Issues](https://github.com/realmorro369-arch/morroblog/issues) 报告 Bug 或建议功能

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

## 感谢

感谢你的贡献！你的努力帮助我们打造更好的项目。

---

有任何问题？欢迎在 [GitHub Discussions](https://github.com/realmorro369-arch/morroblog/discussions) 中提问！
