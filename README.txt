ПЕРЕВІРЕНА ВЕРСІЯ ДЛЯ GITHUB PAGES

Виправлено: натискання кнопки, валідацію форми, відображення помилок, повідомлення після УСПІШНОЇ доставки в Telegram українською.

УВАГА: без серверного URL у assets/backend-config.js заявки НЕ надсилатимуться. GitHub Pages не підтримує PHP і не може приховати токен Telegram. Не розміщуйте токен у GitHub.

1. Створіть Cloudflare Worker і вставте код з cloudflare-worker.js.
2. У Worker → Settings → Variables and Secrets встановіть:
   TELEGRAM_BOT_TOKEN (Secret) — НОВИЙ токен з BotFather
   TELEGRAM_CHAT_ID (Text) — 353934036
   ALLOWED_ORIGIN (Text) — точне джерело сайту, наприклад https://username.github.io (без кінцевого /).
3. Deploy Worker; скопіюйте його HTTPS URL у assets/backend-config.js замість порожніх лапок.
4. Завантажте index.html, privacy.html, assets/, images/ у корінь GitHub репозиторію.
5. Перевірте замовлення з реальним тестовим ім’ям/телефоном. Успіх показується лише якщо Telegram API підтвердив доставку.

Pixel 930492246520514: PageView на сторінці, Lead лише після успішної відповіді сервера. Purchase не відправляється до фактичної оплати.

Форма консультації залишається вимкненою до підключення окремої обробки.
