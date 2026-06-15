# Page 29 — Уведомления

## Назначение

Добавить внутренние уведомления и основу push-token для Android/PWA без запроса push-разрешений на регистрации.

## Входы

- Главная → иконка уведомлений в шапке.
- Профиль → ☰ → Уведомления.
- Настройки и действия → Уведомления.

## UI

Экран `NotificationsScreen`:

- фильтры `Все / Сообщения / Активность / Бизнес / Система`;
- список unread/read уведомлений;
- пустое состояние `Пока нет уведомлений`;
- отметка одного уведомления прочитанным;
- отметка всех уведомлений прочитанными;
- настройки категорий уведомлений.

## Backend/API

- `GET /api/notifications`
- `POST /api/notifications/:notificationId/read`
- `POST /api/notifications/read`
- `GET /api/notifications/settings`
- `PATCH /api/notifications/settings`
- `POST /api/notifications/push-tokens`
- `DELETE /api/notifications/push-tokens/:deviceId`

## Модели

- `Notification`
- `NotificationSettings`
- `PushToken`

## Триггеры

- сообщения;
- ответы на Близзы;
- комментарии;
- лайки;
- подписки и заявки;
- игры.

## Не входит

- реальная доставка push;
- запрос разрешений на старте;
- email/SMS;
- WebSocket/realtime;
- рекламные уведомления;
- отдельная нижняя вкладка;
- визуальный редизайн.
