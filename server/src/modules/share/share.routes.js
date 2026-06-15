const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const { listShareRecipients, sharePost } = require('./share.service');

const router = express.Router();

router.get('/recipients', requireSession, (req, res, next) => {
  try {
    const result = listShareRecipients({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/post', requireSession, (req, res, next) => {
  try {
    const result = sharePost({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { shareRouter: router };
