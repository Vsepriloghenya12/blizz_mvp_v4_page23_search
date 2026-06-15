const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { canViewAccountContent } = require('../follows/follows.service');

const TARGET_TYPES = new Set(['post', 'video', 'offer', 'business']);
const SAVED_FILTERS = new Set(['all', 'post', 'video', 'offer', 'business']);
const SAVED_CATEGORIES = new Set(['want_to_go', 'visited', 'favorite', 'offers', 'routes']);
const OFFER_TYPE_LABELS = {
  promo: 'Акция',
  product: 'Товар',
  service: 'Услуга',
  event: 'Событие'
};

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

function accountById(state, accountId) {
  return state.accounts.find((account) => account.id === accountId && account.status !== 'archived') || null;
}

function getBusinessProfile(state, accountId) {
  return (state.businessProfiles || []).find((profile) => profile.accountId === accountId) || null;
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

function normalizeLocation(location) {
  if (!location || typeof location !== 'object') return null;
  const title = sanitizeString(location.title);
  const address = sanitizeString(location.address);
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
  const cleanTitle = sanitizeString(title);
  const cleanAddress = sanitizeString(address);
  if (!cleanTitle && !cleanAddress) return null;
  return {
    title: cleanTitle,
    address: cleanAddress,
    lat: null,
    lng: null,
    precision: 'exact'
  };
}

function isOfferActive(offer) {
  if (!offer || offer.status !== 'active') return false;
  if (!offer.expiresAt) return true;
  return Date.parse(offer.expiresAt) > Date.now();
}

function canViewItem(state, item, viewerAccountId) {
  if (!item) return false;
  const ownerAccountId = item.accountId || item.businessAccountId;
  if (!ownerAccountId) return false;
  return canViewAccountContent(state, viewerAccountId, ownerAccountId, item.visibility || 'public');
}

function assertTargetExistsAndVisible(state, viewerAccountId, targetType, targetId) {
  if (targetType === 'post') {
    const post = (state.posts || []).find((item) => item.id === targetId && item.status === 'published');
    if (!post || !canViewItem(state, post, viewerAccountId)) {
      throw new HttpError(404, 'SAVE_TARGET_NOT_FOUND', 'Объект не найден или недоступен');
    }
    return post;
  }

  if (targetType === 'video') {
    const video = (state.videos || []).find((item) => item.id === targetId && item.status === 'published');
    if (!video || !canViewItem(state, video, viewerAccountId)) {
      throw new HttpError(404, 'SAVE_TARGET_NOT_FOUND', 'Объект не найден или недоступен');
    }
    return video;
  }

  if (targetType === 'offer') {
    const offer = (state.offers || []).find((item) => item.id === targetId && item.status !== 'archived');
    if (!offer || !isOfferActive(offer) || !canViewItem(state, offer, viewerAccountId)) {
      throw new HttpError(404, 'SAVE_TARGET_NOT_FOUND', 'Объект не найден или недоступен');
    }
    return offer;
  }

  if (targetType === 'business') {
    const business = (state.accounts || []).find((item) => item.id === targetId && item.type === 'business' && item.status !== 'archived');
    if (!business || !canViewAccountContent(state, viewerAccountId, business.id, 'public')) {
      throw new HttpError(404, 'SAVE_TARGET_NOT_FOUND', 'Объект не найден или недоступен');
    }
    return business;
  }

  throw new HttpError(400, 'SAVE_TARGET_TYPE_INVALID', 'Неподдерживаемый тип сохранения');
}

function updateTargetSaveCount(state, targetType, targetId) {
  const count = (state.savedItems || []).filter((item) => {
    return item.targetType === targetType && item.targetId === targetId && item.status === 'active';
  }).length;

  if (targetType === 'post') {
    const post = (state.posts || []).find((item) => item.id === targetId);
    if (post) post.saveCount = count;
  }

  if (targetType === 'video') {
    const video = (state.videos || []).find((item) => item.id === targetId);
    if (video) video.saveCount = count;
  }

  return count;
}

function saveObject({ userId, activeAccountId, input }) {
  const payload = input || {};
  const targetType = sanitizeString(payload.targetType);
  const targetId = sanitizeString(payload.targetId);
  const category = SAVED_CATEGORIES.has(sanitizeString(payload.category)) ? sanitizeString(payload.category) : 'want_to_go';

  if (!TARGET_TYPES.has(targetType)) {
    throw new HttpError(400, 'SAVE_TARGET_TYPE_INVALID', 'Выберите корректный тип объекта');
  }

  if (!targetId) {
    throw new HttpError(400, 'SAVE_TARGET_ID_REQUIRED', 'Не указан объект для сохранения');
  }

  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    assertTargetExistsAndVisible(state, account.id, targetType, targetId);

    const now = new Date().toISOString();
    const existing = (state.savedItems || []).find((item) => {
      return item.accountId === account.id && item.targetType === targetType && item.targetId === targetId;
    });

    if (existing) {
      existing.status = 'active';
      existing.category = existing.category || category;
      existing.updatedAt = now;
      const savesCount = updateTargetSaveCount(state, targetType, targetId);
      return { saved: publicSavedItem(state, existing, account.id), savesCount };
    }

    state.savedItems = state.savedItems || [];
    const saved = {
      id: createId('saved'),
      accountId: account.id,
      userId,
      targetType,
      targetId,
      category,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };
    state.savedItems.push(saved);
    const savesCount = updateTargetSaveCount(state, targetType, targetId);
    return { saved: publicSavedItem(state, saved, account.id), savesCount };
  });
}

