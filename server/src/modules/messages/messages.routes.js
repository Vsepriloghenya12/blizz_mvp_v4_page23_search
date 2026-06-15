const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const {
  listConversations,
  getConversation,
  createConversation,
  createGroupConversation,
  listGroupMembers,
  sendMessage,
  markConversationRead
} = require('./messages.service');

const router = express.Router();


router.post('/groups', requireSession, (req, res, next) => {
  try {
    const result = createGroupConversation({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(result.reused ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/groups/:conversationId/members', requireSession, (req, res, next) => {
  try {
    const result = listGroupMembers({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      conversationId: req.params.conversationId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/conversations', requireSession, (req, res, next) => {
  try {
    const result = listConversations({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      filter: req.query.filter
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/conversations', requireSession, (req, res, next) => {
  try {
    const result = createConversation({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/conversations/:conversationId', requireSession, (req, res, next) => {
  try {
    const result = getConversation({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      conversationId: req.params.conversationId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireSession, (req, res, next) => {
  try {
    const result = sendMessage({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/read', requireSession, (req, res, next) => {
  try {
    const result = markConversationRead({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      conversationId: req.body && req.body.conversationId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { messagesRouter: router };
