# Page 24 verification

## Проверено

- `server npm run check`
- `server/page24-smoke-test.js`
- `mobile npm run typecheck`
- `npx expo export --platform web`
- grep на отсутствие `user.isBusiness`, нижней вкладки `Сообщения`, кнопки `Обновить`, Близза как create-action

## Замечания

- `PostDetailScreen` переиспользует существующие endpoints лайков, сохранения и комментариев.
- Share на отдельном экране поста не дублировался, чтобы не переносить большой bottom sheet из Главной без отдельного согласования.
