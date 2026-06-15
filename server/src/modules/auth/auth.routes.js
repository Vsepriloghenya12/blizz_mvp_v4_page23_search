const express = require('express');
const { register, login, me, logout } = require('./auth.service');
const { getTokenFromRequest } = require('../../shared/http/sessionMiddleware');

const router = express.Router();

router.post('/register', (req, res, next) => {
  try {
    const result = register({
      login: req.body.login,
      password: req.body.password
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/login', (req, res, next) => {
  try {
    const result = login({
      login: req.body.login,
      password: req.body.password
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/me', (req, res, next) => {
  try {
    const result = me(getTokenFromRequest(req));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  try {
    const result = logout(getTokenFromRequest(req));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { authRouter: router };
