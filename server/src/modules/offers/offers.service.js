const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { canViewAccountContent } = require('../follows/follows.service');

const OFFER_CREATOR_ROLES = new Set(['owner', 'admin', 'smm']);
const OFFER_TYPES = new Set(['promo', 'product', 'service', 'event']);
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

function assertCanCreateOffer(account, membership) {
  if (account.type === 'business' && OFFER_CREATOR_ROLES.has(membership.role)) {
    return;
  }

  throw new HttpError(403, 'OFFER_CREATE_FORBIDDEN', 'Нет доступа к созданию предложений');
}

function validateUrl(value) {
  const url = sanitizeString(value);
  if (!url) {
    throw new HttpError(400, 'OFFER_COVER_REQUIRED', 'Добавьте обложку предложения');
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
    return parsed.toString();
  } catch (_error) {
    throw new HttpError(400, 'OFFER_COVER_INVALID', 'Добавьте корректную ссылку на обложку');
  }
}

function normalizeOfferLocation(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const title = sanitizeString(input.title);
  const address = sanitizeString(input.address);

  if (!title && !address) {
    return null;
  }

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

function normalizeExpiresAt(value) {
  const raw = sanitizeString(value);
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'OFFER_EXPIRES_INVALID', 'Укажите корректный срок действия');
  }

  return date.toISOString();
}

function normalizeOfferInput(input) {
  const payload = input || {};
  const type = sanitizeString(payload.type);
  const title = sanitizeString(payload.title);
  const coverUrl = validateUrl(payload.coverUrl);
  const description = sanitizeString(payload.description);
  const priceOrCondition = sanitizeString(payload.priceOrCondition);
  const address = sanitizeString(payload.address);

  if (!OFFER_TYPES.has(type)) {
    throw new HttpError(400, 'OFFER_TYPE_REQUIRED', 'Выберите тип предложения');
  }

  if (!title) {
    throw new HttpError(400, 'OFFER_TITLE_REQUIRED', 'Введите название предложения');
  }

  if (title.length > 90) {
    throw new HttpError(400, 'OFFER_TITLE_TOO_LONG', 'Название предложения должно быть не длиннее 90 символов');
  }

  if (description.length > 500) {
    throw new HttpError(400, 'OFFER_DESCRIPTION_TOO_LONG', 'Описание должно быть не длиннее 500 символов');
  }

  if (priceOrCondition.length > 80) {
    throw new HttpError(400, 'OFFER_PRICE_TOO_LONG', 'Цена или условие должны быть не длиннее 80 символов');
  }

  if (address.length > 160) {
    throw new HttpError(400, 'OFFER_ADDRESS_TOO_LONG', 'Адрес должен быть не длиннее 160 символов');
  }

  return {
    type,
    title,
    coverUrl,
    description,
    priceOrCondition,
    expiresAt: normalizeExpiresAt(payload.expiresAt),
    address,
    location: normalizeOfferLocation(payload.location)
  };
}

function getBusinessProfile(state, accountId) {
  return (state.businessProfiles || []).find((profile) => profile.accountId === accountId) || null;
}

function publicBusiness(account, businessProfile) {
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    category: businessProfile ? businessProfile.category : null,
    address: businessProfile ? businessProfile.address || '' : '',
    phone: businessProfile ? businessProfile.phone || '' : '',
    website: businessProfile ? businessProfile.website || '' : ''
  };
}

function isOfferActive(offer) {
  if (offer.status !== 'active') return false;
  if (!offer.expiresAt) return true;
  return Date.parse(offer.expiresAt) > Date.now();
}

function publicOffer(state, offer, viewerAccountId) {
  const businessAccount = state.accounts.find((account) => account.id === offer.businessAccountId && account.status !== 'archived');
  if (!businessAccount) return null;
  const businessProfile = getBusinessProfile(state, businessAccount.id);

  const saves = (state.savedItems || []).filter((item) => {
    return item.targetType === 'offer' && item.targetId === offer.id && item.status === 'active';
  });

  return {
    id: offer.id,
    businessAccountId: offer.businessAccountId,
    type: offer.type,
    typeLabel: OFFER_TYPE_LABELS[offer.type] || offer.type,
    title: offer.title,
    coverUrl: offer.coverUrl,
    description: offer.description,
    priceOrCondition: offer.priceOrCondition,
    expiresAt: offer.expiresAt,
    address: offer.address,
    location: offer.location,
    status: offer.status,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
    business: publicBusiness(businessAccount, businessProfile),
    savesCount: saves.length,
    isSavedByMe: saves.some((item) => item.accountId === viewerAccountId)
  };
}

