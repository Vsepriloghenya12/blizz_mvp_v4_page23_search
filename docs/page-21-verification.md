# Page 21 Verification

## Проверено

- `server npm install`
- `server npm run check`
- `server/page21-smoke-test.js`
- `mobile npm install`
- `mobile npm run typecheck`
- `npx expo export --platform web`
- grep-проверки source-кода
- `unzip -t` итогового архива

## Smoke-test сценарии

- закрытый аккаунт получает pending-заявку;
- владелец закрытого аккаунта видит заявку;
- владелец принимает заявку;
- после принятия follow-state становится `following`;
- список подписчиков обновляется;
- список подписок обновляется;
- accepted follower видит followers-only пост;
- stranger не видит followers-only пост закрытого аккаунта;
- после unfollow доступ к followers-only посту пропадает;
- self-follow запрещён.

## Ограничения

Публичный экран чужого профиля и рекомендации людей не добавлены. Модуль закладывает backend и системные экраны подписчиков/подписок/заявок; публичный профиль другого аккаунта нужно согласовать отдельным модулем поиска/профиля.
