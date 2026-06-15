# Page 31 verification

Проверено:

- `server npm run check`
- `node page24-smoke-test.js`
- `node page25-smoke-test.js`
- `node page26-smoke-test.js`
- `node page27-smoke-test.js`
- `node page28-smoke-test.js`
- `node page29-smoke-test.js`
- `node page30-smoke-test.js`
- `node page31-smoke-test.js`
- `mobile npm install`
- `mobile npm run typecheck`
- `npx expo export --platform web`
- grep: `user.isBusiness` отсутствует
- grep: нижняя вкладка `Сообщения` не возвращена
- grep: кнопка `Обновить` не возвращена
- grep: создание Близза через `+` не возвращено

Важно:

- `mobile npm install` показал 10 moderate vulnerabilities из текущего dependency tree Expo; это не новый функциональный regression Page 31.
- Реальная AI/автоматическая модерация не подключалась.
- Полное управление сотрудниками остаётся отдельным модулем.
