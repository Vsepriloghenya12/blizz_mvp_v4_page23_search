# Page 23 verification

## Проверено

- `server npm install`
- `server npm run check`
- `server/page23-smoke-test.js`
- `mobile npm install`
- `mobile npm run typecheck`
- `npx expo export --platform web`
- grep source-check на запрещённые элементы
- `unzip -t` итогового архива

## Замечания

- `mobile npm install` показывает 10 moderate vulnerabilities в Expo/React Native зависимостях. `npm audit fix --force` не запускался, чтобы не сломать совместимые версии Expo.
- До Page 24 поиск поста открывал автора. После Page 24 посты открываются в `PostDetailScreen`.
