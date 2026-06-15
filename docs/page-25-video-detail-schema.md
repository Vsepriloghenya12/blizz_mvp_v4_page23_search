# Page 25 — Video detail schema

## Backend

Added `GET /api/videos/:videoId`.

Response:

```json
{
  "video": {
    "id": "video_id",
    "accountId": "account_id",
    "status": "published",
    "videoUrl": "https://example.com/video.mp4",
    "coverUrl": "https://example.com/cover.jpg",
    "description": "Video text",
    "location": null,
    "visibility": "public",
    "soundTitle": "Original sound",
    "createdAt": "ISO",
    "updatedAt": "ISO",
    "publishedAt": "ISO",
    "author": {
      "id": "account_id",
      "type": "personal",
      "name": "Name",
      "username": "username",
      "avatar": null,
      "businessCategory": null
    },
    "likesCount": 0,
    "commentsCount": 0,
    "savesCount": 0,
    "isLikedByMe": false,
    "isSavedByMe": false
  }
}
```

Access is checked from the session token and `activeAccountId`. Private and followers-only videos use the existing follow graph helper.

## Mobile

Added `VideoDetailScreen`.

Connected entry points:

- video feed item;
- search video result and recent video search;
- saved video item;
- map video object;
- personal profile video card;
- business profile video card;
- public profile video card.

Not added: new bottom tab, recommendations, comments UI for videos, share sheet duplication, new media player dependency, visual redesign.
