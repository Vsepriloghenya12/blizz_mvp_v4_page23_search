# Проверка версии 9 — Share

## Проверено
- server `npm run check`;
- backend smoke-test `page09-smoke-test.js`;
- mobile `npm install`;
- mobile `npm run typecheck`;
- `npx expo export --platform web`;
- grep-проверки на запрещённые элементы;
- `unzip -t` итогового архива.

## Smoke-test покрывает
- регистрацию пользователя;
- создание публичного поста;
- пустой список получателей у пользователя с одним аккаунтом;
- создание бизнес-аккаунта;
- получение личного аккаунта как быстрого получателя при активном бизнесе;
- создание `shared_content` через `POST /api/share/post`;
- проверку, что senderAccountId берётся из activeAccountId;
- запрет отправки не-public поста другому аккаунту;
- ошибку при отсутствии targetAccountId.
