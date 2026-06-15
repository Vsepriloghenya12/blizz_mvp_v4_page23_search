# Page 32.1 — Auth oil visual verification

## Scope
Applied the approved registration/login direction as real editable UI, not as a screenshot paste.

## Changed
- Added `mobile/assets/auth-hero-oil-city.png` as clean city hero art only.
- Reworked `mobile/src/features/auth/screens/AuthScreen.tsx`.
- Kept the agreed auth structure:
  - `Близз`
  - `Люди, места, Близзы и бизнес рядом`
  - `Телефон или email`
  - `Пароль`
  - `Создать аккаунт`
  - `Уже есть аккаунт? Войти`
  - user agreement text
- No social login buttons.
- No new slogans.
- No phone statusbar/system icons inside the asset.
- No UI fields/logos baked into the image.

## Checks
- `server npm run check` — passed.
- `mobile npm install` — completed, 10 moderate vulnerabilities from current Expo dependency tree.
- `mobile npm run typecheck` — passed.
- `npx expo export --platform web` — passed.
- forbidden grep checks — no `user.isBusiness`, no `Обновить`, no create-Blizz action via `+`; bottom navigation messages was not reintroduced.
