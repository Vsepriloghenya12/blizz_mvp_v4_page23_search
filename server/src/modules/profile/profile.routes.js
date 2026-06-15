const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const { getMyProfile, updateMyProfile } = require('./profile.service');

const router = express.Router();

router.get('/me', requireSession, (req, res, next) => {
  try {
    const result = getMyProfile({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/me', requireSession, (req, res, next) => {
  try {
    const result = updateMyProfile({
      userId: req.auth.user.id,
      sessionToken: req.auth.token,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { profileRouter: router };
