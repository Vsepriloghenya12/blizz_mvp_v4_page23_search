# Blizz Home City Signal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved City Signal Home visual direction, softly rounded shared icons, icon-only bottom navigation, and the animated moving signal line without changing product behavior.

**Architecture:** Keep all existing API, state, and route logic. Consolidate Home and navigation icons in `BlizzIcon`, restyle the existing Home components in place, and add one focused `BottomSignalLine` component that owns layout measurement and animation. Use React Native `Animated` and `react-native-svg`, both already present.

**Tech Stack:** Expo 56, React Native 0.85, TypeScript, React Native Web, `Animated`, `react-native-svg`.

---

## File Structure

- Modify `mobile/src/shared/ui/theme.ts`: add focused visual and icon tokens.
- Modify `mobile/src/shared/ui/BlizzIcon.tsx`: authoritative icon registry and true active states.
- Create `mobile/src/navigation/BottomSignalLine.tsx`: continuous divider and animated active curve.
- Modify `mobile/src/navigation/MainTabs.tsx`: icon-only navigation, app rail, signal animation.
- Modify `mobile/src/screens/home/HomeScreen.tsx`: City Signal composition and state styling.
- Create `docs/page-32-3-home-city-signal-verification.md`: required visual verification note.

### Task 1: Establish Shared Visual Tokens

**Files:**
- Modify: `mobile/src/shared/ui/theme.ts`

- [ ] Add semantic tokens for `pageOuter`, `surfaceMuted`, `divider`, `iconDefault`, `iconMuted`, `iconActive`, `iconDanger`, and the 16 px screen grid.
- [ ] Keep existing token names backward compatible.
- [ ] Run `npm run typecheck` in `mobile`; expect exit code 0.
- [ ] Commit only `theme.ts` with message `style: add City Signal visual tokens`.

### Task 2: Consolidate The Icon Family

**Files:**
- Modify: `mobile/src/shared/ui/BlizzIcon.tsx`
- Modify: `mobile/src/screens/home/HomeScreen.tsx`

- [ ] Add/normalize glyphs: `home`, `video`, `plus`, `mapPin`, `profile`, `search`, `notificationBell`, `message`, `heart`, `comment`, `share`, `bookmark`, `moreHorizontal`, `chevronLeft`, `close`, `send`.
- [ ] Fix the registry so unknown names cannot silently render `eye`.
- [ ] Lock standard stroke and size variants inside `BlizzIcon`; remove screen-controlled arbitrary stroke weights.
- [ ] Implement true filled variants for active home/video/map/profile/bell/message/heart/bookmark.
- [ ] Remove local Home SVG icon components and replace them with `BlizzIcon`.
- [ ] Grep `HomeScreen.tsx` and `MainTabs.tsx` for local `<Svg`, emoji, and text-symbol icons; expect no production action icons outside the registry.
- [ ] Run `npm run typecheck`; expect exit code 0.
- [ ] Commit with message `style: consolidate Blizz icon family`.

### Task 3: Implement City Signal Home Composition

**Files:**
- Modify: `mobile/src/screens/home/HomeScreen.tsx`

- [ ] Set a consistent 16 px horizontal grid and compact header with 44 px action targets.
- [ ] Remove the `Близзы` title and any separate `Ваш Близз` header action.
- [ ] Render the current user's Blizz first, using their active-account avatar/fallback and a small attached plus badge.
- [ ] Keep viewed/unseen, loading, error, disabled, and long-name behavior intact.
- [ ] Restyle `Лента / Витрина` with normal-case typography and the approved pulse underline.
- [ ] Remove `postActionsDivider` from post markup and styles.
- [ ] Ensure post text does not render a separate tag row; existing post text remains untouched.
- [ ] Rebalance author, location, time, media, caption, and action spacing to match the reference.
- [ ] Make post action targets at least 44 px without enlarging glyphs beyond 20 px.
- [ ] Preserve every existing callback, API request, sheet, viewer, loading, empty, and error state.
- [ ] Run `npm run typecheck`; expect exit code 0.
- [ ] Commit with message `style: apply City Signal home layout`.

### Task 4: Build The Moving Bottom Signal

**Files:**
- Create: `mobile/src/navigation/BottomSignalLine.tsx`
- Modify: `mobile/src/navigation/MainTabs.tsx`

- [ ] Implement a full-width neutral divider plus one 48 px curved SVG segment.
- [ ] Accept `activeIndex`, `itemCount`, `width`, and `reducedMotion`.
- [ ] Calculate tab centers from measured bar width; do not hard-code device widths.
- [ ] Animate horizontal translation with `Animated.timing`, 240 ms, `Easing.inOut(Easing.cubic)`.
- [ ] Render the initial position without entrance animation.
- [ ] Stop the current animation and animate toward the newest destination on rapid selection.
- [ ] Use a slightly deeper curve when `activeIndex === 2`.
- [ ] Remove bottom-navigation text labels while retaining accessibility labels.
- [ ] Keep icons at 24 px and central plus at 28 px.
- [ ] Keep all five destinations and route behavior unchanged.
- [ ] Add centered web/PWA app rail with maximum width 430 px and neutral outer background.
- [ ] Run `npm run typecheck`; expect exit code 0.
- [ ] Commit with message `feat: add animated bottom navigation signal`.

### Task 5: Validate Existing Interactions

**Files:**
- Modify only if a regression is found in the scoped files.

- [ ] Test search, notifications, and messages header actions.
- [ ] Test current-user Blizz creation and opening another user's Blizz.
- [ ] Test `Лента / Витрина`.
- [ ] Test post opening, account opening, like, comments, share, and save.
- [ ] Test every bottom destination, adjacent and non-adjacent transitions.
- [ ] Test rapid repeated tab changes and transitions to/from central `+`.
- [ ] Confirm one signal curve remains at the latest active destination.
- [ ] Confirm the signal does not move layout or safe-area spacing.

### Task 6: Responsive And Visual QA

**Files:**
- Create: `docs/page-32-3-home-city-signal-verification.md`

- [ ] Run `npm run check` in `server`; expect exit code 0.
- [ ] Run `npm run typecheck` in `mobile`; expect exit code 0.
- [ ] Run `npx expo export --platform web` in `mobile`; expect exit code 0.
- [ ] Capture Home at 390 x 844 and compare it directly with `docs/visual/mocks/blizz-home-city-signal-reference.png`.
- [ ] Inspect at 360, 390, and 430 px widths.
- [ ] Inspect at 1280 x 800 and 1440 x 900; verify centered 430 px rail.
- [ ] Confirm no labels in bottom navigation, no Blizz block title, no post-action divider, no tag row, and current-user Blizz first with small plus.
- [ ] Grep for forbidden navigation regression and production icon symbols.
- [ ] Record inspected files, changed elements, intentionally unchanged elements, tested widths, PWA containment, known limitations, and reference-match assessment.
- [ ] Commit with message `docs: verify City Signal home visual pass`.

