# MAX-чат на GREEN-API

Тестовое задание: простой веб-чат для мессенджера MAX. Отправка текстовых сообщений — метод `SendMessage`, получение — HTTP API (`ReceiveNotification` + `DeleteNotification`). Интерфейс повторяет тёмную тему [web.max.ru](https://web.max.ru/).

## Что умеет приложение

- Вход по `idInstance` и `apiTokenInstance` из [личного кабинета GREEN-API](https://console.green-api.com/)
- Новый чат по номеру телефона получателя (`CheckAccount`)
- Отправка и получение только текстовых сообщений
- Длинный опрос очереди уведомлений без вебхука

## Локальный запуск

Нужны Node.js 20+ и npm.

```bash
npm install
npm run dev
```

Откройте адрес, который покажет Vite (обычно `http://localhost:5173`).

Перед работой:

1. Зарегистрируйтесь на [green-api.com/max](https://green-api.com/max) и создайте инстанс MAX (тариф «Разработчик»).
2. Авторизуйте инстанс в MAX.
3. В кабинете оставьте пустым `webhookUrl` и включите входящие/исходящие уведомления. При входе приложение также вызывает `SetSettings`.
4. Скопируйте `idInstance`, `apiTokenInstance` и при необходимости `apiUrl`.

Адрес API подбирается автоматически по `idInstance` (`https://<первые 4 цифры>.api.green-api.com`, для инстансов MAX на `3` — ещё `https://3100.api.green-api.com`). Если хост не подошёл, на экране входа можно указать API URL вручную или задать `VITE_GREEN_API_URL` в `.env`.

```bash
npm run build
npm run preview
```

## Ограничения

- Только текст, без медиа, групп и цитирования
- Номера для `CheckAccount` — РФ (`7`) и РБ (`375`)
- Состояние чатов хранится в `sessionStorage` текущей вкладки
