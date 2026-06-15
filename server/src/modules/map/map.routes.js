const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const { listMapObjects } = require('./map.service');

const router = express.Router();

router.get('/objects', requireSession, (req, res, next) => {
  try {
    const result = listMapObjects({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      filter: String(req.query.filter || 'all')
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { mapRouter: router };
