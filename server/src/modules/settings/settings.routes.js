const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const { getMySettings, updateMySettings } = require('./settings.service');

const router = express.Router();

router.get('/me', requireSession, (req, res, next) => {
  try {
    res.json(getMySettings({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    }));
  } catch (error) {
    next(error);
  }
});

router.patch('/me', requireSession, (req, res, next) => {
  try {
    res.json(updateMySettings({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    }));
  } catch (error) {
    next(error);
  }
});

module.exports = { settingsRouter: router };
