const express = require('express');
const { getTokenFromRequest } = require('../../shared/http/sessionMiddleware');
const {
  loginServiceOwner,
  getServiceOwnerSession,
  logoutServiceOwner,
  getOverview,
  listUsers,
  listAccounts,
  listBusinesses,
  listContent,
  listReports,
  getMetrics
} = require('./serviceOwner.service');

const router = express.Router();

router.post('/login', (req, res, next) => {
  try {
    res.json(loginServiceOwner({ login: req.body.login, password: req.body.password }));
  } catch (error) {
    next(error);
  }
});

router.get('/me', (req, res, next) => {
  try {
    res.json(getServiceOwnerSession(getTokenFromRequest(req)));
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  try {
    res.json(logoutServiceOwner(getTokenFromRequest(req)));
  } catch (error) {
    next(error);
  }
});

router.get('/overview', (req, res, next) => {
  try {
    res.json(getOverview({ token: getTokenFromRequest(req), period: req.query.period }));
  } catch (error) {
    next(error);
  }
});

router.get('/users', (req, res, next) => {
  try {
    res.json(listUsers({ token: getTokenFromRequest(req), query: req.query.query }));
  } catch (error) {
    next(error);
  }
});

router.get('/accounts', (req, res, next) => {
  try {
    res.json(listAccounts({ token: getTokenFromRequest(req), query: req.query.query }));
  } catch (error) {
    next(error);
  }
});

router.get('/businesses', (req, res, next) => {
  try {
    res.json(listBusinesses({ token: getTokenFromRequest(req), query: req.query.query }));
  } catch (error) {
    next(error);
  }
});

router.get('/content', (req, res, next) => {
  try {
    res.json(listContent({ token: getTokenFromRequest(req), period: req.query.period }));
  } catch (error) {
    next(error);
  }
});

router.get('/reports', (req, res, next) => {
  try {
    res.json(listReports({ token: getTokenFromRequest(req), status: req.query.status }));
  } catch (error) {
    next(error);
  }
});

router.get('/metrics', (req, res, next) => {
  try {
    res.json(getMetrics({ token: getTokenFromRequest(req), period: req.query.period }));
  } catch (error) {
    next(error);
  }
});

module.exports = { serviceOwnerRouter: router };
