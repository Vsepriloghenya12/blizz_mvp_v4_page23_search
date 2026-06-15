# Page 32.1 — Auth visual reference pass

## Scope

This is the first focused UI-pass for the Blizz registration/login screen only. It applies the approved `Blizz Clean City Auth` reference to the first app screen without changing backend auth behavior or the rest of the product visual system.

## Source of truth

- ТЗ v4: light, clean, professional UI.
- Primary color: `#163B8C`.
- Background: `#FAFAF7`.
- Logo: text wordmark `Близз`, no random icons or pink accents.
- Registration remains minimal: phone/email + password, no forced onboarding.

## Changes

### Mobile

Updated `mobile/src/features/auth/screens/AuthScreen.tsx`:

- warm light full-screen background;
- larger centered `Близз` wordmark in `#163B8C`;
- subtitle `Люди, места, Близзы и бизнес рядом`;
- subtle city line-art built with native views, no external image dependency;
- clean rounded inputs with placeholders `Телефон или email` and `Пароль`;
- visual password eye control;
- primary CTA `Создать аккаунт` / `Войти`;
- text mode switch `Уже есть аккаунт? Войти` / `Нет аккаунта? Создать`;
- legal agreement text at bottom;
- removed segmented mode switch from the first screen for a calmer auth composition.

## Not changed

- Auth API.
- Session logic.
- Account creation flow.
- MainTabs.
- Feed, profile, messages, map, metrics, reports, service owner dashboard.
- No global visual redesign yet.

## Future visual pass

The rest of Page 32 will continue screen-by-screen from approved references before implementation.
