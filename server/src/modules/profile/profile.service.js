const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { buildAuthResponse } = require('../auth/auth.service');

function getActiveAccountForSession(state, userId, activeAccountId) {
  const membership = state.accountMemberships.find((item) => {
    return item.userId === userId && item.accountId === activeAccountId && item.status === 'active';
  });

  if (!membership) {
    throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к активному аккаунту');
  }

  const account = state.accounts.find((item) => item.id === activeAccountId);
  if (!account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }

  return { account, membership };
}

function getAccountStats(state, accountId) {
  const posts = (state.posts || []).filter((post) => post.accountId === accountId && post.status === 'published').length;
  const videos = (state.videos || []).filter((video) => video.accountId === accountId && video.status === 'published').length;
  const drafts = (state.drafts || []).filter((draft) => draft.accountId === accountId && draft.status === 'draft').length;
  const offers = (state.offers || []).filter((offer) => offer.businessAccountId === accountId && offer.status === 'active').length;
  const saved = (state.savedItems || []).filter((item) => item.accountId === accountId && item.status === 'active').length;
  const followers = (state.follows || []).filter((follow) => follow.followingAccountId === accountId && follow.status === 'active').length;
  const following = (state.follows || []).filter((follow) => follow.followerAccountId === accountId && follow.status === 'active').length;

  return { posts, videos, drafts, offers, saved, followers, following };
}

function publicProfile(state, account, membership) {
  const businessProfile = account.type === 'business'
    ? state.businessProfiles.find((profile) => profile.accountId === account.id)
    : null;

  return {
    id: account.id,
    type: account.type,
    role: membership.role,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    bio: account.bio || '',
    city: account.city || '',
    link: account.link || '',
    isPrivate: Boolean(account.isPrivate),
    businessProfile: businessProfile ? {
      category: businessProfile.category,
      description: businessProfile.description || '',
      address: businessProfile.address || '',
      phone: businessProfile.phone || '',
      website: businessProfile.website || '',
      logo: businessProfile.logo || null
    } : null,
    stats: getAccountStats(state, account.id),
    isOwnerView: true
  };
}

function validateProfileInput(input) {
  const next = {
    name: typeof input.name === 'string' ? input.name.trim() : undefined,
    username: typeof input.username === 'string' ? input.username.trim().toLowerCase() : undefined,
    bio: typeof input.bio === 'string' ? input.bio.trim() : undefined,
    city: typeof input.city === 'string' ? input.city.trim() : undefined,
    link: typeof input.link === 'string' ? input.link.trim() : undefined
  };

  if (next.name !== undefined && !next.name) {
    throw new HttpError(400, 'NAME_REQUIRED', 'Введите имя');
  }

  if (next.name && next.name.length > 40) {
    throw new HttpError(400, 'NAME_TOO_LONG', 'Имя должно быть не длиннее 40 символов');
  }

  if (next.username !== undefined) {
    if (!/^[a-z0-9_]{3,24}$/.test(next.username)) {
      throw new HttpError(400, 'USERNAME_INVALID', 'Никнейм может содержать латинские буквы, цифры и подчёркивание');
    }
  }

  if (next.bio && next.bio.length > 150) {
    throw new HttpError(400, 'BIO_TOO_LONG', 'Описание должно быть не длиннее 150 символов');
  }

  if (next.city && next.city.length > 60) {
    throw new HttpError(400, 'CITY_TOO_LONG', 'Город должен быть не длиннее 60 символов');
  }

  if (next.link && next.link.length > 120) {
    throw new HttpError(400, 'LINK_TOO_LONG', 'Ссылка должна быть не длиннее 120 символов');
  }

  return next;
}

function getMyProfile({ userId, activeAccountId }) {
  const state = db.read();
  const { account, membership } = getActiveAccountForSession(state, userId, activeAccountId);
  return { profile: publicProfile(state, account, membership) };
}

function updateMyProfile({ userId, sessionToken, activeAccountId, input }) {
  const changes = validateProfileInput(input || {});

  return db.transaction((state) => {
    const session = state.sessions.find((item) => item.token === sessionToken && !item.revokedAt);
    if (!session) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Сессия не найдена');
    }

    const user = state.users.find((item) => item.id === userId && item.status === 'active');
    if (!user) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Сессия не найдена');
    }

    const { account, membership } = getActiveAccountForSession(state, userId, activeAccountId);

    if (changes.username && changes.username !== account.username) {
      const usernameTaken = state.accounts.some((item) => item.username === changes.username && item.id !== account.id);
      if (usernameTaken) {
        throw new HttpError(409, 'USERNAME_TAKEN', 'Этот никнейм уже занят');
      }
    }

    if (changes.name !== undefined) account.name = changes.name;
    if (changes.username !== undefined) account.username = changes.username;
    if (changes.bio !== undefined) account.bio = changes.bio;
    if (changes.city !== undefined) account.city = changes.city;
    if (changes.link !== undefined) account.link = changes.link;
    account.updatedAt = new Date().toISOString();
    session.lastSeenAt = account.updatedAt;

    return {
      profile: publicProfile(state, account, membership),
      auth: buildAuthResponse(state, user, session)
    };
  });
}

module.exports = { getMyProfile, updateMyProfile };
