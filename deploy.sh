#!/usr/bin/env bash
# Деплой «одной кнопкой»: установка зависимостей, сборка и запуск сервера.
# Использование:  ./deploy.sh   (или: bash deploy.sh)
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Установка зависимостей..."
npm install --no-audit --no-fund

echo "==> Сборка фронтенда..."
npm run build

echo "==> Запуск сервера (Ctrl+C для остановки)..."
exec node server.js
