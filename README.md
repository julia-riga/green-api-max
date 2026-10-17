# GREEN-API MAX Chat (Тестовое задание)

[Ссылка на живое демо](https://green-api-max-alpha.vercel.app/)

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

## 🏗️ Архитектура

Проект — клиентское SPA (React 19 + TypeScript, сборщик Vite). Три ключевых слоя:

### 1. UI Layer (`src/components/`)
Компоненты разделены на «глупые» и контейнерные: `LoginScreen`, `Sidebar`, `ChatWindow`. Темная тема MAX + `react-hot-toast` для уведомлений.

### 2. State Management Layer (`src/store/ChatContext.tsx`)
Нативный Context API + `useReducer` вместо Redux — достаточно мощно для чата и без бойлерплейта.

### 3. API Layer (`src/api/greenApi.ts`)
- Каскадный поиск URL через `resolveCredentials` / `candidateApiUrls`
- Long Polling: цикл `receiveNotification → deleteNotification` в `useEffect`
- Все запросы обернуты в `try...catch`, ошибки нормализуются и показываются как тосты

### 🔄 Поток данных
Авторизация → проверка через `checkAccount` → переключение на экран чата. Отправка: оптимистичное добавление в стейт + запрос на сервер. Получение: фоновый Long Polling → `dispatch ADD_MESSAGE` → перерисовка.

### 🛠️ Trade-offs
- **Context API вместо Redux/Zustand**: для одного домена избыточен Redux
- **Long Polling вместо WebSockets**: требование задания + классический REST-паттерн
- **Fallback URL в коде**: `import.meta.env.VITE_GREEN_API_URL || 'https://api.green-api.com'` — проект работает «из коробки» без `.env`

### 📂 Структура папок
```
src/
├── api/          # Сетевые запросы к GREEN-API
├── components/   # React-компоненты (UI)
├── store/        # Context, Reducer, Actions
├── utils/        # Вспомогательные функции (форматирование, валидация)
├── types/        # TypeScript интерфейсы и типы
└── main.tsx      # Точка входа, провайдеры
```

## 📝 Функционал
- Авторизация по `idInstance` и `apiTokenInstance`.
- Валидация номера телефона перед созданием чата.
- Отправка и получение текстовых сообщений (Long Polling).
- Обработка ошибок (неверный токен, неавторизованный инстанс).