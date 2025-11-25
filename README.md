# Evolink Image Generation Tool

基于 Next.js 的 Nano Banana 2 图片生成和任务查询工具。

## 功能特性

- ✅ 完整的图片生成 API 参数支持（model, prompt, size, quality, image_urls, callback_url）
- ✅ 异步任务创建和查询
- ✅ 实时任务状态展示
- ✅ 生成图片预览
- ✅ 完整的 TypeScript 类型支持
- ✅ 专业的组件化架构
- ✅ Tailwind CSS 样式

## 项目结构

```
evo/
├── app/                      # Next.js App Router
│   ├── image-tool/          # 图片工具页面
│   │   └── page.tsx
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页（重定向）
│   └── globals.css          # 全局样式
├── components/              # React 组件
│   ├── ApiKeyInput.tsx      # API Key 输入组件
│   ├── ImageGenerationForm.tsx  # 图片生成表单
│   └── TaskQueryForm.tsx    # 任务查询表单
├── lib/                     # 工具库
│   └── evolink-client.ts    # Evolink API 客户端
├── types/                   # TypeScript 类型定义
│   └── evolink.ts           # Evolink API 类型
├── doc.md                   # 图片生成 API 文档
├── query.md                 # 任务查询 API 文档
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key（推荐）

在项目根目录创建 `.env.local` 文件（如果还没有的话），并添加你的 API Key：

```bash
# .env.local
NEXT_PUBLIC_EVOLINK_API_KEY=your-api-key-here
```

从 [Evolink API Key 管理页面](https://evolink.ai/dashboard/keys) 获取你的 API Key，替换 `your-api-key-here`。

> **注意**: `.env.local` 文件已经在 `.gitignore` 中，不会被提交到 Git，保证你的 API Key 安全。

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 使用说明

### 1. 配置 API Key

**方式一：使用环境变量（推荐）**

在 `.env.local` 文件中设置：
```bash
NEXT_PUBLIC_EVOLINK_API_KEY=your-api-key-here
```

**方式二：在页面中输入**

如果没有设置环境变量，可以在页面顶部的输入框中手动输入 API Key。

### 2. 创建图片生成任务

填写以下参数：

- **模型 (model)**: 选择 `nano-banana-2-lite` 或 `gemini-3-pro-image-preview`
- **尺寸 (size)**: 选择图片尺寸比例（auto, 1:1, 16:9 等）
- **质量 (quality)**: 选择图片质量（1K, 2K, 4K）
- **提示词 (prompt)**: 描述你想生成的图片（必填）
- **参考图片 URL (image_urls)**: 可选，最多 10 张参考图片
- **回调地址 (callback_url)**: 可选，任务完成后的 HTTPS 回调地址

点击"创建生成任务"按钮，系统会返回一个任务 ID。

### 3. 查询任务状态

使用返回的任务 ID（或手动输入），点击"查询任务"按钮查看：

- 任务状态（pending, processing, completed, failed）
- 任务进度（0-100%）
- 生成的图片（完成后）
- 完整的 JSON 响应

## API 文档

### 图片生成 API

- **端点**: `POST /v1/images/generations`
- **文档**: 见 `doc.md`

### 任务查询 API

- **端点**: `GET /v1/tasks/{task_id}`
- **文档**: 见 `query.md`

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **API**: Evolink Image Generation API

## 注意事项

1. **API Key 安全**: 请勿在公开代码中暴露你的 API Key
2. **CORS**: 如果遇到 CORS 问题，可以通过 Next.js API Routes 创建代理
3. **图片链接有效期**: 生成的图片链接有效期为 24 小时，请及时保存
4. **4K 质量**: 选择 4K 质量会产生额外费用

## 构建生产版本

```bash
npm run build
npm start
```

## License

ISC

