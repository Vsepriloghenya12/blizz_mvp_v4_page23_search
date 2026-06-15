# Page 30 — Метрики

## Назначение

Модуль добавляет приватные метрики активного аккаунта. Метрики работают через `activeAccountId`, не используют `user.isBusiness` и не показываются чужим аккаунтам.

## Что входит

- Личные метрики: просмотры профиля, охват, вовлечённость, подписчики, посты, видео, Близзы и лучший контент.
- Бизнес-метрики: профиль, сообщения, маршруты, звонки, сайт, сохранения, витрина и предложения.
- Периоды: `7d`, `30d`, `90d`.
- Role-based access:
  - personal owner: личные метрики и контент;
  - business owner/admin: все бизнес-метрики, предложения и журнал действий;
  - business smm: контент и предложения без журнала сотрудников;
  - business messages: только message-oriented summary, без витрины и действий.
- Event-layer `metricsEvents` для будущего расширения.

## Backend

Добавлен модуль `server/src/modules/metrics`.

API:

- `GET /api/metrics/summary?period=7d|30d|90d`
- `GET /api/metrics/content?period=7d|30d|90d`
- `GET /api/metrics/business?period=7d|30d|90d`
- `GET /api/metrics/offers?period=7d|30d|90d`
- `GET /api/metrics/actions?period=7d|30d|90d`
- `POST /api/metrics/events`

Storage:

```js
metricsEvents: [
  {
    id,
    accountId,
    actorAccountId,
    eventType,
    targetType,
    targetId,
    metadata,
    status,
    createdAt
  }
]
```

## Frontend

Добавлены:

- `mobile/src/features/metrics/api/metricsApi.ts`
- `mobile/src/screens/metrics/MetricsScreen.tsx`
- вход из `Профиль → ☰ → Метрики`;
- вход из `Настройки и действия → Метрики`;
- вход из business profile action `Метрики`.

## Что не входит

- Деньги, прибыль, продажи, средний чек, fake revenue.
- Сложные графики.
- Экспорт Excel/PDF.
- Рекламный кабинет.
- AI-рекомендации.
- Публичные счётчики метрик для пользователей.
