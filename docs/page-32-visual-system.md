# Page 32 — Visual System Pass

## Current Status

The project is entering a visual-polish phase. Functional MVP modules already exist up to service owner dashboard and early visual attempts. Future visual work must be disciplined and must not repeat failed auth-screen attempts.

## Visual Direction

Working direction: Blizz City Social with deep blue brand and expressive city imagery.

Core values:

- social city app;
- clean but not empty;
- warm city feeling;
- deep saturated blue;
- strong photos/illustrations;
- calm readable forms;
- one icon system;
- no AI-looking wrappers;
- no random gradients;
- no pink UI.

## Tokens

Base tokens remain from TЗ v4 unless intentionally updated:

- Primary: deep blue, current project direction `#0B3D99`.
- Background: `#FAFAF7`.
- Surface: `#FFFFFF`.
- Text Primary: near navy/black.
- Text Secondary: muted gray-blue.
- Border: soft blue-gray.

## Screen-by-Screen Visual Process

For each screen:

1. Inspect existing files.
2. Produce a UI inventory.
3. Discuss/approve reference.
4. Convert reference into editable components.
5. Verify mobile + web rendering.
6. Run code checks.
7. Update live journal and verification docs.
8. Archive only after Visual QA passes.

## Auth Screen Specific Rules

Registration/login first page contains only:

- expressive city hero illustration/media;
- real text logo `Близз`;
- subtitle `Люди, места, Близзы и бизнес рядом`;
- `Телефон или email` input;
- `Пароль` input;
- password visibility control;
- primary button `Создать аккаунт` or `Войти` depending mode;
- text switch `Уже есть аккаунт? Войти` / `Нет аккаунта? Создать`;
- legal agreement text.

Forbidden on auth screen unless explicitly approved:

- VK/Google/Apple/Telegram/social login;
- `Забыли пароль?`;
- extra slogans;
- city tooltip cards;
- system status bars inside hero asset;
- input fields/buttons/text baked into the image;
- full-screen mockup pasted as one image.

## Web/PWA Auth Requirement

On desktop web, the auth screen must render as a mobile app surface, not as a full-width desktop banner. Use a capped/centered shell when needed.

## Icon Plan

Next visual implementation should replace unstable handmade icons with one icon system. Preferred: add `lucide-react-native` only if approved and compatible with Expo SDK 56 / React Native 0.85. Otherwise create a single reusable internal Icon component with SVG/Vector implementation. Do not use generated PNG icons extracted from mockups.
