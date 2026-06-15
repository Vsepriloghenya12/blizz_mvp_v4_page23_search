# Page 25 — Verification

Checks run:

- server `node page25-smoke-test.js`;
- server `npm run check`;
- mobile `npm run typecheck`;
- mobile `npx expo export --platform web`.

Smoke test covers:

- public video detail can be opened by another account;
- response includes author, counters and viewer state;
- like state is reflected by the detail endpoint;
- followers-only video from a private account is denied to a non-follower.
