# Проверка страницы 13 — Карта

Пройдено:

- server npm install;
- server npm run check;
- server/page13-smoke-test.js;
- mobile npm install;
- mobile npm run typecheck;
- npx expo export --platform web;
- grep-проверка на отсутствие user.isBusiness;
- grep-проверка, что Сообщения не вернулись в нижнее меню;
- grep-проверка, что кнопка Обновить не вернулась;
- grep-проверка, что блок Предложения рядом не вернулся;
- grep-проверка, что Близз не вернулся как create-action в CreateHub;
- grep-проверка, что в MapScreen нет кнопок создания/публикации.

Не делалось:

- интерактивный запуск в браузере/эмуляторе;
- подключение Yandex MapKit;
- полноценный публичный профиль бизнеса из карты;
- отдельный PostDetailScreen из карты;
- opening конкретного StoryViewer из карты.
