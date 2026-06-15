# Page 20 verification

## Выполненные проверки

- `server npm install` — успешно, 0 vulnerabilities.
- `server npm run check` — успешно.
- `server/page20-smoke-test.js` — успешно.
- `mobile npm install` — успешно, 10 moderate vulnerabilities в Expo/React Native дереве зависимостей.
- `mobile npm run typecheck` — успешно.
- `npx expo export --platform web` — успешно.
- `grep` проверил отсутствие запрещённых элементов в source-коде.
- `unzip -t` архива — успешно.

## Smoke-test проверяет

- `GET /api/settings/me` создаёт настройки для `activeAccountId`.
- `PATCH /api/settings/me` сохраняет privacy/map/messages/content/safety.
- `userId` в body игнорируется.
- `showLiveLocation` остаётся `false`, даже если клиент отправляет `true`.
- `profile.isPrivate` синхронизируется с приватностью.
- Невалидные значения отклоняются.
- Настройки личного и бизнес-аккаунта разделены.

## Что не делалось

- Финальный визуал.
- Глубокие detail-экраны для каждой настройки.
- Удаление аккаунта.
- Платежи/заказы/донаты.
- Live tracking.
