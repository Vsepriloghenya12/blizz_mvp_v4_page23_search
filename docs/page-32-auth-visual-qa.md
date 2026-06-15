# Page 32.1 Auth Visual QA

## Source of truth
- Утверждённый mobile reference: вертикальный экран регистрации с городским hero, логотипом `Близз`, подзаголовком, двумя полями, кнопкой, входом и соглашением.
- UI не переносится как цельная картинка. Картинкой может быть только hero-город.

## Реализовано
- `AuthScreen` ограничен на web/PWA через `phoneShell` с `maxWidth: 430`.
- Hero — `mobile/assets/auth-hero-city-oil-clean.png`, без статусбара и без интерфейсных элементов.
- Поля, кнопка, логотип, текст и legal — редактируемые React Native-компоненты.
- Иконки — единый SVG icon system в `mobile/src/shared/ui/BlizzIcon.tsx` на `react-native-svg`.
- Несогласованные элементы не добавлены: соцлогины, `Забыли пароль?`, новые слоганы, desktop split-screen.

## Проверки
- `server npm run check` — пройдено.
- `mobile npm run typecheck` — пройдено.
- `npx expo export --platform web --clear` — пройдено.
- `npm install` показывает 10 moderate vulnerabilities в Expo dependency tree, без блокировки сборки.

## Ограничение проверки
Headless Chromium в sandbox завис при попытке сделать screenshot реального web preview. Визуальный screenshot из sandbox не приложен; перед следующей правкой нужно открыть экран локально на `web` и на телефоне/эмуляторе.
