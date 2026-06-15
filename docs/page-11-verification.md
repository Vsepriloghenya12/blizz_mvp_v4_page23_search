# Page 11 verification

Проверено:

- `server npm run check`.
- `server/page11-smoke-test.js`:
  - регистрация;
  - создание Близза от `activeAccountId`;
  - обязательная проверка `mediaUrl`;
  - `expiresAt` в будущем;
  - группировка нескольких Близзов одного аккаунта в один кружок;
  - получение Близзов аккаунта;
  - фиксация просмотра без дубля;
  - ответ на Близз как `story_reply`;
  - создание Близза бизнесом `owner`;
  - запрет создания Близза бизнес-ролью `messages`;
  - исключение истёкшего Близза из feed.
- `mobile npm install`.
- `mobile npm run typecheck`.
- `npx expo export --platform web`.
- grep-проверка:
  - нет `user.isBusiness`;
  - нет нижней вкладки `Сообщения`;
  - нет кнопки `Обновить`;
  - нет отдельного `ShareScreen` / `CommentsScreen`;
  - в `CreateHubScreen` нет action `Близз` или `story`.
- `unzip -t` архива.

Замечание:

- `npm install` показал 10 moderate vulnerabilities в зависимостях Expo/React Native. `npm audit fix --force` не запускался, чтобы не сломать согласованные версии Expo.
