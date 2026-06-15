# Page 14 verification

Проверено:

- `server npm install`.
- `server npm run check`.
- `server/page14-smoke-test.js`.
- `mobile npm install`.
- `mobile npm run typecheck`.
- `npx expo export --platform web`.
- grep-проверки на отсутствие лишних вкладок/кнопок.
- `unzip -t` итогового архива.

Ограничения:

- Интерактивный запуск в браузере/эмуляторе проверяется локально.
- `mobile npm install` показывает 10 moderate vulnerabilities в зависимостях Expo/React Native; `npm audit fix --force` не запускался, чтобы не сломать совместимость Expo.
