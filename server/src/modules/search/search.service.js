const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { canViewAccountContent } = require('../follows/follows.service');

const SEARCH_TYPES = new Set(['all', 'people', 'business', 'places', 'offers', 'posts', 'videos']);
const RECENT_TARGET_TYPES = new Set(['query', 'person', 'business', 'place', 'offer', 'post', 'video']);

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeQuery(value) {
  return sanitizeString(value).toLowerCase();
}

function includesQuery(fields, query) {
  if (!query) return false;
  return fields.some((field) => String(field || '').toLowerCase().includes(query));
}

function getActiveAccountContext(state, userId, activeAccountId) {
  const membership = (state.accountMemberships || []).find((item) => {
    return item.userId === userId && item.accountId === activeAccountId && item.status === 'active';
  });
  if (!membership) throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к активному аккаунту');

  const account = (state.accounts || []).find((item) => item.id === activeAccountId && item.status !== 'archived');
  if (!account) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  return { account, membership };
}

function accountById(state, accountId) {
  return (state.accounts || []).find((account) => account.id === accountId && account.status !== 'archived') || null;
}

function businessProfileFor(state, accountId) {
  return (state.businessProfiles || []).find((profile) => profile.accountId === accountId) || null;
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
  return { title: cleanTitle, address: cleanAddress, lat: null, lng: null, precision: 'exact' };
}

function publicAuthor(state, accountId) {
  const account = accountById(state, accountId);
  if (!account) return null;
  const profile = businessProfileFor(state, account.id);
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    businessCategory: profile ? profile.category : null
  };
}

function accountResult(state, account, viewerAccountId) {
  if (!canViewAccountContent(state, viewerAccountId, account.id, 'public')) return null;
  const profile = businessProfileFor(state, account.id);
  const isBusiness = account.type === 'business';
  return {
    id: `${isBusiness ? 'business' : 'person'}_${account.id}`,
    type: isBusiness ? 'business' : 'person',
    targetType: isBusiness ? 'business' : 'person',
    targetId: account.id,
    title: account.name,
    subtitle: isBusiness ? `${profile ? profile.category || 'Бизнес' : 'Бизнес'} · @${account.username}` : `@${account.username}`,
    description: isBusiness ? (profile ? profile.address || profile.description || '' : '') : (account.bio || account.city || ''),
    imageUrl: account.avatar || (profile ? profile.logo || null : null),
    accountId: account.id,
    offerId: null,
    postId: null,
    videoId: null,
    location: isBusiness ? locationFromAddress(account.name, profile ? profile.address : '') : null,
    createdAt: account.createdAt
  };
}

function isOfferActive(offer) {
  if (!offer || offer.status !== 'active') return false;
  if (!offer.expiresAt) return true;
  return Date.parse(offer.expiresAt) > Date.now();
}

function offerResult(state, offer, viewerAccountId) {
  if (!isOfferActive(offer)) return null;
  const business = accountById(state, offer.businessAccountId);
  if (!business) return null;
  if (!canViewAccountContent(state, viewerAccountId, business.id, 'public')) return null;
  const profile = businessProfileFor(state, business.id);
  return {
    id: `offer_${offer.id}`,
    type: 'offer',
    targetType: 'offer',
    targetId: offer.id,
    title: offer.title,
    subtitle: `${business.name} · ${offer.priceOrCondition || 'Предложение'}`,
    description: offer.description || offer.address || '',
    imageUrl: offer.coverUrl || null,
    accountId: business.id,
    offerId: offer.id,
    postId: null,
    videoId: null,
    location: normalizeLocation(offer.location) || locationFromAddress(offer.title, offer.address || (profile ? profile.address : '')),
    createdAt: offer.createdAt
  };
}

function postResult(state, post, viewerAccountId) {
  if (!post || post.status !== 'published') return null;
  if (!canViewAccountContent(state, viewerAccountId, post.accountId, post.visibility || 'public')) return null;
  const author = publicAuthor(state, post.accountId);
  if (!author) return null;
  const location = normalizeLocation(post.location);
  return {
    id: `post_${post.id}`,
    type: 'post',
    targetType: 'post',
    targetId: post.id,
    title: post.text ? post.text.slice(0, 80) : 'Пост',
    subtitle: `${author.name} · @${author.username}`,
    description: location ? [location.title, location.address].filter(Boolean).join(' · ') : '',
    imageUrl: Array.isArray(post.media) && post.media[0] ? post.media[0].url : null,
    accountId: author.id,
    offerId: null,
    postId: post.id,
    videoId: null,
    location,
    createdAt: post.publishedAt || post.createdAt
  };
}

