# Страница / модуль 16 — Группы в сообщениях

## Назначение

Группы добавляются внутрь модуля сообщений. Они не становятся отдельной вкладкой нижнего меню.

Нижнее меню остаётся:

```text
Главная / Видео / + / Карта / Профиль
```

Вход:

```text
Главная или Профиль → кнопка сообщений → Сообщения → + → Новая группа
```

## Что реализовано

- Фильтр `Группы` внутри `MessagesScreen`.
- Кнопка `+` в шапке сообщений для создания группы.
- Экран `Новая группа` внутри модуля сообщений.
- Создание группы через `POST /api/messages/groups`.
- Защита от дублей через `clientRequestId` на backend.
- Групповой чат использует тот же `ChatScreen`, что и личные/бизнес-чаты.
- В группе можно отправлять текстовые сообщения.
- Сообщение создаётся от `activeAccountId`; backend фиксирует `actorUserId`.
- Участники группы хранятся в `Conversation.participantAccountIds`.

## Backend

```text
POST /api/messages/groups
GET /api/messages/groups/:conversationId/members
GET /api/messages/conversations?filter=group
GET /api/messages/conversations/:conversationId
POST /api/messages
```

## Conversation type=group

```json
{
  "id": "conv_group_123",
  "type": "group",
  "title": "Куда пойдём?",
  "createdByAccountId": "account_123",
  "participantAccountIds": ["account_123", "account_456"],
  "clientRequestId": "client_req_123",
  "status": "active"
}
```

## Правила

- Группа создаётся только внутри сообщений.
- Нельзя создать группу без участников.
- Повторный запрос с тем же `clientRequestId` возвращает уже созданную группу.
- Чужой аккаунт не может читать и писать в группу.
- Случайные демо-группы и демо-участники не добавляются.
- Бизнес-чаты остаются отдельным типом `business`.

## Не реализовано в этом модуле

- игры;
- вложения из галереи;
- голосовые;
- звонки;
- сложные роли админов;
- публичные группы;
- деньги, ставки, азартные механики.
