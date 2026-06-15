const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createPasswordHash, verifyPassword, createToken, createId } = require('../../shared/security/password');

function normalizeLogin(login) {
  return String(login || '').trim().toLowerCase();
}

function validateLoginAndPassword(login, password) {
  const normalizedLogin = normalizeLogin(login);
  const normalizedPassword = String(password || '');

  if (!normalizedLogin) {
    throw new HttpError(400, 'LOGIN_REQUIRED', 'Введите телефон или email');
  }

  if (!normalizedPassword) {
    throw new HttpError(400, 'PASSWORD_REQUIRED', 'Введите пароль');
  }

  if (normalizedPassword.length < 6) {
    throw new HttpError(400, 'WEAK_PASSWORD', 'Пароль должен быть не короче 6 символов');
  }

  return { login: normalizedLogin, password: normalizedPassword };
}

function publicUser(user) {
  return {
    id: user.id,
    login: user.login,
    status: user.status,
    createdAt: user.createdAt
  };
}

function publicAccount(account, membership, state) {
  const businessProfile = account.type === 'business' && state
    ? state.businessProfiles.find((profile) => profile.accountId === account.id)
    : null;

  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar,
    bio: account.bio || '',
    city: account.city || '',
    link: account.link || '',
    isPrivate: Boolean(account.isPrivate),
    role: membership ? membership.role : null,
    businessProfile: businessProfile ? {
      category: businessProfile.category,
      description: businessProfile.description || '',
      address: businessProfile.address || '',
      phone: businessProfile.phone || '',
      website: businessProfile.website || '',
      logo: businessProfile.logo || null
    } : null,
    createdAt: account.createdAt
  };
}

function publicSession(session) {
  return {
    token: session.token,
    activeAccountId: session.activeAccountId,
    createdAt: session.createdAt
  };
}

function buildAuthResponse(state, user, session) {
  const memberships = state.accountMemberships.filter((membership) => membership.userId === user.id);
  const accounts = memberships
    .map((membership) => {
      const account = state.accounts.find((item) => item.id === membership.accountId);
      return account ? publicAccount(account, membership, state) : null;
    })
    .filter(Boolean);

  const activeAccount = accounts.find((account) => account.id === session.activeAccountId) || accounts[0] || null;

  return {
    user: publicUser(user),
    activeAccount,
    accounts,
    session: publicSession(session)
  };
}

function createSession(state, userId, activeAccountId) {
  const now = new Date().toISOString();
  const session = {
    id: createId('session'),
    token: createToken('blizz_session'),
    userId,
    activeAccountId,
    createdAt: now,
    lastSeenAt: now,
    revokedAt: null
  };
  state.sessions.push(session);
  return session;
}

function createDefaultUsername(state) {
  let username;
  do {
    const suffix = String(Math.floor(100000 + Math.random() * 900000));
    username = `user_${suffix}`;
  } while (state.accounts.some((account) => account.username === username));
  return username;
}

function register({ login, password }) {
  const credentials = validateLoginAndPassword(login, password);

  return db.transaction((state) => {
    const existingUser = state.users.find((user) => user.login === credentials.login);
    if (existingUser) {
      throw new HttpError(409, 'USER_EXISTS', 'Аккаунт с такими данными уже существует');
    }

    const now = new Date().toISOString();
    const passwordData = createPasswordHash(credentials.password);

    const user = {
      id: createId('user'),
      login: credentials.login,
      passwordHash: passwordData.hash,
      passwordSalt: passwordData.salt,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    const personalAccount = {
      id: createId('account'),
      type: 'personal',
      ownerUserId: user.id,
      name: 'Пользователь',
      username: createDefaultUsername(state),
      avatar: null,
      bio: '',
      city: '',
      isPrivate: false,
      link: '',
      createdAt: now,
      updatedAt: now
    };

    const membership = {
      id: createId('membership'),
      userId: user.id,
      accountId: personalAccount.id,
      role: 'owner',
      status: 'active',
      createdAt: now
    };

    state.users.push(user);
    state.accounts.push(personalAccount);
    state.accountMemberships.push(membership);

    const session = createSession(state, user.id, personalAccount.id);
    return buildAuthResponse(state, user, session);
  });
}

function login({ login, password }) {
  const credentials = validateLoginAndPassword(login, password);

  return db.transaction((state) => {
    const user = state.users.find((item) => item.login === credentials.login);
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'Аккаунт не найден');
    }

    if (user.status !== 'active') {
      throw new HttpError(403, 'USER_RESTRICTED', 'Аккаунт ограничен. Обратитесь в поддержку');
    }

    const passwordValid = verifyPassword(credentials.password, user.passwordSalt, user.passwordHash);
    if (!passwordValid) {
      throw new HttpError(401, 'INVALID_PASSWORD', 'Неверный пароль');
    }

    const memberships = state.accountMemberships.filter((membership) => membership.userId === user.id && membership.status === 'active');
    const personalMembership = memberships.find((membership) => {
      const account = state.accounts.find((item) => item.id === membership.accountId);
      return account && account.type === 'personal';
    });

    const activeMembership = personalMembership || memberships[0];
    if (!activeMembership) {
      throw new HttpError(403, 'NO_ACTIVE_ACCOUNT', 'Нет доступного аккаунта');
    }

    const session = createSession(state, user.id, activeMembership.accountId);
    return buildAuthResponse(state, user, session);
  });
}

function getSessionByToken(token) {
  const cleanToken = String(token || '').trim();
  if (!cleanToken) {
    return null;
  }

  const state = db.read();
  const session = state.sessions.find((item) => item.token === cleanToken && !item.revokedAt);
  if (!session) {
    return null;
  }

  const user = state.users.find((item) => item.id === session.userId && item.status === 'active');
  if (!user) {
    return null;
  }

  return { state, session, user };
}

function me(token) {
  const found = getSessionByToken(token);
  if (!found) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Сессия не найдена');
  }

  db.transaction((state) => {
    const session = state.sessions.find((item) => item.token === token && !item.revokedAt);
    if (session) {
      session.lastSeenAt = new Date().toISOString();
    }
  });

  return buildAuthResponse(found.state, found.user, found.session);
}

function logout(token) {
  db.transaction((state) => {
    const session = state.sessions.find((item) => item.token === token && !item.revokedAt);
    if (session) {
      session.revokedAt = new Date().toISOString();
    }
  });

  return { ok: true };
}

module.exports = {
  register,
  login,
  me,
  logout,
  getSessionByToken,
  buildAuthResponse,
  publicAccount
};
