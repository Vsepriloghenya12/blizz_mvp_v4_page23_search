# Page 32.1 Auth visual quality fix

## Изменения
- Hero-картинка заменена на чистую городскую масляную иллюстрацию `auth-hero-oil-city.png` без UI-элементов.
- Убран asset/подход, где в картинку попадали статусбар, системные иконки, поля, кнопки и логотип.
- Переход от картинки к форме сделан через редактируемую панель `contentPanel` с ровными верхними радиусами.
- Поля, кнопка, логотип, подзаголовок, вход и legal text остаются React Native-компонентами.
- Убраны слабые View-иконки телефона/замка/глаза.
- Кнопка стала ниже, спокойнее по шрифту и радиусу.

## Проверки
- `server npm run check` — passed.
- `mobile npm install` — passed, 10 moderate vulnerabilities in Expo dependency tree.
- `mobile npm run typecheck` — passed.
- `npx expo export --platform web` — passed.
