/**
 * Cloudflare Worker - 创建 Stripe Checkout Session
 * 用途：接收前端请求，创建 Stripe Checkout Session，返回支付 URL
 */

// Stripe Secret Key（在 Cloudflare Worker 环境变量中配置）
const STRIPE_SECRET_KEY = STRIPE_SECRET_KEY_HERE;
const CONVERSION_PRICE = 99; // 99 cents = $0.99

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // 处理 CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  // 只接受 POST 请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const { format } = await request.json()
    
    // 创建 Stripe Checkout Session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': '图片格式转换',
        'line_items[0][price_data][product_data][description]': `转换为 ${format || 'webp'} 格式`,
        'line_items[0][price_data][unit_amount]': String(CONVERSION_PRICE),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `https://test-ayz.pages.dev/?pay_success=1&format=${encodeURIComponent(format || 'webp')}`,
        'cancel_url': 'https://test-ayz.pages.dev/?pay_canceled=1',
      })
    })

    const session = await stripeResponse.json()
    
    if (session.error) {
      throw new Error(session.error.message)
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
