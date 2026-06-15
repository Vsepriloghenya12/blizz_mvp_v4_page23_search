# Page 29 verification

Проверено:

- `server npm run check`;
- `server node page29-smoke-test.js`;
- regression smoke: page24, page25, page26, page27, page28;
- `mobile npm run typecheck`;
- `mobile npx expo export --platform web`;
- grep на отсутствие `user.isBusiness`, нижней вкладки `Сообщения`, кнопки `Обновить`, создания Близза через `+`;
- `unzip -t` финального архива.
