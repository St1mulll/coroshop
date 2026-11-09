// Приёмник заявок работает постоянно и отправляет заявки в Telegram-бот
// @SmartDailykesh_bot (подписчики: менеджеры). Токен бота хранится в переменных
// окружения сервера и в файлах сайта отсутствует.
window.ORDER_API_URL = 'https://smartdaily-orders.spru.run/order';
window.ORDER_PRODUCT = 'Nasal Soother — 469 грн';
window.ORDER_PRICE = '469';
window.ORDER_SUPPLIER = 'Coroshop';
window.ORDER_API_FALLBACK = 'https://smartdaily-dush.spru.site/f/order';
window.ORDER_SITE = location.origin + location.pathname;
