#!/bin/bash

# MorroBlog 每日优化脚本
# 用于自动化执行每日优化任务

set -e

PROJECT_DIR="/home/ubuntu/MorroBlog"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
LOG_FILE="$PROJECT_DIR/logs/daily-optimization.log"

# 创建日志目录
mkdir -p "$PROJECT_DIR/logs"

echo "[$TIMESTAMP] 开始 MorroBlog 每日优化任务" >> "$LOG_FILE"

# 1. 检查项目状态
echo "[$TIMESTAMP] 检查项目状态..." >> "$LOG_FILE"
cd "$PROJECT_DIR"
git status >> "$LOG_FILE" 2>&1 || true

# 2. 安装依赖
echo "[$TIMESTAMP] 安装依赖..." >> "$LOG_FILE"
pnpm install >> "$LOG_FILE" 2>&1 || true

# 3. 类型检查
echo "[$TIMESTAMP] 执行 TypeScript 类型检查..." >> "$LOG_FILE"
pnpm check >> "$LOG_FILE" 2>&1 || true

# 4. 运行测试
echo "[$TIMESTAMP] 运行单元测试..." >> "$LOG_FILE"
pnpm test >> "$LOG_FILE" 2>&1 || true

# 5. 构建项目
echo "[$TIMESTAMP] 构建项目..." >> "$LOG_FILE"
pnpm build >> "$LOG_FILE" 2>&1 || true

# 6. 记录完成
echo "[$TIMESTAMP] 每日优化任务完成" >> "$LOG_FILE"
echo "[$TIMESTAMP] ========================================" >> "$LOG_FILE"

# 显示日志摘要
echo "✅ 每日优化任务完成"
echo "📝 日志文件: $LOG_FILE"
tail -20 "$LOG_FILE"
