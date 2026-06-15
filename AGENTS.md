# AGENTS.md — Blizz MVP v4

## Base Rules

- Make minimal targeted changes.
- Do not rewrite the whole project unless explicitly asked.
- Do not add features that were not requested.
- Preserve existing architecture, routes, API contracts, storage format, naming, and deployment setup.
- Before editing code, inspect the current implementation and follow its existing style.
- Do not add new dependencies unless clearly necessary and approved by the visual workflow.
- Never expose secrets from `.env` files.
- If external API keys are missing, the app must keep working with safe local fallback behavior.

## Required Project Skills

Before planning or implementing any feature/module work, read and apply:

1. `docs/skills/scaffold.md`
2. `docs/skills/superpowers.md`

Before planning or implementing any visual/UI work, additionally read and apply:

3. `docs/skills/frontend-design.md`
4. `docs/skills/web-ui.md`
5. `docs/skills/icon-system.md`
6. `docs/skills/responsive-auditor.md`
7. `docs/skills/visual-qa.md`
8. `docs/page-32-visual-system.md`

## Visual Work Is Not Allowed Without This Workflow

For every redesigned screen/page:

1. Inspect the real screen code first.
2. List every editable UI element on the screen: headers, buttons, cards, tabs, icons, sheets, modals, empty/loading/error/noAccess states, bottom navigation, safe areas.
3. Produce or agree on a reference direction.
4. Translate the reference into editable React Native/web UI components.
5. Do not paste a full UI screenshot as a fake interface.
6. Use image assets only for actual illustrations/media backgrounds, never for fields, buttons, text, icons, tabs, system bars, status bars, or legal text.
7. Check mobile-width rendering and web/PWA rendering before giving an archive.
8. If the screen looks wrong in web/PWA because it stretches across desktop width, fix layout containment before reporting completion.

## Visual Agents

Use these roles silently before any visual implementation:

- UX Architect: checks hierarchy, scenario, primary/secondary actions, and forbidden additions.
- Mobile UI Designer: checks real phone composition, safe areas, rhythm, and touch targets.
- Web UI Designer: checks PWA/web container width, desktop browser behavior, and standalone web dashboards.
- Design System Agent: checks tokens, typography, radii, spacing, borders, cards, and states.
- Icon System Agent: prevents mixed emoji/text/png/View icons and requires one coherent icon system.
- Responsive Auditor: checks mobile viewport, web viewport, max width, scroll behavior, safe areas, and notched screens.
- Visual QA Agent: compares the implementation against the approved reference and blocks archive delivery if it is visibly worse.

## Blizz Architecture Rules

- `User` is not `Account`.
- Account-level behavior must use `activeAccountId`.
- Backend must not trust `userId` from the client.
- Do not use or introduce `user.isBusiness`.
- Bottom navigation remains: `Главная / Видео / + / Карта / Профиль`.
- Do not return `Сообщения` to the bottom navigation.
- Do not return `Близз` to the central `+ / Что создать?` flow.
- Do not add gambling, paid boosts, AI search, contact import, or ads unless explicitly requested.

## Visual Forbidden Patterns

- Do not insert a full app screen mockup as an image.
- Do not crop a generated mockup with status bar, text, buttons, fields, or icons and use it as UI.
- Do not use emoji/text symbols as final icons for navigation/actions.
- Do not use hand-drawn `View` rectangles for production icons.
- Do not add social login buttons, forgot-password links, new slogans, city labels, cards, or marketing copy unless explicitly approved.
- Do not change screen order, navigation, roles, or backend behavior during a visual pass unless explicitly requested.
- Do not deliver an archive without checking the real rendered proportions.

## Verification

After code changes, run the relevant available checks:

- `npm run check` in `server`;
- `node pageXX-smoke-test.js` when a page smoke test exists or is added;
- `npm run typecheck` in `mobile`;
- `npx expo export --platform web` when frontend behavior changed;
- grep checks for forbidden app regressions;
- zip integrity check.

After visual changes, also produce/update a verification note that includes:

- source screen files inspected;
- UI elements changed;
- UI elements intentionally not changed;
- mobile-width behavior;
- web/PWA behavior;
- known limitations;
- whether the result matched the approved reference.

If a check cannot be run, explain why.
