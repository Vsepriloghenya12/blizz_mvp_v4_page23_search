const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { canViewAccountContent } = require('../follows/follows.service');

const MAP_FILTERS = new Set(['all', 'post', 'video', 'story', 'business', 'offer', 'saved']);
const OFFER_TYPE_LABELS = {
  promo: 'Акция',
  product: 'Товар',
  service: 'Услуга',
  event: 'Событие'
};

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

function getBusinessProfile(state, accountId) {
  return (state.businessProfiles || []).find((profile) => profile.accountId === accountId) || null;
}

function normalizeLocation(location) {
  if (!location || typeof location !== 'object') return null;
  const title = typeof location.title === 'string' ? location.title.trim() : '';
  const address = typeof location.address === 'string' ? location.address.trim() : '';
  if (!title && !address) return null;
  return {
    title,
    address,
    lat: typeof location.lat === 'number' ? location.lat : null,
    lng: typeof location.lng === 'number' ? location.lng : null,
    precision: location.precision === 'area' ? 'area' : 'exact'
  };
}

function locationFromAddress(title, address) {
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanAddress = typeof address === 'string' ? address.trim() : '';
  if (!cleanTitle && !cleanAddress) return null;
  return {
    title: cleanTitle,
    address: cleanAddress,
    lat: null,
    lng: null,
    precision: 'exact'
  };
}

function canViewPublicContent(state, item, viewerAccountId) {
  if (!item) return false;
  const ownerAccountId = item.accountId || item.businessAccountId;
  if (!ownerAccountId) return false;
  return canViewAccountContent(state, viewerAccountId, ownerAccountId, item.visibility || 'public');
}

function isActiveStory(story) {
  if (!story || story.status !== 'active') return false;
  const expiresMs = Date.parse(story.expiresAt || '');
  return Number.isFinite(expiresMs) && expiresMs > Date.now();
}

function isOfferActive(offer) {
  if (!offer || offer.status !== 'active') return false;
  if (!offer.expiresAt) return true;
  return Date.parse(offer.expiresAt) > Date.now();
}

function isSaved(state, viewerAccountId, targetType, targetId) {
  return (state.savedItems || []).some((item) => {
    return item.accountId === viewerAccountId && item.targetType === targetType && item.targetId === targetId && item.status === 'active';
  });
}

function savedTargets(state, viewerAccountId) {
  const set = new Set();
  (state.savedItems || [])
    .filter((item) => item.accountId === viewerAccountId && item.status === 'active')
    .forEach((item) => set.add(`${item.targetType}:${item.targetId}`));
  return set;
}

function accountById(state, accountId) {
  return state.accounts.find((account) => account.id === accountId && account.status !== 'archived') || null;
}

function postToMapObject(state, post, viewerAccountId) {
  const location = normalizeLocation(post.location);
  if (!location) return null;
  if (post.status !== 'published') return null;
  if (!canViewPublicContent(state, post, viewerAccountId)) return null;

  const author = accountById(state, post.accountId);
  if (!author) return null;
  const businessProfile = author.type === 'business' ? getBusinessProfile(state, author.id) : null;
  const imageUrl = Array.isArray(post.media) && post.media[0] ? post.media[0].url : null;

  return {
    id: `post_${post.id}`,
    type: 'post',
    contentId: post.id,
    title: author.type === 'business' ? 'Бизнес-пост' : 'Пост',
    subtitle: location.title || location.address,
    description: post.text || 'Пост без текста',
    imageUrl,
    location,
    author: publicAuthor(author, businessProfile),
    createdAt: post.publishedAt || post.createdAt,
    isSavedByMe: isSaved(state, viewerAccountId, 'post', post.id),
    actions: {
      canOpen: false,
      canRoute: Boolean(location.address || location.title),
      canSave: true,
      canShare: false
    }
  };
}

function videoToMapObject(state, video, viewerAccountId) {
  const location = normalizeLocation(video.location);
  if (!location) return null;
  if (video.status !== 'published') return null;
  if (!canViewPublicContent(state, video, viewerAccountId)) return null;

  const author = accountById(state, video.accountId);
  if (!author) return null;
  const businessProfile = author.type === 'business' ? getBusinessProfile(state, author.id) : null;

  return {
    id: `video_${video.id}`,
    type: 'video',
    contentId: video.id,
    title: 'Видео',
    subtitle: location.title || location.address,
    description: video.description || 'Видео без описания',
    imageUrl: video.coverUrl || null,
    location,
    author: publicAuthor(author, businessProfile),
    createdAt: video.publishedAt || video.createdAt,
    isSavedByMe: isSaved(state, viewerAccountId, 'video', video.id),
    actions: {
      canOpen: true,
      canRoute: Boolean(location.address || location.title),
      canSave: true,
      canShare: false
    }
  };
}

