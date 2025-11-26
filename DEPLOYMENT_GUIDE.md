# 部署指南

## 问题说明

Next.js 16.0.4 需要 Node.js >= 20.9.0，但部署平台使用的是 Node.js 18.20.5。

## 解决方案

### 方案 1：使用自定义 Dockerfile（推荐）

项目已包含 `Dockerfile`，使用 Node.js 20。

**部署步骤：**

1. 确保部署平台支持自定义 Dockerfile
2. 推送代码到 Git 仓库
3. 部署平台会自动检测并使用 Dockerfile
4. 设置环境变量：`NEXT_PUBLIC_EVOLINK_API_KEY=你的API密钥`

### 方案 2：降级 Next.js（如果平台不支持自定义 Dockerfile）

运行以下命令降级到 Next.js 15：

```bash
npm install next@15 react@18 react-dom@18 @types/react@18 @types/react-dom@18
```

然后重新部署。

### 方案 3：配置平台使用 Node.js 20

如果你使用的是：

**Vercel:**
- 在项目设置中选择 Node.js 20.x

**Zeabur:**
- 创建 `.node-version` 文件，内容为 `20`

**Railway:**
- 在设置中指定 Node.js 版本为 20

**Render:**
- 在环境变量中设置 `NODE_VERSION=20`

## 环境变量

部署时需要设置以下环境变量：

```
NEXT_PUBLIC_EVOLINK_API_KEY=sk-你的API密钥
```

## 本地测试 Docker

```bash
# 构建镜像
docker build -t evolink-image-tool .

# 运行容器
docker run -p 3000:3000 -e NEXT_PUBLIC_EVOLINK_API_KEY=你的API密钥 evolink-image-tool
```

访问 http://localhost:3000

