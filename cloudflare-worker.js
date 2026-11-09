// Cloudflare Worker. Проксіює заявку на центральний приймач замовлень.
// Токен Telegram-бота тут не потрібен — він живе лише на сервері приймача.
const RECEIVER = 'https://smartdaily-orders.spru.run/order';

function respond(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return respond({ok: true}, 204);
    if (request.method !== 'POST') return respond({ok: false, error: 'Method not allowed'}, 405);

    let body = {};
    try { body = await request.json(); } catch { return respond({ok: false, error: 'Invalid JSON'}, 400); }
    if (body.website) return respond({ok: true}, 200);

    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    if (name.length < 2 || !/^[+0-9() .-]{9,24}$/.test(phone)) {
      return respond({ok: false, error: 'Invalid name or phone'}, 400);
    }

    const payload = {
      name, phone,
      model: String(body.model || 'Nasal Soother — 469 грн'),
      price: Number(body.price || 469),
      qty: Number(body.qty || body.quantity || 1),
      supplier: String(body.supplier || 'Coroshop'),
      page: String(body.page || 'https://coroshop.vercel.app/'),
    };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      let response;
      try {
        response = await fetch(RECEIVER, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally { clearTimeout(timer); }
      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}
      if (!response.ok || data.ok === false) {
        console.error('Receiver failed:', response.status, text.slice(0, 300));
        return respond({ok: false, error: data.error || 'Receiver unavailable'}, 502);
      }
      return respond({ok: true, id: data.id}, 200);
    } catch (error) {
      console.error('Receiver request error:', error.message);
      return respond({ok: false, error: 'Receiver temporarily unavailable'}, 502);
    }
  },
};
