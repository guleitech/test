/**
 * Cloudflare Worker - Stripe 支付服务
 * 功能：
 * 1. 创建 Checkout Session（用于支付）
 * 2. 验证支付状态（用于确认支付）
 */

// 获取环境变量
async function getEnv() {
  // STRIPE_SECRET_KEY 必须在 Cloudflare Worker 环境变量中配置
  // 在 Cloudflare Dashboard -> Workers -> 设置 -> 环境变量 中添加
  const secretKey = STRIPE_SECRET_KEY_HERE;
  
  if (!secretKey || secretKey === 'STRIPE_SECRET_KEY_HERE') {
    throw new Error('请在 Cloudflare Worker 环境变量中配置 STRIPE_SECRET_KEY');
  }
  
  return {
    STRIPE_SECRET_KEY: secretKey,
    CONVERSION_PRICE: 99 // 99 cents = $0.99
  };
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // 处理 CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    // 路由分发
    if (path === '/api/create-checkout-session' && request.method === 'POST') {
      return await createCheckoutSession(request, corsHeaders);
    }
    
    if (path === '/api/verify-payment' && request.method === 'GET') {
      return await verifyPayment(request, corsHeaders);
    }
    
    // 默认返回 API 状态
    return new Response(JSON.stringify({ 
      status: 'ok',
      endpoints: [
        'POST /api/create-checkout-session - 创建支付会话',
        'GET /api/verify-payment?session_id=xxx - 验证支付状态'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 创建 Stripe Checkout Session
 */
async function createCheckoutSession(request, corsHeaders) {
  const env = await getEnv();
  
  try {
    const { format } = await request.json();
    const targetFormat = format || 'webp';
    
    // 创建 Stripe Checkout Session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': '图片格式转换',
        'line_items[0][price_data][product_data][description]': `转换为 ${targetFormat} 格式`,
        'line_items[0][price_data][unit_amount]': String(env.CONVERSION_PRICE),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `https://test-ayz.pages.dev/?session_id={CHECKOUT_SESSION_ID}&format=${encodeURIComponent(targetFormat)}`,
        'cancel_url': 'https://test-ayz.pages.dev/?pay_canceled=1',
      })
    });

    const session = await stripeResponse.json();
    
    if (session.error) {
      throw new Error(session.error.message);
    }

    // 返回支付 URL 和 session_id
    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 验证 Stripe 支付状态
 */
async function verifyPayment(request, corsHeaders) {
  const env = await getEnv();
  
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  
  if (!sessionId) {
    return new Response(JSON.stringify({ 
      error: '缺少 session_id 参数' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // 查询 Stripe Session 状态
    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    
    const session = await stripeResponse.json();
    
    if (session.error) {
      throw new Error(session.error.message);
    }
    
    // 返回支付状态
    return new Response(JSON.stringify({
      paid: session.payment_status === 'paid',
      status: session.status,
      amount: session.amount_total,
      currency: session.currency
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
