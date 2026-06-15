# Page 32.1 Auth visual exact-reference fix

Fix after review: the previous auth city illustration was a similar custom line-art, not the approved reference. This version uses the approved reference directly as a cropped hero asset:

- `mobile/assets/auth-reference-hero.png`
- `AuthScreen` renders this asset in the hero area instead of rebuilding the city/logo manually.
- The auth form remains functional below the visual reference.
- Desktop/web width is constrained so the hero does not stretch across the whole browser.

Checks:
- server npm install
- server npm run check
- mobile npm install
- mobile npm run typecheck
- Expo web export
- source grep for forbidden regressions
- zip integrity
