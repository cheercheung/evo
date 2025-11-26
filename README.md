# Evolink Image Generation Tool

基于 Next.js 的 AI 图片生成工具，支持多任务并行处理。

## ✨ 功能特性

- 🎨 **极简黑白设计** - 纯黑白配色，现代简洁
- 🚀 **多任务并行** - 同时运行多个生成任务，互不影响
- 📤 **拖拽上传** - 支持拖拽和点击上传参考图片
- 🔄 **自动查询** - 自动轮询任务状态，实时显示进度
- 📥 **一键下载** - 批量下载所有生成的图片
- 🎯 **横向选择** - 所有参数使用按钮选择，直观易用
- 🔐 **环境变量** - API Key 安全存储在 .env.local
- 📱 **响应式设计** - 完美适配各种屏幕尺寸
- 💾 **自动保存** - 图片自动下载到本地
- ⚡ **TypeScript** - 完整的类型支持

## 📁 项目结构

```
evo/
├── app/                                    # Next.js App Router
│   ├── image-tool/                        # 图片工具页面
│   │   └── page.tsx                       # 主页面（多任务管理）
│   ├── layout.tsx                         # 根布局
│   ├── page.tsx                           # 首页（重定向）
│   └── globals.css                        # 全局样式（黑白主题）
├── components/                            # React 组件
│   ├── SimpleImageGenerationForm.tsx      # 简洁图片生成表单
│   ├── AutoTaskQuery.tsx                  # 自动任务查询组件
│   ├── ApiKeyInput.tsx                    # API Key 输入组件
│   ├── ImageGenerationForm.tsx            # 完整图片生成表单
│   ├── ImageUploader.tsx                  # 图片上传组件
│   └── TaskQueryForm.tsx                  # 任务查询表单
├── lib/                                   # 工具库
│   └── evolink-client.ts                  # Evolink API 客户端
├── types/                                 # TypeScript 类型定义
│   └── evolink.ts                         # Evolink API 类型
├── .env.example                           # 环境变量示例
├── .env.local                             # 环境变量（本地，不提交）
├── .node-version                          # Node.js 版本指定
├── Dockerfile                             # Docker 部署配置
├── doc.md                                 # 图片生成 API 文档
├── query.md                               # 任务查询 API 文档
├── fileupload.md                          # 文件上传 API 文档
└── package.json
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/evo.git
cd evo
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的 API Key：

```bash
NEXT_PUBLIC_EVOLINK_API_KEY=sk-your-api-key-here
```

> 💡 从 [Evolink 控制台](https://evolink.ai/dashboard/keys) 获取你的 API Key

> 🔒 `.env.local` 文件已在 `.gitignore` 中，不会被提交到 Git

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 访问应用

打开浏览器访问 [http://localhost:3000/image-tool](http://localhost:3000/image-tool)

## 📖 使用说明

### 1️⃣ 选择参数

- **模型**: 点击选择 `nano-banana-2-lite` 或 `gemini-3-pro-image-preview`
- **尺寸**: 点击选择图片比例（auto, 1:1, 16:9, 4:3 等 11 种）
- **质量**: 点击选择 1K / 2K / 4K

### 2️⃣ 输入提示词

在文本框中描述你想生成的图片，例如：
```
一只可爱的橘猫坐在窗台上，阳光洒在它身上，温暖的午后氛围
```

### 3️⃣ 上传参考图片（可选）

- **拖拽上传**: 直接拖拽图片到虚线框内
- **点击上传**: 点击虚线框选择本地图片
- 支持多张图片，最多 10 张
- 支持格式：JPEG, PNG, GIF, WebP

### 4️⃣ 生成图片

点击"生成图片"按钮，任务会自动添加到任务列表并开始运行。

### 5️⃣ 查看结果

- ✅ 任务自动查询，每 3 秒更新一次状态
- ✅ 完成后自动显示生成的图片
- ✅ 可以单张下载或批量下载

### 6️⃣ 多任务并行

- 可以连续点击多次"生成图片"
- 所有任务同时在后台运行
- 每个任务独立显示状态和结果
- 点击"一键下载全部"批量保存所有图片

### 7️⃣ 任务管理

- **移除单个任务**: 点击任务卡片右上角的"移除"按钮
- **清空全部任务**: 点击任务列表标题旁的"清空全部"按钮

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

