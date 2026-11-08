// Vercel Node.js function. Configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
// in Vercel Project Settings -> Environment Variables, then redeploy.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(503).json({ok:false,error:'Telegram is not configured'});
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ok:false,error:'Invalid JSON'}); } }
  if (!body || typeof body !== 'object') return res.status(400).json({ok:false,error:'Invalid request'});
  if (body.website) return res.status(200).json({ok:true}); // honeypot
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  if (name.length < 2 || name.length > 100 || !/^[+0-9() .-]{9,24}$/.test(phone)) {
    return res.status(400).json({ok:false,error:'Invalid name or phone'});
  }
  const model = String(body.model || 'Nasal Soother — 469 грн');
  const page = String(body.page || 'https://coroshop.vercel.app/');
  const message = ['🛒 Нове замовлення — Coroshop', `Товар: ${model}`, 'Ціна: 469 грн', `Ім’я: ${name}`, `Телефон: ${phone}`, `Сайт: ${page}`, 'Доставка: Нова пошта / Укрпошта, оплата при отриманні'].join('\n');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    try {
      response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:chatId,text:message}),signal:controller.signal
      });
    } finally { clearTimeout(timeout); }
    const data = await response.json();
    if (!response.ok || data.ok !== true) {
      console.error('Telegram sendMessage failed:', response.status, data.description);
      return res.status(502).json({ok:false,error:'Telegram delivery failed'});
    }
    return res.status(200).json({ok:true});
  } catch (error) {
    console.error('Telegram request error:', error.message);
    return res.status(502).json({ok:false,error:'Telegram temporarily unavailable'});
  }
};
