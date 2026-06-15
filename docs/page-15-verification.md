# Page 15 verification

Проверено:

- `server npm install`
- `server npm run check`
- `server/page15-smoke-test.js`
- `mobile npm install`
- `mobile npm run typecheck`
- `npx expo export --platform web`
- grep-проверки:
  - нет нижней вкладки `Сообщения`;
  - нет кнопки `Обновить`;
  - нет `user.isBusiness`;
  - `Близз` не вернулся как create-action;
  - группы/игры не добавлены в messages.
- `unzip -t` архива
