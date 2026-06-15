# Page 19 verification — Games / Shells

## Completed checks

- `server npm install`
- `server npm run check`
- `server/page19-smoke-test.js`
- `mobile npm install`
- `mobile npm run typecheck`
- `npx expo export --platform web`
- source grep checks
- `unzip -t` after archive creation

## Scope

Implemented `Напёрстки` as `gameType=shells`.

Preserved:

- no bottom tab `Сообщения`;
- no button `Обновить`;
- no `user.isBusiness`;
- `Близз` is not a create action;
- no `Квиз`, `Угадай место`, `Быстрый выбор` in source;
- games forbidden in business chat.

## Notes

`mobile npm install` reports 10 moderate vulnerabilities from Expo/React Native dependency tree. `npm audit fix --force` was not run to avoid breaking Expo-compatible versions.
