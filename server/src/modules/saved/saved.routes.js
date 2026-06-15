const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const { listSaved, removeSavedObject, saveObject } = require('./saved.service');

const router = express.Router();

router.get('/', requireSession, (req, res, next) => {
  try {
    const result = listSaved({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      filter: String(req.query.filter || 'all')
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireSession, (req, res, next) => {
  try {
    const result = saveObject({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/:targetType/:targetId', requireSession, (req, res, next) => {
  try {
    const result = removeSavedObject({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetType: req.params.targetType,
      targetId: req.params.targetId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { savedRouter: router };
