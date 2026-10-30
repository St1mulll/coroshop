// Цей файл підключений ТІЛЬКИ на thanks.php після прийнятого замовлення.
(() => {
  if (window.TOVARKA_TRACKING_ENABLED !== true || !/^[0-9]{10,20}$/.test(String(window.TOVARKA_PIXEL_ID || ''))) return;
  if (typeof window.fbq !== 'function') return;
  const order = window.TOVARKA_ACCEPTED_ORDER;
  if (!order || !order.orderId) return;
  const sentOrders = new Set();

  // Обидві події надсилаються після підтвердження заявки сервером.
  // Purchase означає оформлення замовлення, а не його оплату або викуп.
  function trackOrder() {
      if (!order || !order.orderId) return;
      const key = 'order:' + order.orderId;
      if (sentOrders.has(key)) return;
      try { if (sessionStorage.getItem(key) === '1') return; } catch {}

      const params = {
        value: order.value,
        currency: 'UAH',
        content_name: order.productName,
        num_items: order.quantity
      };
      window.fbq('track', 'Lead', params, {eventID: order.orderId + ':Lead'});
      window.fbq('track', 'Purchase', params, {eventID: order.orderId + ':Purchase'});
      sentOrders.add(key);
      try { sessionStorage.setItem(key, '1'); } catch {}
  }
  trackOrder();
})();