function videoResult(state, video, viewerAccountId) {
  if (!video || video.status !== 'published') return null;
  if (!canViewAccountContent(state, viewerAccountId, video.accountId, video.visibility || 'public')) return null;
  const author = publicAuthor(state, video.accountId);
  if (!author) return null;
  const location = normalizeLocation(video.location);
  return {
    id: `video_${video.id}`,
    type: 'video',
    targetType: 'video',
    targetId: video.id,
    title: video.description ? video.description.slice(0, 80) : 'Видео',
    subtitle: `${author.name} · @${author.username}`,
    description: location ? [location.title, location.address].filter(Boolean).join(' · ') : video.soundTitle || '',
    imageUrl: video.coverUrl || null,
    accountId: author.id,
    offerId: null,
    postId: null,
    videoId: video.id,
    location,
    createdAt: video.publishedAt || video.createdAt
  };
}

function placeResult(key, title, address, sourceType, sourceId, accountId, createdAt) {
  const safeTitle = sanitizeString(title) || sanitizeString(address) || 'Место';
  const safeAddress = sanitizeString(address);
  return {
    id: `place_${key}`,
    type: 'place',
    targetType: 'place',
    targetId: `${sourceType}:${sourceId}`,
    title: safeTitle,
    subtitle: safeAddress || 'Геометка',
    description: sourceType === 'business' ? 'Бизнес на карте' : 'Публикации с геометкой',
    imageUrl: null,
    accountId,
    offerId: sourceType === 'offer' ? sourceId : null,
    postId: sourceType === 'post' ? sourceId : null,
    videoId: sourceType === 'video' ? sourceId : null,
    location: { title: safeTitle, address: safeAddress, lat: null, lng: null, precision: 'area' },
    createdAt
  };
}

function buildPlaceResults(state, viewerAccountId, query) {
  const seen = new Map();
  function add(location, sourceType, sourceId, accountId, createdAt) {
    if (!location) return;
    if (!includesQuery([location.title, location.address], query)) return;
    const key = `${normalizeQuery(location.title)}|${normalizeQuery(location.address)}`;
    if (!key || seen.has(key)) return;
    seen.set(key, placeResult(key.replace(/[^a-zа-я0-9|]+/gi, '_'), location.title, location.address, sourceType, sourceId, accountId, createdAt));
  }

  (state.posts || []).forEach((post) => {
    if (post.status !== 'published') return;
    if (!canViewAccountContent(state, viewerAccountId, post.accountId, post.visibility || 'public')) return;
    add(normalizeLocation(post.location), 'post', post.id, post.accountId, post.publishedAt || post.createdAt);
  });
  (state.videos || []).forEach((video) => {
    if (video.status !== 'published') return;
    if (!canViewAccountContent(state, viewerAccountId, video.accountId, video.visibility || 'public')) return;
    add(normalizeLocation(video.location), 'video', video.id, video.accountId, video.publishedAt || video.createdAt);
  });
  (state.offers || []).forEach((offer) => {
    if (!isOfferActive(offer)) return;
    if (!canViewAccountContent(state, viewerAccountId, offer.businessAccountId, 'public')) return;
    add(normalizeLocation(offer.location) || locationFromAddress(offer.title, offer.address), 'offer', offer.id, offer.businessAccountId, offer.createdAt);
  });
  (state.accounts || []).forEach((account) => {
    if (account.type !== 'business' || account.status === 'archived') return;
    if (!canViewAccountContent(state, viewerAccountId, account.id, 'public')) return;
    const profile = businessProfileFor(state, account.id);
    add(locationFromAddress(account.name, profile ? profile.address : ''), 'business', account.id, account.id, account.createdAt);
  });

  return Array.from(seen.values());
}

