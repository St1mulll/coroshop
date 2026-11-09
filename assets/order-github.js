(() => {
  'use strict';
  const form = document.getElementById('order-form');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const error = document.getElementById('form-error');
  if (!button || !error) return;
  const setError = message => { error.textContent = message; error.style.display = message ? 'block' : ''; };
  button.disabled = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const name = form.elements.namedItem('name')?.value.trim() || '';
    const phone = form.elements.namedItem('phone')?.value.trim() || '';
    if (name.length < 2 || !/^[+0-9() .-]{9,24}$/.test(phone)) {
      setError('Перевірте ім’я та номер телефону.'); return;
    }
    const endpoint = String(window.ORDER_API_URL || '').trim();
    const fallback = String(window.ORDER_API_FALLBACK || '').trim();
    if (!/^https:\/\/[^\s]+$/.test(endpoint) && endpoint !== '/api/order') {
      setError('Надсилання замовлень ще не підключено. Зателефонуйте нам: +380 75 683 52 55.');
      return;
    }
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Надсилаємо замовлення…';
    setError('');
    const qty = Number(document.getElementById('qty-value')?.value || document.getElementById('quantity')?.value || form.elements.namedItem('quantity')?.value || 1);
    const payload = {
      name, phone,
      model: String(window.ORDER_PRODUCT || ''),
      price: Number(window.ORDER_PRICE || 0),
      qty,
      quantity: qty,
      supplier: String(window.ORDER_SUPPLIER || ''),
      page: String(window.ORDER_SITE || location.origin + location.pathname),
      website: form.elements.namedItem('website')?.value || ''
    };
    const jsonBody = () => ({
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000)
    });
    const formBody = () => {
      const fd = new FormData();
      fd.set('name', name); fd.set('phone', phone);
      fd.set('model', payload.model); fd.set('price', String(payload.price || ''));
      fd.set('qty', String(qty)); fd.set('quantity', String(qty));
      fd.set('supplier', payload.supplier); fd.set('page', payload.page);
      return {method: 'POST', body: fd, signal: AbortSignal.timeout(20000)};
    };
    const ok = async response => {
      if (!response || !response.ok) return false;
      try {
        const result = await response.json();
        return result && result.ok !== false;
      } catch (_) { return true; }
    };
    try {
      let delivered = false;
      // 1) основний канал — JSON, кілька спроб
      for (let attempt = 0; attempt < 3 && !delivered; attempt++) {
        let response = null;
        try { response = await fetch(endpoint, jsonBody()); } catch (_) { response = null; }
        if (await ok(response)) delivered = true;
        else await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
      }
      // 2) той самий приймач, але звичайною формою (обходить CORS/JSON-проблеми)
      if (!delivered) {
        try { const r = await fetch(endpoint, formBody()); if (await ok(r)) delivered = true; } catch (_) {}
      }
      // 3) резервний канал (форма сайту)
      if (!delivered && fallback) {
        try { const r = await fetch(fallback, formBody()); if (await ok(r)) delivered = true; } catch (_) {}
      }
      if (!delivered) throw new Error('Delivery failed');
      try { const pv = Number(window.ORDER_PRICE || 0); window.fbq?.('track', 'Lead', {currency: 'UAH', value: pv}); } catch (_) {}
      form.replaceChildren();
      const confirmation = document.createElement('div');
      confirmation.setAttribute('role', 'status');
      confirmation.className = 'order-success';
      const title = document.createElement('h3'); title.textContent = 'Дякуємо за ваше замовлення!';
      const detail = document.createElement('p'); detail.textContent = 'Ваше замовлення успішно прийнято. Найближчим часом з вами зв’яжеться наш менеджер для підтвердження деталей.';
      confirmation.append(title, detail);
      form.append(confirmation);
    } catch (err) {
      setError('Не вдалося надіслати замовлення. Перевірте з’єднання або зателефонуйте: +380 75 683 52 55.');
      button.disabled = false; button.innerHTML = original;
    }
  });
})();
