// Vercel-функція: проксіює заявку на центральний приймач замовлень.
// Токен Telegram-бота тут не потрібен — він живе лише на сервері приймача.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ok: false, error: 'Method not allowed'});
  }
  const target = process.env.ORDER_RECEIVER_URL || 'https://smartdaily-orders.spru.run/order';
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ok: false, error: 'Invalid JSON'}); }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ok: false, error: 'Invalid request'});
  if (body.website) return res.status(200).json({ok: true});
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  if (name.length < 2 || !/^[+0-9() .-]{9,24}$/.test(phone)) {
    return res.status(400).json({ok: false, error: 'Invalid name or phone'});
  }
  const payload = {
    name, phone,
    model: String(body.model || 'Nasal Soother — 469 грн'),
    price: Number(body.price || 469),
    qty: Number(body.qty || body.quantity || 1),
    supplier: String(body.supplier || 'Coroshop'),
    page: String(body.page || 'https://coroshop.vercel.app/')
  };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch(target, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } finally { clearTimeout(timer); }
    const text = await response.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}
    if (!response.ok || data.ok === false) {
      console.error('Receiver failed:', response.status, text.slice(0, 300));
      return res.status(502).json({ok: false, error: data.error || 'Receiver unavailable'});
    }
    return res.status(200).json({ok: true, id: data.id});
  } catch (error) {
    console.error('Receiver request error:', error.message);
    return res.status(502).json({ok: false, error: 'Receiver temporarily unavailable'});
  }
};
