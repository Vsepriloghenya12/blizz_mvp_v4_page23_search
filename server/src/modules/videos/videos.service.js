const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { canViewAccountContent } = require('../follows/follows.service');
const { createNotification } = require('../notifications/notifications.service');

const VIDEO_CREATOR_ROLES = new Set(['owner', 'admin', 'smm']);
const VISIBILITY_VALUES = new Set(['public', 'followers', 'close_friends', 'selected']);

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getActiveAccountContext(state, userId, activeAccountId) {
  const membership = state.accountMemberships.find((item) => {
    return item.userId === userId && item.accountId === activeAccountId && item.status === 'active';
  });

  if (!membership) {
    throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к активному аккаунту');
  }

  const account = state.accounts.find((item) => item.id === activeAccountId && item.status !== 'archived');
  if (!account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }

  return { account, membership };
}

function assertCanCreateVideo(account, membership) {
  if (account.type === 'personal') return;
  if (account.type === 'business' && VIDEO_CREATOR_ROLES.has(membership.role)) return;
  throw new HttpError(403, 'VIDEO_CREATE_FORBIDDEN', 'Нет доступа к созданию видео');
}

function validateUrl(value, code, message) {
  const url = sanitizeString(value);
  if (!url) {
    throw new HttpError(400, code, message);
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
    return parsed.toString();
  } catch (_error) {
    throw new HttpError(400, code, message);
  }
}

function normalizeLocation(input) {
  if (!input || typeof input !== 'object') return null;

  const title = sanitizeString(input.title);
  const address = sanitizeString(input.address);
  if (!title && !address) return null;

  if (title.length > 80) {
    throw new HttpError(400, 'LOCATION_TITLE_TOO_LONG', 'Название места должно быть не длиннее 80 символов');
  }

  if (address.length > 160) {
    throw new HttpError(400, 'LOCATION_ADDRESS_TOO_LONG', 'Адрес места должен быть не длиннее 160 символов');
  }

  return {
    title,
    address,
    lat: typeof input.lat === 'number' ? input.lat : null,
    lng: typeof input.lng === 'number' ? input.lng : null,
    precision: input.precision === 'area' ? 'area' : 'exact'
  };
}

function normalizeVideoInput(input) {
  const payload = input || {};
  const videoUrl = validateUrl(payload.videoUrl, 'VIDEO_URL_INVALID', 'Добавьте корректную ссылку на видео');
  const coverUrl = validateUrl(payload.coverUrl, 'VIDEO_COVER_REQUIRED', 'Добавьте корректную ссылку на обложку');
  const description = sanitizeString(payload.description);
  const visibility = sanitizeString(payload.visibility) || 'public';
  const soundTitle = sanitizeString(payload.soundTitle) || 'Оригинальный звук';

  if (description.length > 2200) {
    throw new HttpError(400, 'VIDEO_DESCRIPTION_TOO_LONG', 'Описание видео должно быть не длиннее 2200 символов');
  }

  if (!VISIBILITY_VALUES.has(visibility)) {
    throw new HttpError(400, 'VIDEO_VISIBILITY_INVALID', 'Выберите видимость видео');
  }

  if (soundTitle.length > 80) {
    throw new HttpError(400, 'VIDEO_SOUND_TOO_LONG', 'Название звука должно быть не длиннее 80 символов');
  }

  return {
    videoUrl,
    coverUrl,
    description,
    location: normalizeLocation(payload.location),
    visibility,
    soundTitle
  };
}

function publicAuthor(account, businessProfile) {
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    businessCategory: businessProfile ? businessProfile.category : null
  };
}

function publicVideo(video) {
  return {
    id: video.id,
    accountId: video.accountId,
    status: video.status,
    videoUrl: video.videoUrl,
    coverUrl: video.coverUrl,
    description: video.description,
    location: video.location,
    visibility: video.visibility,
    soundTitle: video.soundTitle,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    publishedAt: video.publishedAt || null
  };
}

function publicFeedVideo(state, video, viewerAccountId) {
  const author = state.accounts.find((account) => account.id === video.accountId);
  if (!author) return null;

  const businessProfile = author.type === 'business'
    ? state.businessProfiles.find((profile) => profile.accountId === author.id)
    : null;

  const likes = (state.videoLikes || []).filter((like) => like.videoId === video.id && like.status === 'active');
  const savedItems = (state.savedItems || []).filter((item) => {
    return item.targetType === 'video' && item.targetId === video.id && item.status === 'active';
  });

  return {
    ...publicVideo(video),
    author: publicAuthor(author, businessProfile),
    likesCount: likes.length,
    commentsCount: video.commentCount || 0,
    savesCount: savedItems.length,
    isLikedByMe: likes.some((like) => like.accountId === viewerAccountId),
    isSavedByMe: savedItems.some((item) => item.accountId === viewerAccountId)
  };
}

