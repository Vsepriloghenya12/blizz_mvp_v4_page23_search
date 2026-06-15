# Page 30 verification — Метрики

Проверки выполнены от архива Page 29 Notifications после добавления Page 30 Metrics.

## Server

```txt
npm run check
node page24-smoke-test.js
node page25-smoke-test.js
node page26-smoke-test.js
node page27-smoke-test.js
node page28-smoke-test.js
node page29-smoke-test.js
node page30-smoke-test.js
```

Результат: все smoke-tests прошли.

## Mobile

```txt
npm install
npm run typecheck
npx expo export --platform web
```

Результат: typecheck и web export прошли.

## Запрещённые элементы

- `user.isBusiness` не найден.
- Нижняя вкладка `Сообщения` не возвращена: MainTabs = `Главная / Видео / + / Карта / Профиль`.
- Кнопка `Обновить` не найдена.
- Создание `Близз` через `+ / Что создать?` не возвращено.

## Ограничения

- Реальные push/analytics SDK не подключались.
- Метрики собираются через backend event-layer и существующие collections.
- Для продакшена потребуется отдельная политика retention/очистки событий.
