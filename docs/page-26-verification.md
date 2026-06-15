# Page 26 — Verification

Checks run:

- server `node page26-smoke-test.js`;
- server `npm run check`;
- mobile `npm run typecheck`;
- mobile `npx expo export --platform web`.

Smoke test covers:

- public active story detail can be opened by another account;
- response includes author, view count and viewer state;
- view state is reflected by the detail endpoint after marking a view;
- followers-only story from a private account is denied to a non-follower.