function removeSavedObject({ userId, activeAccountId, targetType, targetId }) {
  const safeTargetType = sanitizeString(targetType);
  const safeTargetId = sanitizeString(targetId);

  if (!TARGET_TYPES.has(safeTargetType)) {
    throw new HttpError(400, 'SAVE_TARGET_TYPE_INVALID', 'Выберите корректный тип объекта');
  }

  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const saved = (state.savedItems || []).find((item) => {
      return item.accountId === account.id && item.targetType === safeTargetType && item.targetId === safeTargetId && item.status === 'active';
    });

    if (!saved) {
      throw new HttpError(404, 'SAVED_ITEM_NOT_FOUND', 'Сохранённый объект не найден');
    }

    const now = new Date().toISOString();
    saved.status = 'removed';
    saved.updatedAt = now;
    saved.removedAt = now;
    const savesCount = updateTargetSaveCount(state, safeTargetType, safeTargetId);

    return { targetType: safeTargetType, targetId: safeTargetId, removed: true, savesCount };
  });
}

function postToSavedObject(state, post, saved) {
  if (!post || post.status !== 'published') return null;
  const author = accountById(state, post.accountId);
  if (!author) return null;
  const businessProfile = author.type === 'business' ? getBusinessProfile(state, author.id) : null;
  const imageUrl = Array.isArray(post.media) && post.media[0] ? post.media[0].url : null;
  const location = normalizeLocation(post.location);

  return {
    id: saved.id,
    targetType: 'post',
    targetId: post.id,
    category: saved.category || 'want_to_go',
    title: author.type === 'business' ? 'Бизнес-пост' : 'Пост',
    subtitle: author.name,
    description: post.text || 'Пост без текста',
    imageUrl,
    location,
    author: publicAuthor(author, businessProfile),
    createdAt: post.publishedAt || post.createdAt,
    savedAt: saved.createdAt,
    actions: {
      canOpen: false,
      canRoute: Boolean(location && (location.title || location.address)),
      canShare: false,
      canRemove: true
    }
  };
}

