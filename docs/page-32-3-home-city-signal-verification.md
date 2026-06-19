# Page 32.3 - Home City Signal Verification

## Source Files Inspected

- `mobile/src/screens/home/HomeScreen.tsx`
- `mobile/src/navigation/MainTabs.tsx`
- `mobile/src/shared/ui/BlizzIcon.tsx`
- `mobile/src/shared/ui/theme.ts`
- `mobile/src/core/AppRoot.tsx`
- `docs/visual/mocks/blizz-home-city-signal-reference.png`
- `docs/superpowers/specs/2026-06-18-home-city-signal-design.md`

## UI Elements Changed

- Home wordmark header spacing and icon targets.
- Search, notification, and message icons.
- Blizz row geometry and states.
- Current user's Blizz moved to the first position with a small attached plus.
- Every Blizz author name is constrained to one 56 px line with tail ellipsis.
- `Лента / Витрина` typography and active indicator.
- Removed excess vertical space between the Blizz row and feed tabs.
- Added a 240 ms moving curved signal between `Лента` and `Витрина`.
- Post author, metadata, media, caption, and action rhythm.
- Removed the caption/action divider.
- Consolidated feed action icons in `BlizzIcon`.
- Bottom navigation changed to icons only.
- Profile navigation now uses the shared glyph instead of an avatar.
- Added one animated continuous signal line above the active bottom destination.
- Added centered PWA app containment with a 430 px maximum width.

## UI Elements Intentionally Not Changed

- Backend routes and response shapes.
- Home API requests and state transitions.
- Account, post, offer, story, comments, share, and save callbacks.
- The order and destinations of bottom navigation.
- Story viewer, comments sheet, and share sheet behavior.
- Central create-flow contents.
- Feed and showcase data models.

## Moving Signal Behavior

- One 48 px curve moves between calculated tab centers.
- Standard duration is 240 ms with cubic ease-in-out.
- The central create curve is slightly deeper.
- Initial position is set without entrance animation.
- Rapid changes stop the current transition and move toward the latest target.
- Reduced-motion mode sets the destination immediately.
- The signal does not alter tab positions, touch targets, bar height, or safe area.
- The navigation surface is composed from two animated white side segments and
  a center fill whose top edge follows the curve. The straight divider is
  rendered as two line segments with a real gap beneath the curve. This keeps
  the surface attached to the line without a rectangular patch or a transparent
  strip across the full navigation width.

## Mobile Behavior

Required visual widths:

- 360 px
- 390 px
- 430 px

Implemented constraints:

- 16 px horizontal Home grid.
- 44 px minimum header and feed-action targets.
- Compact Blizz row without a section title.
- Current-user Blizz does not reserve a caption row.
- Stable icon-only navigation.
- Compact approximately 50 px bottom navigation with 44 px press targets.
- Post media uses a stable aspect ratio instead of a fixed 280 px height.

## Web/PWA Behavior

Required desktop widths:

- 1280 x 800
- 1440 x 900

Implemented constraints:

- `AppRoot` uses a centered 430 px web shell.
- The outer page uses a neutral background.
- Home, bottom navigation, and sheets remain inside the mobile rail.
- Media does not stretch to desktop width.

## Automated Checks

- `npm run check` in `server`: passed.
- `npm run typecheck` in `mobile`: passed.
- `npx expo export --platform web` in `mobile`: passed.
- Backend health endpoint: HTTP 200.
- Expo web page: HTTP 200 after restart.
- Expo development bundle: HTTP 200.
- Grep confirmed no legacy text-symbol action icons in Home/MainTabs.
- Grep confirmed no bottom-navigation text-label rendering.
- Grep confirmed no post caption/action divider rendering.

## Visual QA Limitation

The in-app browser displayed the local app before the implementation. After the
change, automated reload and screenshot access were blocked by the browser URL
policy for the existing localhost tab. No alternate browser or policy bypass
was used.

The selected reference and implementation therefore still require a final
manual visual observation in the already-open in-app browser at 390 px and
desktop width. This limitation prevents claiming a completed pixel-level
reference match in this note.

## Known Limitations

- The generated reference is an art-direction target, not an exact typography
  source file.
- The current Blizz wordmark remains text rather than a finalized brand asset.
- Existing empty-state illustrations still use their prior local SVG artwork.
- Final motion quality must be observed interactively because static export
  checks cannot validate the moving curve.

## Reference Match Status

Implementation structure matches the approved City Signal requirements:

- no Blizz section title;
- current-user Blizz first with a small plus;
- no post tag row;
- no divider between caption and post actions;
- icon-only bottom navigation;
- animated active-tab signal.

Pixel-level visual approval remains pending manual observation.
