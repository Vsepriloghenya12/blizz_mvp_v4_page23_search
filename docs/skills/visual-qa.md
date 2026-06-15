# Visual QA Skill — Blizz

## Goal

Stop bad archives before delivery.

## Blockers

Do not deliver if:

- the result is visibly worse than the approved reference;
- hero image is stretched/cropped badly;
- desktop web layout is broken;
- icons are inconsistent or low quality;
- button/font/spacing looks accidental;
- unapproved text, buttons, or login methods appeared;
- the design is implemented as one pasted UI screenshot;
- interactive UI is not editable.

## Visual QA Checklist

For each redesigned screen verify:

1. Reference match.
2. Real component implementation.
3. Header and safe area.
4. Buttons.
5. Inputs.
6. Icons.
7. Cards/lists.
8. Tabs/chips.
9. Bottom sheets/modals.
10. Empty/loading/error states.
11. Web/PWA width.
12. Mobile width.
13. No forbidden regressions.

## Delivery Rule

If any blocker exists, report it and do not claim the visual pass is complete.
