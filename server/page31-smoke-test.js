const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page31-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4631';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const { db } = require('./src/shared/storage/jsonDatabase');
const { createId } = require('./src/shared/security/password');
const app = createApp();
const server = app.listen(4631);
const base = 'http://127.0.0.1:4631';

async function request(pathname, options = {}) {
  const response = await fetch(`${base}${pathname}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const json = await response.json().catch(() => null);
  if (!response.ok && !options.allowError) {
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${JSON.stringify(json)}`);
  }
  return { status: response.status, json };
}

async function register(login) {
  return (await request('/api/auth/register', { method: 'POST', body: { login, password: '123456' } })).json;
}

function addMembership(userId, accountId, role) {
  db.transaction((state) => {
    state.accountMemberships.push({
      id: createId('membership'),
      userId,
      accountId,
      role,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  });
}

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const owner = await register(`page31_owner_${suffix}@test.ru`);
    const ownerToken = owner.session.token;

    const businessAuth = (await request('/api/accounts/business', {
      method: 'POST',
      token: ownerToken,
      body: {
        name: `Кофейня Жалобы ${suffix}`,
        username: `reports_${suffix}`.slice(0, 24).toLowerCase(),
        category: 'Еда и напитки',
        description: 'Панель владельца и жалобы',
        address: 'Сочи, Морская 7',
        phone: '+70000000000',
        website: 'https://example.com'
      }
    })).json;
    const businessToken = businessAuth.session.token;
    const businessAccountId = businessAuth.activeAccount.id;

    const offer = (await request('/api/offers', {
      method: 'POST',
      token: businessToken,
      body: { type: 'promo', title: 'Проверочная акция', coverUrl: 'https://example.com/page31-offer.jpg', priceOrCondition: '-10%', address: 'Сочи, Морская 7' }
    })).json.offer;

    await request('/api/metrics/events', { method: 'POST', token: businessToken, body: { eventType: 'profile_view', targetType: 'business', targetId: businessAccountId } });
    await request('/api/metrics/events', { method: 'POST', token: businessToken, body: { eventType: 'route_click', targetType: 'offer', targetId: offer.id } });

    const viewer = await register(`page31_viewer_${suffix}@test.ru`);
    const viewerToken = viewer.session.token;

    const report = (await request('/api/reports', {
      method: 'POST',
      token: viewerToken,
      body: { targetType: 'offer', targetId: offer.id, reason: 'fraud', comment: 'Проверка жалобы на предложение' }
    })).json.report;
    if (!report.id || report.businessAccountId !== businessAccountId || report.moderationStatus !== 'new') throw new Error('Offer report should be created and linked to business');

    const myReports = (await request('/api/reports/my', { token: viewerToken })).json;
    if (!myReports.items.some((item) => item.id === report.id)) throw new Error('Reporter should see own report');

    const businessReports = (await request('/api/reports/business', { token: businessToken })).json;
    if (!businessReports.items.some((item) => item.id === report.id)) throw new Error('Business owner should see business report');

    const handled = (await request(`/api/reports/business/${report.id}/owner-status`, { method: 'PATCH', token: businessToken, body: { status: 'handled', ownerNote: 'Проверено владельцем' } })).json.report;
    if (handled.ownerStatus !== 'handled') throw new Error('Business owner should update owner status');

    const dashboard = (await request('/api/business/dashboard?period=7d', { token: businessToken })).json;
    if (dashboard.overview.profileViews !== 1 || dashboard.overview.routes !== 1) throw new Error('Dashboard should include metrics summary');
    if (dashboard.reports.total !== 1 || dashboard.reports.resolved < 1) throw new Error('Dashboard should include business reports');
    if (!dashboard.capabilities.canViewStaff || !dashboard.capabilities.canViewActions) throw new Error('Owner dashboard capabilities should include staff and actions');

    const archivedOffer = (await request(`/api/business/offers/${offer.id}/status`, { method: 'PATCH', token: businessToken, body: { status: 'archived' } })).json.offer;
    if (archivedOffer.status !== 'archived') throw new Error('Owner should archive offer');

    const smm = await register(`page31_smm_${suffix}@test.ru`);
    addMembership(smm.user.id, businessAccountId, 'smm');
    const smmAuth = (await request('/api/accounts/switch', { method: 'POST', token: smm.session.token, body: { accountId: businessAccountId } })).json;
    const smmDashboard = (await request('/api/business/dashboard?period=7d', { token: smmAuth.session.token })).json;
    if (!smmDashboard.capabilities.canViewOffers || smmDashboard.capabilities.canViewStaff) throw new Error('SMM should see offers but not staff');

    const messagesUser = await register(`page31_messages_${suffix}@test.ru`);
    addMembership(messagesUser.user.id, businessAccountId, 'messages');
    const messagesAuth = (await request('/api/accounts/switch', { method: 'POST', token: messagesUser.session.token, body: { accountId: businessAccountId } })).json;
    const messagesDashboard = (await request('/api/business/dashboard?period=7d', { token: messagesAuth.session.token })).json;
    if (!messagesDashboard.capabilities.canViewMessages || messagesDashboard.capabilities.canViewOffers || messagesDashboard.capabilities.canViewStaff) throw new Error('Messages role should see only message-oriented dashboard');

    const strangerDashboard = await request('/api/business/dashboard?period=7d', { token: viewerToken, allowError: true });
    if (strangerDashboard.status !== 403) throw new Error('Personal account should not open business owner dashboard');

    const moderator = await register(`page31_mod_${suffix}@test.ru`);
    db.transaction((state) => {
      const user = state.users.find((item) => item.id === moderator.user.id);
      if (user) user.isServiceModerator = true;
    });
    const moderationReports = (await request('/api/moderation/reports', { token: moderator.session.token })).json;
    if (!moderationReports.items.some((item) => item.id === report.id)) throw new Error('Service moderator should see global report');
    const modUpdated = (await request(`/api/moderation/reports/${report.id}/status`, { method: 'PATCH', token: moderator.session.token, body: { status: 'resolved', moderationNote: 'Проверено модератором' } })).json.report;
    if (modUpdated.moderationStatus !== 'resolved') throw new Error('Service moderator should update moderation status');

    console.log('page31 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
