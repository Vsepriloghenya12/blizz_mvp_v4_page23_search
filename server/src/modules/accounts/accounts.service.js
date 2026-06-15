const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { buildAuthResponse } = require('../auth/auth.service');

const BUSINESS_CATEGORIES = [
  'Еда и напитки',
  'Красота и уход',
  'Магазины',
  'Туризм и отдых',
  'Развлечения',
  'Услуги',
  'Спорт',
  'Образование',
  'Здоровье',
  'Дом и ремонт',
  'Авто',
  'Другое'
];

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function sanitizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateBusinessInput(input) {
  const data = input || {};
  const name = sanitizeOptionalString(data.name);
  const username = normalizeUsername(data.username);
  const category = sanitizeOptionalString(data.category);
  const description = sanitizeOptionalString(data.description);
  const address = sanitizeOptionalString(data.address);
  const phone = sanitizeOptionalString(data.phone);
  const website = sanitizeOptionalString(data.website);

  if (!name) {
    throw new HttpError(400, 'BUSINESS_NAME_REQUIRED', 'Введите название бизнеса');
  }

  if (name.length > 80) {
    throw new HttpError(400, 'BUSINESS_NAME_TOO_LONG', 'Название бизнеса должно быть не длиннее 80 символов');
  }

  if (!username) {
    throw new HttpError(400, 'BUSINESS_USERNAME_REQUIRED', 'Введите никнейм бизнеса');
  }

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    throw new HttpError(400, 'USERNAME_INVALID', 'Никнейм может содержать латинские буквы, цифры и подчёркивание');
  }

  if (!category) {
    throw new HttpError(400, 'BUSINESS_CATEGORY_REQUIRED', 'Выберите категорию');
  }

  if (!BUSINESS_CATEGORIES.includes(category)) {
    throw new HttpError(400, 'BUSINESS_CATEGORY_INVALID', 'Выберите категорию из списка');
  }

  if (description.length > 220) {
    throw new HttpError(400, 'BUSINESS_DESCRIPTION_TOO_LONG', 'Описание бизнеса должно быть не длиннее 220 символов');
  }

  if (address.length > 160) {
    throw new HttpError(400, 'BUSINESS_ADDRESS_TOO_LONG', 'Адрес должен быть не длиннее 160 символов');
  }

  if (phone.length > 32) {
    throw new HttpError(400, 'BUSINESS_PHONE_TOO_LONG', 'Телефон должен быть не длиннее 32 символов');
  }

  if (website.length > 140) {
    throw new HttpError(400, 'BUSINESS_WEBSITE_TOO_LONG', 'Ссылка должна быть не длиннее 140 символов');
  }

  return { name, username, category, description, address, phone, website };
}

function switchAccount({ userId, sessionToken, accountId }) {
  if (!accountId) {
    throw new HttpError(400, 'ACCOUNT_ID_REQUIRED', 'Не выбран аккаунт');
  }

  return db.transaction((state) => {
    const user = state.users.find((item) => item.id === userId && item.status === 'active');
    if (!user) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Сессия не найдена');
    }

    const session = state.sessions.find((item) => item.token === sessionToken && !item.revokedAt);
    if (!session) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Сессия не найдена');
    }

    const membership = state.accountMemberships.find((item) => {
      return item.userId === userId && item.accountId === accountId && item.status === 'active';
    });

    if (!membership) {
      throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к аккаунту');
    }

    const account = state.accounts.find((item) => item.id === accountId);
    if (!account) {
      throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
    }

    session.activeAccountId = account.id;
    session.lastSeenAt = new Date().toISOString();

    return buildAuthResponse(state, user, session);
  });
}

function createBusinessAccount({ userId, sessionToken, input }) {
  const payload = validateBusinessInput(input);

  return db.transaction((state) => {
    const user = state.users.find((item) => item.id === userId && item.status === 'active');
    if (!user) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Сессия не найдена');
    }

    const session = state.sessions.find((item) => item.token === sessionToken && !item.revokedAt);
    if (!session) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Сессия не найдена');
    }

    const usernameTaken = state.accounts.some((account) => account.username === payload.username);
    if (usernameTaken) {
      throw new HttpError(409, 'USERNAME_TAKEN', 'Этот никнейм уже занят');
    }

    const now = new Date().toISOString();
    const account = {
      id: createId('account'),
      type: 'business',
      ownerUserId: user.id,
      name: payload.name,
      username: payload.username,
      avatar: null,
      bio: payload.description,
      city: '',
      link: payload.website,
      isPrivate: false,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    const businessProfile = {
      id: createId('business_profile'),
      accountId: account.id,
      category: payload.category,
      description: payload.description,
      address: payload.address,
      phone: payload.phone,
      website: payload.website,
      logo: null,
      geoPoint: null,
      createdAt: now,
      updatedAt: now
    };

    const membership = {
      id: createId('membership'),
      userId: user.id,
      accountId: account.id,
      role: 'owner',
      status: 'active',
      createdAt: now
    };

    state.accounts.push(account);
    state.businessProfiles.push(businessProfile);
    state.accountMemberships.push(membership);
    session.activeAccountId = account.id;
    session.lastSeenAt = now;

    const auth = buildAuthResponse(state, user, session);

    return {
      ...auth,
      businessProfile: {
        category: businessProfile.category,
        description: businessProfile.description,
        address: businessProfile.address,
        phone: businessProfile.phone,
        website: businessProfile.website,
        logo: businessProfile.logo
      }
    };
  });
}

module.exports = { BUSINESS_CATEGORIES, createBusinessAccount, switchAccount };
