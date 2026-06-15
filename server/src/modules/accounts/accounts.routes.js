const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const { createBusinessAccount, switchAccount } = require('./accounts.service');

const router = express.Router();

router.post('/switch', requireSession, (req, res, next) => {
  try {
    const result = switchAccount({
      userId: req.auth.user.id,
      sessionToken: req.auth.token,
      accountId: req.body.accountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/business', requireSession, (req, res, next) => {
  try {
    const result = createBusinessAccount({
      userId: req.auth.user.id,
      sessionToken: req.auth.token,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { accountsRouter: router };
