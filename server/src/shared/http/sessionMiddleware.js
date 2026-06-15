const { HttpError } = require('./httpError');
const { getSessionByToken } = require('../../modules/auth/auth.service');

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return String(req.headers['x-session-token'] || '').trim();
}

function requireSession(req, _res, next) {
  const token = getTokenFromRequest(req);
  const found = getSessionByToken(token);
  if (!found) {
    next(new HttpError(401, 'UNAUTHORIZED', 'Сессия не найдена'));
    return;
  }

  req.auth = {
    token,
    user: found.user,
    session: found.session,
    activeAccountId: found.session.activeAccountId
  };
  next();
}

module.exports = { getTokenFromRequest, requireSession };
