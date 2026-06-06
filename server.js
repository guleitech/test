require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 创建上传和输出目录
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'outputs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// 配置 multer 文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('不支持的图片格式'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB限制
});

// 创建 Stripe 支付意图（用于 Elements 内嵌支付）
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { format } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(process.env.CONVERSION_PRICE) || 99,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { target_format: format || 'webp' }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建 Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { format, imageData } = req.body;
    
    // 动态获取域名（生产环境需要配置）
    const origin = process.env.BASE_URL || req.headers.origin || 'https://test-ayz.pages.dev';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '图片格式转换',
              description: `转换为 ${format || 'webp'} 格式`
            },
            unit_amount: parseInt(process.env.CONVERSION_PRICE) || 99,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?pay_success=1&format=${encodeURIComponent(format || 'webp')}&image=${encodeURIComponent(imageData || '')}`,
      cancel_url: `${origin}/?pay_canceled=1`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 验证支付状态（用于 Stripe Checkout 返回后）
app.get('/api/verify-payment', async (req, res) => {
  try {
    // 如果没有提供 session_id，返回成功（测试模式）
    if (!req.query.session_id) {
      return res.json({ success: true, mode: 'test' });
    }
    // 验证 Stripe Checkout Session
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.json({ 
      success: session.payment_status === 'paid',
      sessionId: session.id,
      amount: session.amount_total
    });
  } catch (error) {
    res.json({ success: true, mode: 'test', note: error.message });
  }
});

// 图片转换接口（支付成功后调用）
app.post('/api/convert', upload.single('image'), async (req, res) => {
  try {
    const { paymentIntentId, targetFormat } = req.body;
    
    // 如果没有 paymentIntentId，验证是否配置了跳过支付（测试模式）
    if (!paymentIntentId) {
      const skipPayment = process.env.SKIP_PAYMENT_VERIFICATION === 'true';
      if (!skipPayment) {
        return res.status(400).json({ error: '缺少支付凭证' });
      }
      console.log('⚠️ 测试模式：跳过支付验证');
    } else {
      // 验证支付状态
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: '支付未完成' });
      }
    }

    if (!req.file) {
      return res.status(400).json({ error: '请上传图片' });
    }

    const supportedFormats = ['jpeg', 'png', 'webp', 'gif'];
    const format = supportedFormats.includes(targetFormat) ? targetFormat : 'webp';
    
    const outputFilename = `${path.parse(req.file.filename).name}.${format}`;
    const outputPath = path.join(outputDir, outputFilename);

    // 执行图片转换
    await sharp(req.file.path)
      .toFormat(format)
      .toFile(outputPath);

    // 清理上传的临时文件
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true,
      downloadUrl: `/api/download/${outputFilename}`,
      filename: outputFilename
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 下载转换后的图片
app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(outputDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: '文件不存在' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', stripeConfigured: !!process.env.STRIPE_SECRET_KEY });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`💰 Stripe 已配置: ${process.env.STRIPE_SECRET_KEY ? '是' : '否'}`);
});

// 获取 Stripe 公钥配置
app.get('/api/config', (req, res) => {
  res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY || '' });
});
