# Page 15 — Сообщения / чаты

## Назначение

Модуль сообщений связывает уже реализованные сценарии:

- кнопка сообщений в шапке Главной и Профиля;
- Share поста как `shared_content`;
- ответы на Близзы как `story_reply`;
- кнопка `Написать` в предложении для бизнес-чата.

Сообщения не являются пунктом нижнего меню.

## Входы

```text
Главная → 💬 → Сообщения
Профиль → 💬 → Сообщения
ShareSheet → отправить пост → Диалог
StoryViewer → ответить → Диалог
OfferDetailScreen → Написать → Бизнес-чат
```

## Экраны

```text
MessagesScreen
├── фильтры: Все / Личные / Бизнес
├── список диалогов
└── ChatScreen
    ├── текстовые сообщения
    ├── карточки shared_content
    ├── карточки story_reply
    └── поле отправки
```

## Backend

```text
GET /api/messages/conversations
GET /api/messages/conversations/:conversationId
POST /api/messages/conversations
POST /api/messages
POST /api/messages/read
```

## Правила

- Сообщение отправляется от `activeAccountId`.
- Для бизнес-ответа `senderAccountId = businessAccountId`, а `actorUserId` фиксирует конкретного пользователя.
- Чужой аккаунт не может читать диалог, где он не участник.
- Группы и игры не реализованы в этом модуле.
- Нижняя вкладка `Сообщения` не добавляется.
