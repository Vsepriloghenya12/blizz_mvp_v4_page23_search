# Frontend Design Skill — Blizz

Use this skill before touching mobile UI.

## Goal

Turn an approved reference into real editable UI, not a screenshot pasted into the app.

## Required Checks

1. Define the screen hierarchy: what is first, second, third.
2. Keep the screen focused on its actual scenario.
3. Preserve existing functional logic.
4. Use Blizz tokens from `mobile/src/shared/ui/theme.ts` unless a token update is intentionally approved.
5. Keep touch targets comfortable: usually 44–56 px minimum.
6. Keep typography consistent: titles, body, captions, actions.
7. Keep states designed: loading, empty, error, noAccess, blocked/private, disabled.
8. Use real components for text, buttons, inputs, tabs, chips, icons, and bottom sheets.

## Do Not

- Do not add new marketing content.
- Do not add unapproved buttons.
- Do not make one screen beautiful by breaking another shared component.
- Do not mix several visual styles in one page.
- Do not rely on a generated image for functional UI.

## Output Before Coding

For each screen, write a short implementation map:

- files to edit;
- components to reuse/create;
- icons needed;
- image assets needed;
- states to cover;
- verification commands.