function storyToMapObject(state, story, viewerAccountId) {
  const location = normalizeLocation(story.location);
  if (!location) return null;
  if (!isActiveStory(story)) return null;
  if (!canViewPublicContent(state, story, viewerAccountId)) return null;

  const author = accountById(state, story.accountId);
  if (!author) return null;
  const businessProfile = author.type === 'business' ? getBusinessProfile(state, author.id) : null;

  return {
    id: `story_${story.id}`,
    type: 'story',
    contentId: story.id,
    title: 'Близз',
    subtitle: location.title || location.address,
    description: story.text || 'Активный Близз',
    imageUrl: story.mediaType === 'image' ? story.mediaUrl : null,
    location,
    author: publicAuthor(author, businessProfile),
    createdAt: story.createdAt,
    isSavedByMe: false,
    actions: {
      canOpen: false,
      canRoute: Boolean(location.address || location.title),
      canSave: true,
      canShare: false
    }
  };
}

function businessToMapObject(state, account, viewerAccountId) {
  if (!account || account.type !== 'business' || account.status === 'archived') return null;
  if (!canViewAccountContent(state, viewerAccountId, account.id, 'public')) return null;
  const profile = getBusinessProfile(state, account.id);
  const location = locationFromAddress(account.name, profile ? profile.address : '');
  if (!location) return null;

  return {
    id: `business_${account.id}`,
    type: 'business',
    contentId: account.id,
    title: account.name,
    subtitle: profile ? profile.category || 'Бизнес' : 'Бизнес',
    description: profile ? profile.description || profile.address || '' : '',
    imageUrl: account.avatar || null,
    location,
    author: publicAuthor(account, profile),
    createdAt: account.createdAt,
    isSavedByMe: false,
    actions: {
      canOpen: false,
      canRoute: Boolean(location.address || location.title),
      canSave: false,
      canShare: false
    }
  };
}

function offerToMapObject(state, offer, viewerAccountId) {
  if (!isOfferActive(offer)) return null;
  const location = normalizeLocation(offer.location) || locationFromAddress(offer.title, offer.address);
  if (!location) return null;

  const business = accountById(state, offer.businessAccountId);
  if (!business) return null;
  if (!canViewAccountContent(state, viewerAccountId, business.id, 'public')) return null;
  const businessProfile = getBusinessProfile(state, business.id);

  return {
    id: `offer_${offer.id}`,
    type: 'offer',
    contentId: offer.id,
    title: offer.title,
    subtitle: `${OFFER_TYPE_LABELS[offer.type] || offer.type} · ${business.name}`,
    description: offer.priceOrCondition || offer.description || '',
    imageUrl: offer.coverUrl || null,
    location,
    author: publicAuthor(business, businessProfile),
    createdAt: offer.createdAt,
    isSavedByMe: isSaved(state, viewerAccountId, 'offer', offer.id),
    actions: {
      canOpen: true,
      canRoute: Boolean(location.address || location.title),
      canSave: true,
      canShare: false
    }
  };
}

function buildObjects(state, viewerAccountId) {
  return [
    ...(state.posts || []).map((post) => postToMapObject(state, post, viewerAccountId)),
    ...(state.videos || []).map((video) => videoToMapObject(state, video, viewerAccountId)),
    ...(state.stories || []).map((story) => storyToMapObject(state, story, viewerAccountId)),
    ...(state.accounts || []).map((account) => businessToMapObject(state, account, viewerAccountId)),
    ...(state.offers || []).map((offer) => offerToMapObject(state, offer, viewerAccountId))
  ].filter(Boolean);
}

function listMapObjects({ userId, activeAccountId, filter }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);
  const safeFilter = MAP_FILTERS.has(filter) ? filter : 'all';
  const saved = savedTargets(state, account.id);

  let items = buildObjects(state, account.id);

  if (safeFilter === 'saved') {
    items = items.filter((item) => saved.has(`${item.type}:${item.contentId}`));
  } else if (safeFilter !== 'all') {
    items = items.filter((item) => item.type === safeFilter);
  }

  items.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  return { filter: safeFilter, items };
}

module.exports = { listMapObjects };
