const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page30-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4630';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const { db } = require('./src/shared/storage/jsonDatabase');
const { createId } = require('./src/shared/security/password');
const app = createApp();
const server = app.listen(4630);
const base = 'http://127.0.0.1:4630';

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
    const owner = await register(`page30_owner_${suffix}@test.ru`);
    const ownerToken = owner.session.token;
    const ownerAccountId = owner.activeAccount.id;

    const viewer = await register(`page30_viewer_${suffix}@test.ru`);
    const viewerToken = viewer.session.token;

    const post = (await request('/api/posts', {
      method: 'POST',
      token: ownerToken,
      body: { media: [{ type: 'image', url: 'https://example.com/page30-post.jpg' }], text: 'Пост для метрик', visibility: 'public' }
    })).json.post;

    await request('/api/metrics/events', { method: 'POST', token: ownerToken, body: { eventType: 'profile_view', targetType: 'account', targetId: ownerAccountId } });
    await request('/api/metrics/events', { method: 'POST', token: ownerToken, body: { eventType: 'post_view', targetType: 'post', targetId: post.id } });
    await request(`/api/posts/${post.id}/like`, { method: 'POST', token: viewerToken });
    await request(`/api/posts/${post.id}/comments`, { method: 'POST', token: viewerToken, body: { text: 'Метрики комментария' } });
    await request(`/api/posts/${post.id}/save`, { method: 'POST', token: viewerToken });
    await request(`/api/accounts/${ownerAccountId}/follow`, { method: 'POST', token: viewerToken });

    const personalSummary = (await request('/api/metrics/summary?period=7d', { token: ownerToken })).json;
    if (personalSummary.overview.profileViews !== 1) throw new Error('Personal profile views should be counted');
    if (personalSummary.personal.likes < 1 || personalSummary.personal.comments < 1 || personalSummary.personal.saves < 1) throw new Error('Personal engagement should be counted');
    const personalContent = (await request('/api/metrics/content?period=7d', { token: ownerToken })).json;
    if (!personalContent.items.some((item) => item.id === post.id && item.type === 'post')) throw new Error('Personal content metrics should include created post');

    const businessAuth = await request('/api/accounts/business', {
      method: 'POST',
      token: ownerToken,
      body: {
        name: `Кофейня Метрики ${suffix}`,
        username: `metrics_${suffix}`.slice(0, 24).toLowerCase(),
        category: 'Еда и напитки',
        description: 'Тест метрик бизнеса',
        address: 'Сочи, Морская 1',
        phone: '+70000000000',
        website: 'https://example.com'
      }
    });
    const businessToken = businessAuth.json.session.token;
    const businessAccountId = businessAuth.json.activeAccount.id;

    const offer = (await request('/api/offers', {
      method: 'POST',
      token: businessToken,
      body: { type: 'promo', title: 'Скидка на кофе', coverUrl: 'https://example.com/offer.jpg', priceOrCondition: '-10%', address: 'Сочи, Морская 1' }
    })).json.offer;

    await request('/api/metrics/events', { method: 'POST', token: businessToken, body: { eventType: 'profile_view', targetType: 'business', targetId: businessAccountId } });
    await request('/api/metrics/events', { method: 'POST', token: businessToken, body: { eventType: 'offer_view', targetType: 'offer', targetId: offer.id } });
    await request('/api/metrics/events', { method: 'POST', token: businessToken, body: { eventType: 'route_click', targetType: 'offer', targetId: offer.id } });
    await request('/api/metrics/events', { method: 'POST', token: businessToken, body: { eventType: 'phone_click', targetType: 'business', targetId: businessAccountId } });
    await request('/api/metrics/events', { method: 'POST', token: businessToken, body: { eventType: 'site_click', targetType: 'business', targetId: businessAccountId } });
    await request('/api/metrics/events', { method: 'POST', token: businessToken, body: { eventType: 'business_action', targetType: 'offer', targetId: offer.id, metadata: { action: 'create_offer' } } });

    const businessSummary = (await request('/api/metrics/business?period=30d', { token: businessToken })).json;
    if (!businessSummary.business || businessSummary.business.offerViews !== 1 || businessSummary.business.routes !== 1) throw new Error('Business metrics should count offer view and route click');
    const offerMetrics = (await request('/api/metrics/offers?period=30d', { token: businessToken })).json;
    if (!offerMetrics.items.some((item) => item.id === offer.id && item.views === 1 && item.routeClicks === 1)) throw new Error('Offer metrics should include offer event counters');
    const actions = (await request('/api/metrics/actions?period=30d', { token: businessToken })).json;
    if (actions.items.length !== 1) throw new Error('Owner should see business actions');

    const smm = await register(`page30_smm_${suffix}@test.ru`);
    addMembership(smm.user.id, businessAccountId, 'smm');
    const smmAuth = (await request('/api/accounts/switch', { method: 'POST', token: smm.session.token, body: { accountId: businessAccountId } })).json;
    const smmActionsDenied = await request('/api/metrics/actions?period=30d', { token: smmAuth.session.token, allowError: true });
    if (smmActionsDenied.status !== 403) throw new Error('SMM should not see business action log');
    const smmOffers = await request('/api/metrics/offers?period=30d', { token: smmAuth.session.token });
    if (smmOffers.status !== 200) throw new Error('SMM should see offer metrics');

    const messagesUser = await register(`page30_messages_${suffix}@test.ru`);
    addMembership(messagesUser.user.id, businessAccountId, 'messages');
    const messagesAuth = (await request('/api/accounts/switch', { method: 'POST', token: messagesUser.session.token, body: { accountId: businessAccountId } })).json;
    const messagesSummary = (await request('/api/metrics/summary?period=7d', { token: messagesAuth.session.token })).json;
    if (!messagesSummary.capabilities.canViewMessages || messagesSummary.capabilities.canViewOffers) throw new Error('Messages role should only get message-oriented metrics');
    const messagesOffersDenied = await request('/api/metrics/offers?period=7d', { token: messagesAuth.session.token, allowError: true });
    if (messagesOffersDenied.status !== 403) throw new Error('Messages role should not see offer metrics');

    const stranger = await register(`page30_stranger_${suffix}@test.ru`);
    const strangerDenied = await request('/api/metrics/business?period=7d', { token: stranger.session.token, allowError: true });
    if (strangerDenied.status !== 400) throw new Error('Non-business stranger should not see business metrics for another account');

    console.log('page30 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
