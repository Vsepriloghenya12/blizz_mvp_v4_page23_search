# Проверка версии 5

## Выполнено

- `server npm run check` — пройдено.
- Backend smoke-test бизнес-сценария из версии 4 — пройден.
- `mobile npm install` — пройдено, ETARGET нет.
- `mobile npm run typecheck` — пройдено.
- `npx expo export --platform web` — пройдено.
- grep-проверка — в коде нет создания `Близза` как action в `+`, нет нижней вкладки `Сообщения`, нет `user.isBusiness`, нет старых подсказок профиля.
- `src/app` переименован в `src/core`, чтобы Expo не воспринимал проект как Expo Router root.

## Не выполнялось

- Интерактивный запуск Expo в браузере/эмуляторе. Его нужно проверить локально.
