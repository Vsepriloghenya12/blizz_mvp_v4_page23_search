# Page 31.1 verification

Проверено:

- отдельный web-route `/owner` отдаёт standalone HTML панели владельца приложения;
- отдельный web-route `/service-owner` отдаёт ту же панель;
- обычный пользователь не может войти в service owner panel;
- service owner может войти через `POST /api/service-owner/login`;
- `/api/service-owner/overview` агрегирует пользователей, аккаунты, бизнесы, контент, активность и жалобы;
- `/api/service-owner/users` ищет пользователей;
- `/api/service-owner/businesses` ищет бизнесы;
- `/api/service-owner/content` показывает агрегаты контента и recent items;
- `/api/service-owner/reports` показывает глобальную очередь жалоб;
- `/api/service-owner/metrics` показывает events и регистрации;
- обычная сессия не имеет доступа к service owner API;
- logout service owner отзываeт session.

Проверки:

```bash
cd server
npm run check
node page24-smoke-test.js
node page25-smoke-test.js
node page26-smoke-test.js
node page27-smoke-test.js
node page28-smoke-test.js
node page29-smoke-test.js
node page30-smoke-test.js
node page31-smoke-test.js
node page31_1-smoke-test.js

cd ../mobile
npm install
npm run typecheck
npx expo export --platform web
```

Также выполнен grep-контроль:

- `user.isBusiness` не найден;
- нижняя вкладка `Сообщения` не возвращена;
- кнопка `Обновить` в mobile UI не добавлена;
- создание `Близз` через центральный `+` не возвращено.
