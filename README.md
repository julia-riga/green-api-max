# MAX-чат на GREEN-API

Тестовое задание: простой веб-чат для мессенджера MAX. Отправка текстовых сообщений — метод `SendMessage`, получение — HTTP API (`ReceiveNotification` + `DeleteNotification`). Интерфейс повторяет тёмную тему [web.max.ru](https://web.max.ru/).

## Что умеет приложение

- Вход по `idInstance` и `apiTokenInstance` из [личного кабинета GREEN-API](https://console.green-api.com/)
- Новый чат по номеру телефона получателя (`CheckAccount`)
- Отправка и получение только текстовых сообщений
- Длинный опрос очереди уведомлений без вебхука

## Запуск «одной кнопкой»

Нужен только Node.js 20+. Все остальные шаги (установка зависимостей, сборка, запуск) выполняет один скрипт:

```bash
./deploy.sh          # Linux/macOS
# или
npm run one          # любая ОС
```

Откроется на `http://localhost:3000`.

### Деплой в интернет (бесплатно, тоже «одной кнопкой»)

Приложение готово к размещению на [Render.com](https://render.com) — в репозитории есть `render.yaml`:

1. Залейте проект на GitHub.
2. Откройте `https://render.com/deploy?repo=<логин>/<репозиторий>` **или** в панели Render выберите *New → Web Service* и укажите репозиторий — Blueprint подхватится автоматически.
3. Нажмите **Create** — Render сам выполнит `npm install && npm run build` и запустит `node server.js`. Прокси `/api/...` решает проблему CORS, ничего дополнительно настраивать не нужно.

(Аналогично можно задеплоить на Railway / Fly.io: Build command `npm install && npm run build`, Start command `node server.js`, порт из переменной окружения `PORT` поддерживается.)

**Ручной запуск в продакшн-режиме:**

```bash
npm install && npm run deploy
```

Откроется на `http://localhost:3000`. Сборка + запуск одним скриптом; запросы к GREEN-API идут через встроенный прокси (`/api/<хост>/...`), поэтому CORS не мешает.

**Режим разработки (с горячей перезагрузкой):**

```bash
npm install
npm run dev
```

Откройте адрес, который покажет Vite (обычно `http://localhost:5173`). Прокси настроен и в dev-сервере.

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