function listSearchResults({ userId, activeAccountId, query, type }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);
  const q = normalizeQuery(query);
  const safeType = SEARCH_TYPES.has(type) ? type : 'all';
  if (!q) return { query: '', type: safeType, results: [] };

  const results = [];

  if (safeType === 'all' || safeType === 'people' || safeType === 'business') {
    (state.accounts || [])
      .filter((target) => target.status !== 'archived')
      .filter((target) => safeType === 'business' ? target.type === 'business' : safeType === 'people' ? target.type === 'personal' : true)
      .filter((target) => target.type === 'personal' || target.type === 'business')
      .filter((target) => {
        const profile = businessProfileFor(state, target.id);
        return includesQuery([target.name, target.username, target.bio, target.city, profile && profile.category, profile && profile.address, profile && profile.description], q);
      })
      .map((target) => accountResult(state, target, account.id))
      .filter(Boolean)
      .forEach((target) => results.push(target));
  }

  if (safeType === 'all' || safeType === 'offers') {
    (state.offers || [])
      .filter(isOfferActive)
      .filter((offer) => includesQuery([offer.title, offer.description, offer.priceOrCondition, offer.address, offer.location && offer.location.title, offer.location && offer.location.address], q))
      .map((offer) => offerResult(state, offer, account.id))
      .filter(Boolean)
      .forEach((item) => results.push(item));
  }

  if (safeType === 'all' || safeType === 'posts') {
    (state.posts || [])
      .filter((post) => includesQuery([post.text, post.location && post.location.title, post.location && post.location.address], q))
      .map((post) => postResult(state, post, account.id))
      .filter(Boolean)
      .forEach((item) => results.push(item));
  }

  if (safeType === 'all' || safeType === 'videos') {
    (state.videos || [])
      .filter((video) => includesQuery([video.description, video.soundTitle, video.location && video.location.title, video.location && video.location.address], q))
      .map((video) => videoResult(state, video, account.id))
      .filter(Boolean)
      .forEach((item) => results.push(item));
  }

  if (safeType === 'all' || safeType === 'places') {
    buildPlaceResults(state, account.id, q).forEach((item) => results.push(item));
  }

  const sorted = results
    .filter(Boolean)
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aStarts = aTitle.startsWith(q) ? 1 : 0;
      const bStarts = bTitle.startsWith(q) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    })
    .slice(0, 50);

  return { query: q, type: safeType, results: sorted };
}

function listRecentSearches({ userId, activeAccountId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);
  const items = (state.recentSearches || [])
    .filter((item) => item.accountId === account.id && item.status !== 'deleted')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 20);
  return { items };
}

function addRecentSearch({ userId, activeAccountId, input }) {
  const payload = input || {};
  const query = sanitizeString(payload.query).slice(0, 80);
  const targetType = RECENT_TARGET_TYPES.has(payload.targetType) ? payload.targetType : 'query';
  const targetId = sanitizeString(payload.targetId).slice(0, 120) || null;
  const title = sanitizeString(payload.title).slice(0, 120) || query;
  const subtitle = sanitizeString(payload.subtitle).slice(0, 160);

  if (!query && !targetId) throw new HttpError(400, 'SEARCH_RECENT_EMPTY', 'Нет данных для сохранения поиска');

  return db.transaction((state) => {
    state.recentSearches = state.recentSearches || [];
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const now = new Date().toISOString();
    const existing = state.recentSearches.find((item) => {
      return item.accountId === account.id && item.status !== 'deleted' && item.query === query && item.targetType === targetType && item.targetId === targetId;
    });
    if (existing) {
      existing.title = title;
      existing.subtitle = subtitle;
      existing.updatedAt = now;
      existing.createdAt = now;
      return { item: existing };
    }

    const item = {
      id: createId('recent'),
      accountId: account.id,
      query,
      targetType,
      targetId,
      title,
      subtitle,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };
    state.recentSearches.push(item);
    return { item };
  });
}

function deleteRecentSearch({ userId, activeAccountId, id }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const item = (state.recentSearches || []).find((entry) => entry.id === id && entry.accountId === account.id && entry.status !== 'deleted');
    if (!item) throw new HttpError(404, 'RECENT_SEARCH_NOT_FOUND', 'Недавний поиск не найден');
    item.status = 'deleted';
    item.updatedAt = new Date().toISOString();
    return { id, deleted: true };
  });
}

function clearRecentSearches({ userId, activeAccountId }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const now = new Date().toISOString();
    let count = 0;
    (state.recentSearches || []).forEach((item) => {
      if (item.accountId === account.id && item.status !== 'deleted') {
        item.status = 'deleted';
        item.updatedAt = now;
        count += 1;
      }
    });
    return { cleared: count };
  });
}

module.exports = {
  listSearchResults,
  listRecentSearches,
  addRecentSearch,
  deleteRecentSearch,
  clearRecentSearches
};
