# ☁️ Cloudflare Pages 部署指南

## 部署选项

### 选项 A：Node.js 后端 + Cloudflare Pages 前端（推荐）

由于 Cloudflare Workers 环境对 Sharp 图片处理库和文件系统支持有限，**推荐**的架构是：

1. **前端**：部署到 Cloudflare Pages（静态文件）
2. **后端**：部署到支持 Node.js 的平台（如 Render, Fly.io, Railway 等）

### 选项 B：纯 Cloudflare Workers 版本（使用第三方图片 API）

如果必须全量使用 Cloudflare，可以使用 Cloudflare 的 Image Resizing 或第三方图片转换 API。

---

## 🚀 选项 A 部署步骤

### 1. 前端部署到 Cloudflare Pages

1. 将代码推送到 GitHub
2. 在 Cloudflare Pages 中连接仓库
3. 构建设置：
   - **构建命令**: 留空（纯静态）
   - **构建输出目录**: `public`
4. 在环境变量中添加：
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

### 2. 后端部署

将 `server.js` 部署到任何支持 Node.js 的平台：

**Render.com 部署示例：**
1. 连接 GitHub 仓库
2. Build Command: `npm install`
3. Start Command: `npm start`
4. 添加环境变量：
   - `STRIPE_PUBLIC_KEY`
   - `STRIPE_SECRET_KEY`
   - `CONVERSION_PRICE`

### 3. 更新前端 API 地址

修改 `public/index.html` 中的 API 调用地址：

```javascript
// 将所有 fetch 调用的地址改为你的后端地址
fetch('https://your-backend-url.com/api/create-payment-intent', ...)
fetch('https://your-backend-url.com/api/convert', ...)
```

---

## 🔑 Cloudflare 环境变量配置

在 Cloudflare Pages 控制台：

1. 进入你的项目 → **设置** → **环境变量**
2. 添加变量（生产环境）：

| 变量名 | 值 | 加密 |
|--------|-----|------|
| `STRIPE_PUBLIC_KEY` | `pk_test_...` 或 `pk_live_...` | ❌ |
| `STRIPE_SECRET_KEY` | `sk_test_...` 或 `sk_live_...` | ✅ |
| `CONVERSION_PRICE` | `99` | ❌ |

3. 点击 **保存并部署**

---

## ⚠️ 重要注意事项

### 1. Sharp 兼容性
Sharp 依赖原生二进制文件，在 Cloudflare Workers 环境中**无法直接使用**。

**替代方案：**
- 使用 Cloudflare Image Resizing API
- 使用第三方图片转换服务（如 Cloudinary, ImageKit）
- 将后端部署到 Node.js 平台

### 2. 文件上传限制
Cloudflare Pages Functions 有请求体大小限制（~10MB），与我们的配置一致。

### 3. CORS 配置
如果前后端在不同域名，需要在后端配置 CORS：
```javascript
// server.js 中已配置
app.use(cors({ origin: 'https://your-pages-domain.pages.dev' }));
```

---

## 📋 快速检查清单

部署前确认：

- [ ] Stripe 密钥已获取（pk_test 和 sk_test）
- [ ] 后端已部署并可访问
- [ ] 前端 API 地址已指向后端
- [ ] Cloudflare 环境变量已配置
- [ ] 已测试支付流程（使用测试卡）

---

## 🎯 推荐部署平台

| 平台 | 适合 | 免费额度 |
|------|------|----------|
| **Render** | 后端 Node.js | 有免费套餐 |
| **Railway** | 后端 Node.js | 每月 $5 免费额度 |
| **Fly.io** | 后端 Node.js | 免费额度有限 |
| **Cloudflare Pages** | 前端静态文件 | 无限免费 |
