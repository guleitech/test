# 🖼️ 图片格式转换器 (带 Stripe 支付)

一个简单的图片格式转换 Web 应用，集成 Stripe 支付系统。支持部署到 Cloudflare Pages/Functions 和 GitHub。

## ✨ 功能特点

- 📤 拖拽或点击上传图片
- 🔄 支持 JPG, PNG, WEBP, GIF 格式互转
- 💳 Stripe 安全支付集成
- 📥 一键下载转换后的图片
- ⚡ 使用 Sharp 高性能图片处理
- 🚀 支持 Cloudflare / GitHub / Vercel 部署

## 🔑 Stripe 密钥配置

**⚠️ 重要：永远不要把真实密钥提交到 GitHub！**

### 方式一：本地开发
复制 `.env.example` 为 `.env` 并填入你的密钥：
```env
STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### 方式二：Cloudflare Pages 部署
在 Cloudflare 控制台设置环境变量：
1. 进入你的 Pages 项目
2. 点击 **设置** → **环境变量**
3. 添加以下变量：
   - `STRIPE_PUBLIC_KEY` = `pk_test_...` 或 `pk_live_...`
   - `STRIPE_SECRET_KEY` = `sk_test_...` 或 `sk_live_...`
   - `CONVERSION_PRICE` = `99` (价格，单位：分)
4. 勾选 **加密** 保护敏感变量
5. 重新部署生效

### 方式三：GitHub / Vercel 部署
在项目的 Settings → Secrets and variables 中添加：
- Repository Secrets: `STRIPE_SECRET_KEY`
- Repository Variables: `STRIPE_PUBLIC_KEY`, `CONVERSION_PRICE`

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置 .env 文件（填入你的 Stripe 密钥）

# 3. 启动服务
npm start
```

访问 http://localhost:3000

### Cloudflare Pages 部署

1. 将代码推送到 GitHub
2. 在 Cloudflare Pages 中连接你的仓库
3. 构建设置：
   - 构建命令：`npm install`
   - 构建输出目录：`public`
   - 函数目录：`functions` (如需使用 Cloudflare Functions)
4. 在环境变量中添加 Stripe 密钥
5. 部署完成！

## 📁 项目结构

```
image-converter/
├── server.js              # Express 后端（本地/Node.js 环境使用）
├── package.json           # 项目依赖配置
├── .env                   # 本地环境变量（不提交）
├── .env.example           # 环境变量模板
├── public/
│   └── index.html         # 前端页面
├── uploads/               # 上传临时目录
├── outputs/               # 转换输出目录
└── README.md              # 本文件
```

## 🔧 技术栈

- **后端**: Node.js + Express
- **支付**: Stripe API
- **图片处理**: Sharp
- **文件上传**: Multer
- **前端**: 原生 HTML/CSS/JS

## 💡 使用流程

1. 上传图片
2. 选择目标格式
3. 填写支付信息并支付
4. 下载转换后的图片

## 🧪 Stripe 测试卡

测试支付时可使用：
- **卡号**: `4242 4242 4242 4242`
- **有效期**: 任意未来日期 (如 `12/34`)
- **CVC**: 任意 3 位数字 (如 `123`)

## ⚠️ 生产环境注意事项

1. 使用 Stripe 正式密钥 (`pk_live_` / `sk_live_`)
2. 配置 HTTPS (Cloudflare 自动提供)
3. 在 Cloudflare 中启用速率限制防止滥用
4. 配置 Stripe Webhook 验证支付状态
5. 添加用户身份验证（如需要）

## 📝 自定义配置

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `STRIPE_PUBLIC_KEY` | Stripe 发布密钥 | - |
| `STRIPE_SECRET_KEY` | Stripe 密钥 | - |
| `CONVERSION_PRICE` | 每次转换价格（单位：分） | `99` |
| `PORT` | 服务端口（本地） | `3000` |
| `NODE_ENV` | 环境模式 | `development` |

## 🔗 获取 Stripe 密钥

1. 注册/登录 [Stripe 账户](https://dashboard.stripe.com/)
2. 进入 **开发者** → **API 密钥**
3. 复制发布密钥 (pk_test_...) 和密钥 (sk_test_...)
