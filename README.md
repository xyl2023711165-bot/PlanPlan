# PlanPlan - AI 学习计划助手

智能学习计划生成工具，帮助你将学习目标拆解为详细的每日任务。

## 功能

- 添加学习目标（支持设置截止日期和目标描述）
- AI 自动生成详细的每日学习计划
- 任务打卡追踪
- 项目进度可视化
- 多 AI 服务商支持

## 支持的 AI 服务商

- 硅基流动 (SiliconFlow)
- OpenAI
- DeepSeek
- Anthropic (Claude)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 首次使用

1. 打开 http://localhost:3000
2. 首次打开会跳转到设置页面
3. 选择 AI 服务商，输入你的 API Key
4. 点击"测试连接"验证配置
5. 点击"开始使用"即可

## 配置说明

首次使用时需要在设置页面配置以下内容：

| 配置项 | 说明 |
|--------|------|
| AI 服务商 | 选择你要使用的 AI 服务商 |
| API Key | 在对应服务商官网申请 |
| 模型 | 选择要使用的 AI 模型 |
| 自定义端点 | 可选，用于代理或特殊配置 |

### 获取 API Key

- **硅基流动**: https://siliconflow.cn
- **OpenAI**: https://platform.openai.com
- **DeepSeek**: https://platform.deepseek.com
- **Anthropic**: https://www.anthropic.com

## 项目结构

```
PlanPlan/
├── app/
│   ├── api/plan/       # AI API 路由
│   ├── settings/       # 设置页面
│   ├── page.tsx        # 主页面
│   └── layout.tsx      # 布局
├── components/         # React 组件
├── services/
│   ├── ai.ts           # AI 服务调用
│   └── storage.ts      # 本地存储
└── types/              # TypeScript 类型
```

## 技术栈

- Next.js 16
- React
- TypeScript
- dnd-kit (拖拽排序)
- 硅基流动 API / OpenAI API

## 部署

### Vercel（推荐）

1. 将项目推送到 GitHub
2. 在 Vercel 导入项目
3. 添加环境变量（或在应用内配置）
4. 部署

### 本地运行

```bash
npm run build
npm start
```

## 注意事项

- 所有数据存储在浏览器本地 localStorage 中
- API 配置仅保存在用户本地，不会上传到任何服务器
- 请妥善保管你的 API Key~
