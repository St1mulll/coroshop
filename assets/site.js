// Форма замовлення. Ціну перевіряє сервер у config.php.
(() => {
  const cfg = {"demo":false,"productName":"Апарат для фізіотерапії носової порожнини Nasal Soother, USB, чорний"};
  const form = document.getElementById('order-form');
  if (!form) return;
  const error = document.getElementById('form-error');
  const button = form.querySelector('button');
  let token = '';


  async function getToken() {
    if (cfg.demo) return;
    try {
      const response = await fetch('order.php?action=token', {credentials: 'same-origin', cache: 'no-store'});
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      token = data.token;
    } catch {
      error.textContent = 'Не вдалося підключити форму. Спробуйте оновити сторінку';
    }
  }
  getToken();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    if (cfg.demo) {
      error.textContent = 'Це демонстраційний сайт. Заявки не надсилаються';
      return;
    }
    if (!form.reportValidity()) return;
    if (!token) {
      await getToken();
      if (!token) return;
    }
    button.disabled = true;
    button.textContent = 'Надсилаємо…';

    try {
      const data = new FormData(form);
      data.set('token', token);
      const response = await fetch('order.php', {method: 'POST', body: data, credentials: 'same-origin'});
      const order = await response.json();
      if (!response.ok || !order.ok) throw Error(order.error || 'Не вдалося надіслати заявку');

      // Lead та Purchase спрацьовують тільки на сторінці подяки.
      window.location.assign('thanks.php');
    } catch (cause) {
      error.textContent = cause.message || 'Не вдалося надіслати заявку';
      button.disabled = false;
      button.textContent = 'Оформити замовлення';
    }
  });
})();
