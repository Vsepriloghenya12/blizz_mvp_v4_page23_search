# Page 31.1 — Владелец приложения / Service Owner Dashboard

## Назначение

Отдельная web-панель владельца платформы Близз. Это не часть мобильного приложения, не нижняя вкладка и не бизнес-кабинет.

Панель открывается по отдельным URL backend-сервера:

- `/owner`
- `/service-owner`

## Роль

Доступ только для пользователя с сервисной ролью:

- `user.status = service_owner` или `service_admin`
- либо флаг `isServiceOwner`, `isServiceAdmin`, `isServiceModerator`

Обычный пользователь и владелец бизнеса не могут войти в эту панель.

## Что входит

### Отдельный web-вход

- `server/public/service-owner/index.html`
- `server/public/service-owner/styles.css`
- `server/public/service-owner/app.js`

Это standalone web UI на стороне backend, без Expo/MainTabs/AuthScreen.

### Backend API

- `POST /api/service-owner/login`
- `GET /api/service-owner/me`
- `POST /api/service-owner/logout`
- `GET /api/service-owner/overview?period=7d|30d|90d`
- `GET /api/service-owner/users?query=`
- `GET /api/service-owner/accounts?query=`
- `GET /api/service-owner/businesses?query=`
- `GET /api/service-owner/content?period=7d|30d|90d`
- `GET /api/service-owner/reports?status=`
- `GET /api/service-owner/metrics?period=7d|30d|90d`

### Разделы панели

- Обзор
- Пользователи
- Бизнесы
- Контент
- Жалобы
- Метрики

### Метрики владельца приложения

Панель показывает агрегаты по всей платформе:

- пользователи всего;
- новые пользователи;
- активные пользователи;
- личные аккаунты;
- бизнес-аккаунты;
- посты;
- видео;
- Близзы;
- предложения;
- сообщения;
- сохранения;
- маршруты;
- жалобы;
- статусы модерации;
- бизнесы с предложениями;
- активность по `metricsEvents`.

## Что не входит

- вход через мобильное приложение;
- пункт в нижнем меню;
- вход из профиля обычного пользователя;
- финансовые показатели: продажи, прибыль, средний чек;
- рекламный кабинет;
- AI-модерация;
- удаление пользователей;
- полноценный super-admin с destructive actions;
- экспорт Excel/PDF.

## Проверка доступа

Обычный пользователь получает отказ на `/api/service-owner/login` и `/api/service-owner/*`.

Сервисный владелец входит только через `/owner` или `/service-owner`, получает отдельную service-owner session и работает с backend API панели.
