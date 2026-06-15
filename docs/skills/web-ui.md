# Web UI Skill — Blizz

Use this skill for PWA/mobile-web and standalone owner/admin web surfaces.

## Mobile App on Web/PWA

The mobile app must not stretch full-width across a desktop browser. When rendered on web:

- center the mobile app shell;
- cap phone-like content around 390–430 px when appropriate;
- keep surrounding desktop background neutral;
- keep touch target scale similar to mobile;
- verify hero images do not become panoramic desktop banners unless the screen is a true web dashboard.

## Standalone Web Panels

The service owner dashboard is not the mobile app. For `/owner` and `/service-owner`:

- use dashboard layout;
- use sidebar/topbar/table/cards;
- support desktop width;
- keep mobile app bottom tabs out of this surface.

## Required Web Checks

- Expo web export must pass when mobile frontend changes.
- Inspect at mobile width around 390 px.
- Inspect at desktop browser width around 1280–1440 px.
- Verify that images, cards, tabs, and forms do not stretch incorrectly.
