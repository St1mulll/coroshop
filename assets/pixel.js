// Meta Pixel. Номер пікселя змінюється в assets/pixel-config.js.
(() => {
  const pixelId = String(window.TOVARKA_PIXEL_ID || '');
  if (window.TOVARKA_TRACKING_ENABLED !== true || !/^[0-9]{10,20}$/.test(pixelId)) return;

  if (!window.fbq) {
    const fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    window.fbq = fbq;
    window._fbq = window._fbq || fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
})();