function createOffer({ userId, activeAccountId, input }) {
  const payload = normalizeOfferInput(input);

  return db.transaction((state) => {
    const { account, membership } = getActiveAccountContext(state, userId, activeAccountId);
    assertCanCreateOffer(account, membership);

    const businessProfile = getBusinessProfile(state, account.id);
    const now = new Date().toISOString();
    const fallbackAddress = payload.address || (businessProfile ? businessProfile.address || '' : '');
    const offer = {
      id: createId('offer'),
      businessAccountId: account.id,
      authorUserId: userId,
      type: payload.type,
      title: payload.title,
      coverUrl: payload.coverUrl,
      description: payload.description,
      priceOrCondition: payload.priceOrCondition,
      expiresAt: payload.expiresAt,
      address: fallbackAddress,
      location: payload.location || (fallbackAddress ? {
        title: account.name,
        address: fallbackAddress,
        lat: null,
        lng: null,
        precision: 'exact'
      } : null),
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    state.offers.push(offer);
    return { offer: publicOffer(state, offer, account.id) };
  });
}

function listMyOffers({ userId, activeAccountId }) {
  const state = db.read();
  const { account, membership } = getActiveAccountContext(state, userId, activeAccountId);
  if (account.type !== 'business') {
    return { offers: [] };
  }

  const offers = (state.offers || [])
    .filter((offer) => offer.businessAccountId === account.id && offer.status !== 'archived')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((offer) => publicOffer(state, offer, account.id))
    .filter(Boolean);

  return { offers };
}

function listBusinessOffers({ userId, activeAccountId, accountId }) {
  const state = db.read();
  const { account: viewerAccount } = getActiveAccountContext(state, userId, activeAccountId);
  const businessAccount = state.accounts.find((account) => account.id === accountId && account.type === 'business' && account.status !== 'archived');
  if (!businessAccount) {
    throw new HttpError(404, 'BUSINESS_NOT_FOUND', 'Бизнес не найден');
  }

  if (!canViewAccountContent(state, viewerAccount.id, businessAccount.id, 'public')) {
    throw new HttpError(403, 'BUSINESS_ACCESS_DENIED', 'Бизнес недоступен');
  }

  const offers = (state.offers || [])
    .filter((offer) => offer.businessAccountId === businessAccount.id && isOfferActive(offer))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((offer) => publicOffer(state, offer, viewerAccount.id))
    .filter(Boolean);

  return { offers };
}

function getOfferById({ userId, activeAccountId, offerId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);
  const offer = (state.offers || []).find((item) => item.id === offerId && item.status !== 'archived');
  if (!offer || !isOfferActive(offer)) {
    throw new HttpError(404, 'OFFER_NOT_FOUND', 'Предложение не найдено');
  }

  if (!canViewAccountContent(state, account.id, offer.businessAccountId, 'public')) {
    throw new HttpError(403, 'OFFER_ACCESS_DENIED', 'Предложение недоступно');
  }

  return { offer: publicOffer(state, offer, account.id) };
}

function saveOffer({ userId, activeAccountId, offerId }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const offer = (state.offers || []).find((item) => item.id === offerId && item.status !== 'archived');
    if (!offer || !isOfferActive(offer)) {
      throw new HttpError(404, 'OFFER_NOT_FOUND', 'Предложение не найдено');
    }

    const now = new Date().toISOString();
    const existing = (state.savedItems || []).find((item) => {
      return item.accountId === account.id && item.targetType === 'offer' && item.targetId === offer.id;
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
        targetType: 'offer',
        targetId: offer.id,
        status: 'active',
        createdAt: now,
        updatedAt: now
      });
      isSavedByMe = true;
    }

    const savesCount = (state.savedItems || []).filter((item) => {
      return item.targetType === 'offer' && item.targetId === offer.id && item.status === 'active';
    }).length;
    offer.updatedAt = now;

    return { offerId: offer.id, savesCount, isSavedByMe };
  });
}

function listShowcase({ userId, activeAccountId }) {
  const state = db.read();
  const { account: viewerAccount } = getActiveAccountContext(state, userId, activeAccountId);

  const businessPosts = (state.posts || [])
    .filter((post) => post.status === 'published')
    .filter((post) => {
      const author = state.accounts.find((account) => account.id === post.accountId && account.status !== 'archived');
      if (!author || author.type !== 'business') return false;
      return canViewAccountContent(state, viewerAccount.id, post.accountId, post.visibility || 'public');
    })
    .map((post) => ({ kind: 'business_post', createdAt: post.publishedAt || post.createdAt, post }))
    .filter((item) => item.post);

  const offers = (state.offers || [])
    .filter(isOfferActive)
    .filter((offer) => canViewAccountContent(state, viewerAccount.id, offer.businessAccountId, 'public'))
    .map((offer) => ({ kind: 'offer', createdAt: offer.createdAt, offer }))
    .filter((item) => item.offer);

  const { publicFeedPost } = require('../posts/posts.service');

  const items = [...businessPosts, ...offers]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((item) => {
      if (item.kind === 'business_post') {
        const post = publicFeedPost(state, item.post, viewerAccount.id);
        return post ? { kind: 'business_post', id: `business_post_${post.id}`, createdAt: item.createdAt, post } : null;
      }
      const offer = publicOffer(state, item.offer, viewerAccount.id);
      return offer ? { kind: 'offer', id: `offer_${offer.id}`, createdAt: item.createdAt, offer } : null;
    })
    .filter(Boolean);

  return { items };
}

module.exports = {
  OFFER_TYPES,
  createOffer,
  getOfferById,
  listBusinessOffers,
  listMyOffers,
  listShowcase,
  saveOffer
};