function videoToSavedObject(state, video, saved) {
  if (!video || video.status !== 'published') return null;
  const author = accountById(state, video.accountId);
  if (!author) return null;
  const businessProfile = author.type === 'business' ? getBusinessProfile(state, author.id) : null;
  const location = normalizeLocation(video.location);

  return {
    id: saved.id,
    targetType: 'video',
    targetId: video.id,
    category: saved.category || 'want_to_go',
    title: 'Видео',
    subtitle: author.name,
    description: video.description || 'Видео без описания',
    imageUrl: video.coverUrl || null,
    location,
    author: publicAuthor(author, businessProfile),
    createdAt: video.publishedAt || video.createdAt,
    savedAt: saved.createdAt,
    actions: {
      canOpen: true,
      canRoute: Boolean(location && (location.title || location.address)),
      canShare: false,
      canRemove: true
    }
  };
}

function offerToSavedObject(state, offer, saved) {
  if (!offer || !isOfferActive(offer)) return null;
  const business = accountById(state, offer.businessAccountId);
  if (!business) return null;
  const businessProfile = getBusinessProfile(state, business.id);
  const location = normalizeLocation(offer.location) || locationFromAddress(offer.title, offer.address);

  return {
    id: saved.id,
    targetType: 'offer',
    targetId: offer.id,
    category: saved.category || 'offers',
    title: offer.title,
    subtitle: `${OFFER_TYPE_LABELS[offer.type] || offer.type} · ${business.name}`,
    description: offer.priceOrCondition || offer.description || '',
    imageUrl: offer.coverUrl || null,
    location,
    author: publicAuthor(business, businessProfile),
    createdAt: offer.createdAt,
    savedAt: saved.createdAt,
    actions: {
      canOpen: true,
      canRoute: Boolean(location && (location.title || location.address)),
      canShare: false,
      canRemove: true
    }
  };
}

function businessToSavedObject(state, business, saved) {
  if (!business || business.type !== 'business' || business.status === 'archived') return null;
  const profile = getBusinessProfile(state, business.id);
  const location = locationFromAddress(business.name, profile ? profile.address : '');

  return {
    id: saved.id,
    targetType: 'business',
    targetId: business.id,
    category: saved.category || 'want_to_go',
    title: business.name,
    subtitle: profile ? profile.category || 'Бизнес' : 'Бизнес',
    description: profile ? profile.description || profile.address || '' : '',
    imageUrl: business.avatar || null,
    location,
    author: publicAuthor(business, profile),
    createdAt: business.createdAt,
    savedAt: saved.createdAt,
    actions: {
      canOpen: false,
      canRoute: Boolean(location && (location.title || location.address)),
      canShare: false,
      canRemove: true
    }
  };
}

function publicSavedItem(state, saved, viewerAccountId) {
  if (!saved || saved.status !== 'active') return null;
  if (saved.targetType === 'post') {
    const post = (state.posts || []).find((item) => item.id === saved.targetId);
    if (!post || !canViewItem(state, post, viewerAccountId)) return null;
    return postToSavedObject(state, post, saved);
  }
  if (saved.targetType === 'video') {
    const video = (state.videos || []).find((item) => item.id === saved.targetId);
    if (!video || !canViewItem(state, video, viewerAccountId)) return null;
    return videoToSavedObject(state, video, saved);
  }
  if (saved.targetType === 'offer') {
    const offer = (state.offers || []).find((item) => item.id === saved.targetId);
    if (!offer || !canViewItem(state, offer, viewerAccountId)) return null;
    return offerToSavedObject(state, offer, saved);
  }
  if (saved.targetType === 'business') {
    const business = accountById(state, saved.targetId);
    if (!business || !canViewAccountContent(state, viewerAccountId, business.id, 'public')) return null;
    return businessToSavedObject(state, business, saved);
  }
  return null;
}

function listSaved({ userId, activeAccountId, filter }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);
  const safeFilter = SAVED_FILTERS.has(filter) ? filter : 'all';

  const items = (state.savedItems || [])
    .filter((item) => item.accountId === account.id && item.status === 'active')
    .filter((item) => safeFilter === 'all' ? true : item.targetType === safeFilter)
    .map((item) => publicSavedItem(state, item, account.id))
    .filter(Boolean)
    .sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')));

  return { filter: safeFilter, items };
}

module.exports = {
  listSaved,
  removeSavedObject,
  saveObject,
  publicSavedItem
};
