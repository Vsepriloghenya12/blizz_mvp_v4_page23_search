const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const { deletePostComment } = require('../posts/posts.service');

const router = express.Router();

router.delete('/:commentId', requireSession, (req, res, next) => {
  try {
    const result = deletePostComment({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      commentId: req.params.commentId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { commentsRouter: router };
