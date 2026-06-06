# ☁️ Cloudflare Pages 前端部署指南

## 前端部署到 Cloudflare Pages

1. 将代码推送到 GitHub
2. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → 创建项目
3. 连接你的 GitHub 仓库
4. 构建设置：
   - **构建命令**: 留空
   - **构建输出目录**: `.`（根目录）
5. 点击 **保存并部署**

---

## ⚠️ 重要：后端需要单独部署

Cloudflare Pages **只能托管静态文件**，无法运行 Node.js 后端。

**你的架构应该是：**
```
前端: https://test-ayz.pages.dev/  ← 已在 Cloudflare Pages
后端: https://xxx.onrender.com     ← 需要部署到 Render.com
```

---

## 🚀 后端部署到 Render.com（免费）

### 步骤 1：创建 Web Service

1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. 点击 **New +** → **Web Service**
3. 连接你的 GitHub 仓库
4. 配置服务：

| 设置项 | 值 |
|--------|-----|
| **Name** | `image-converter-api` |
| **Region** | 选择离你最近的 |
| **Branch** | `main` |
| **Root Directory** | 留空 |
| **Runtime** | `Node` |
| **Build Command** | `pnpm install` |
| **Start Command** | `node server.js` |
| **Plan** | `Free` |

### 步骤 2：添加环境变量

在 **Environment** 部分添加：

| 变量名 | 值 |
|--------|-----|
| `STRIPE_PUBLIC_KEY` | `pk_test_...`（你的 Stripe 公钥） |
| `STRIPE_SECRET_KEY` | `sk_test_...`（你的 Stripe 私钥） |
| `CONVERSION_PRICE` | `99` |

### 步骤 3：部署

1. 点击 **Create Web Service**
2. 等待构建完成（约 2-3 分钟）
3. 部署成功后，你会得到一个 URL 如：`https://image-converter-api.onrender.com`

### 步骤 4：验证后端

访问：`https://image-converter-api.onrender.com/api/config`

应该返回：
```json
{"publicKey":"pk_test_..."}
```

---

## 📝 更新前端代码

后端部署成功后，修改 `index.html` 中的 API 地址。

找到这行（约第 208 行）：
```javascript
const response = await fetch('/api/config');
```

改为（替换为你的 Render URL）：
```javascript
const response = await fetch('https://image-converter-api.onrender.com/api/config');
```

同样修改其他 API 调用：
- `/api/create-payment-intent` → `https://image-converter-api.onrender.com/api/create-payment-intent`
- `/api/convert` → `https://image-converter-api.onrender.com/api/convert`

---

## 🔄 完整流程

1. GitHub 推送代码 → Cloudflare Pages 自动部署前端
2. GitHub 推送代码 → Render 自动部署后端
3. 前端调用后端 API → 用户完成支付 → 图片转换

---

## 💡 提示

- Stripe 测试密钥不会产生真实费用
- Render 免费版服务在不活动 15 分钟后会休眠，首次访问可能需要等待几秒唤醒