function createVideo({ userId, activeAccountId, input }) {
  const payload = normalizeVideoInput(input);

  return db.transaction((state) => {
    const { account, membership } = getActiveAccountContext(state, userId, activeAccountId);
    assertCanCreateVideo(account, membership);

    const now = new Date().toISOString();
    const video = {
      id: createId('video'),
      accountId: account.id,
      authorUserId: userId,
      status: 'published',
      videoUrl: payload.videoUrl,
      coverUrl: payload.coverUrl,
      description: payload.description,
      location: payload.location,
      visibility: payload.visibility,
      soundTitle: payload.soundTitle,
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: now
    };

    state.videos.push(video);
    return { video: publicVideo(video) };
  });
}

function listMyVideos({ userId, activeAccountId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);

  const videos = (state.videos || [])
    .filter((video) => video.accountId === account.id && video.status === 'published')
    .sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt)))
    .map(publicVideo);

  return { videos };
}

function listVideoFeed({ userId, activeAccountId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);

  const items = (state.videos || [])
    .filter((video) => video.status === 'published')
    .filter((video) => canViewAccountContent(state, account.id, video.accountId, video.visibility))
    .sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt)))
    .map((video) => publicFeedVideo(state, video, account.id))
    .filter(Boolean);

  return { items };
}

function getVideoDetail({ userId, activeAccountId, videoId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);
  const video = findPublishedVideo(state, videoId);
  assertCanViewVideo(state, video, account.id);

  return { video: publicFeedVideo(state, video, account.id) };
}

function findPublishedVideo(state, videoId) {
  const video = (state.videos || []).find((item) => item.id === videoId && item.status === 'published');
  if (!video) {
    throw new HttpError(404, 'VIDEO_NOT_FOUND', 'Видео не найдено');
  }
  return video;
}

function assertCanViewVideo(state, video, viewerAccountId) {
  if (!canViewAccountContent(state, viewerAccountId, video.accountId, video.visibility)) {
    throw new HttpError(403, 'VIDEO_ACCESS_DENIED', 'Видео недоступно');
  }
}

function toggleVideoLike({ userId, activeAccountId, videoId }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const video = findPublishedVideo(state, videoId);
    const now = new Date().toISOString();

    const existing = (state.videoLikes || []).find((like) => like.videoId === video.id && like.accountId === account.id);
    let isLikedByMe;

    if (existing && existing.status === 'active') {
      existing.status = 'removed';
      existing.updatedAt = now;
      isLikedByMe = false;
    } else if (existing) {
      existing.status = 'active';
      existing.updatedAt = now;
      isLikedByMe = true;
    } else {
      state.videoLikes = state.videoLikes || [];
      state.videoLikes.push({
        id: createId('video_like'),
        videoId: video.id,
        accountId: account.id,
        userId,
        status: 'active',
        createdAt: now,
        updatedAt: now
      });
      isLikedByMe = true;
    }

    const likesCount = (state.videoLikes || []).filter((like) => like.videoId === video.id && like.status === 'active').length;
    video.likeCount = likesCount;
    video.updatedAt = now;

    if (isLikedByMe) {
      createNotification(state, {
        accountId: video.accountId,
        type: 'video_like',
        title: `${account.name} отметил ваше видео`,
        body: 'Новая отметка “Нравится”',
        targetType: 'video',
        targetId: video.id,
        actorAccountId: account.id
      });
    }

    return { videoId: video.id, likesCount, isLikedByMe };
  });
}

function toggleVideoSave({ userId, activeAccountId, videoId }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const video = findPublishedVideo(state, videoId);
    const now = new Date().toISOString();

    const existing = (state.savedItems || []).find((item) => {
      return item.accountId === account.id && item.targetType === 'video' && item.targetId === video.id;
    });
    let isSavedByMe;

    if (existing && existing.status === 'active') {
      existing.status = 'removed';
      existing.updatedAt = now;
      isSavedByMe = false;
    } else if (existing) {
      existing.status = 'active';
      existing.updatedAt = now;
      isSavedByMe = true;
    } else {
      state.savedItems.push({
        id: createId('saved'),
        accountId: account.id,
        userId,
        targetType: 'video',
        targetId: video.id,
        status: 'active',
        createdAt: now,
        updatedAt: now
      });
      isSavedByMe = true;
    }

    const savesCount = (state.savedItems || []).filter((item) => {
      return item.targetType === 'video' && item.targetId === video.id && item.status === 'active';
    }).length;
    video.saveCount = savesCount;
    video.updatedAt = now;

    return { videoId: video.id, savesCount, isSavedByMe };
  });
}

module.exports = {
  createVideo,
  listMyVideos,
  listVideoFeed,
  getVideoDetail,
  toggleVideoLike,
  toggleVideoSave
};
