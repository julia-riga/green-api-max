# GREEN-API MAX Chat (Тестовое задание)

[Ссылка на живое демо](https://ваша-ссылка.vercel.app)

## 📸 Скриншоты
- [Экран логина](./screenshots/login.png)
- [Окно чата](./screenshots/chat.png)

## 🚀 Технологии
- React 19
- TypeScript
- Vite
- Context API (для стейта)
- Vitest (тесты)

## 🛠️ Локальный запуск

1. Клонируйте репозиторий:
   `git clone https://github.com/julia-riga/green-api-max.git`
2. Установите зависимости:
   `npm install`
3. Запустите dev-сервер (готово!):
   `npm run dev`

*(Опционально)* Если нужно изменить адрес API, создайте файл `.env` в корне:
```
VITE_GREEN_API_URL=https://api.green-api.com
```

## 🧪 Тесты
Запуск тестов: `npm run test`

## 📝 Функционал
- Авторизация по `idInstance` и `apiTokenInstance`.
- Валидация номера телефона перед созданием чата.
- Отправка и получение текстовых сообщений (Long Polling).
- Обработка ошибок (неверный токен, неавторизованный инстанс).