const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const { listBlocks, blockAccount, unblockAccount } = require('./blocks.service');

const router = express.Router();

router.get('/', requireSession, (req, res, next) => {
  try {
    const result = listBlocks({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireSession, (req, res, next) => {
  try {
    const result = blockAccount({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetAccountId: req.body && req.body.targetAccountId
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/:targetAccountId', requireSession, (req, res, next) => {
  try {
    const result = unblockAccount({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetAccountId: req.params.targetAccountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { blocksRouter: router };
