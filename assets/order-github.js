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
    if (!/^https:\/\/[^\s]+$/.test(endpoint) && endpoint !== '/api/order') {
      setError('Надсилання замовлень ще не підключено. Зателефонуйте нам: +380 75 683 52 55.');
      return;
    }
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Надсилаємо замовлення…';
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name, phone,
          model: String(window.ORDER_PRODUCT || 'Nasal Soother — 469 грн'),
          page: String(window.ORDER_SITE || location.origin + location.pathname),
          quantity: Number(form.elements.namedItem('quantity')?.value || 1),
          website: form.elements.namedItem('website')?.value || ''
        }),
        signal: AbortSignal.timeout(15000)
      });
      let result;
      try { result = await response.json(); } catch { throw new Error('Invalid server response'); }
      if (!response.ok || result?.ok !== true) throw new Error(result?.error || 'Delivery failed');
      try { window.fbq?.('track', 'Lead', {currency:'UAH',value:469}); } catch (_) {}
      form.replaceChildren();
      const confirmation = document.createElement('div');
      confirmation.setAttribute('role','status');
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
