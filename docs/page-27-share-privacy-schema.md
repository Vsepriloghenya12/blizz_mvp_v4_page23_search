# Page 27 — Share privacy alignment

## Backend

Updated `POST /api/share/post` to use the shared follow graph access helper.

Rules:

- sender must be able to view the post from their current `activeAccountId`;
- target account must also be able to view the post;
- public posts can still be shared normally;
- followers-only/private posts cannot be leaked to a target account without accepted access.

No API route or response shape was changed.

Not added: video sharing, story sharing, new share UI, new recipients model, external sharing changes.
