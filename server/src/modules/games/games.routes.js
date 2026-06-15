const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const {
  getGamesCatalog,
  createGameSession,
  getGameSession,
  answerGameSession,
  finishGameSession
} = require('./games.service');

const router = express.Router();

router.get('/catalog', requireSession, (_req, res, next) => {
  try {
    res.json(getGamesCatalog());
  } catch (error) {
    next(error);
  }
});

router.post('/sessions', requireSession, (req, res, next) => {
  try {
    const result = createGameSession({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/sessions/:sessionId', requireSession, (req, res, next) => {
  try {
    const result = getGameSession({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      sessionId: req.params.sessionId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/sessions/:sessionId/answer', requireSession, (req, res, next) => {
  try {
    const result = answerGameSession({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      sessionId: req.params.sessionId,
      input: req.body
    });
    res.status(result.reused ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/sessions/:sessionId/finish', requireSession, (req, res, next) => {
  try {
    const result = finishGameSession({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      sessionId: req.params.sessionId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { gamesRouter: router };
