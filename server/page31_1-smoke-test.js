const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page31_1-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4632';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const { db } = require('./src/shared/storage/jsonDatabase');
const app = createApp();
const server = app.listen(4632);
const base = 'http://127.0.0.1:4632';

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
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_error) { json = text; }
  if (!response.ok && !options.allowError) {
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${JSON.stringify(json)}`);
  }
  return { status: response.status, json, text };
}

async function register(login) {
  return (await request('/api/auth/register', { method: 'POST', body: { login, password: '123456' } })).json;
}

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const owner = await register(`service_owner_${suffix}@test.ru`);
    const normal = await register(`normal_${suffix}@test.ru`);
    const viewer = await register(`viewer_${suffix}@test.ru`);

    db.transaction((state) => {
      const user = state.users.find((item) => item.id === owner.user.id);
      if (user) user.status = 'service_owner';
    });

    const denied = await request('/api/service-owner/login', { method: 'POST', body: { login: normal.user.login, password: '123456' }, allowError: true });
    if (denied.status !== 403) throw new Error('Normal user should not login to service owner panel');

    const login = (await request('/api/service-owner/login', { method: 'POST', body: { login: owner.user.login, password: '123456' } })).json;
    if (!login.user.isServiceOwner || !login.session.token) throw new Error('Service owner login should return service session');
    const token = login.session.token;

    const html = await request('/owner');
    if (html.status !== 200 || !String(html.text).includes('Панель владельца приложения')) throw new Error('/owner should serve standalone panel html');

    const businessAuth = (await request('/api/accounts/business', {
      method: 'POST',
      token: normal.session.token,
      body: {
        name: `Бизнес владельца ${suffix}`,
        username: `ownerpanel_${suffix}`.slice(0, 24).toLowerCase(),
        category: 'Туризм и отдых',
        description: 'Проверка панели владельца приложения',
        address: 'Сочи, Курортный 1',
        phone: '+70000000000',
        website: 'https://example.com'
      }
    })).json;
    const businessToken = businessAuth.session.token;
    const businessAccountId = businessAuth.activeAccount.id;

    const offer = (await request('/api/offers', {
      method: 'POST',
      token: businessToken,
      body: { type: 'event', title: 'Экскурсия у моря', coverUrl: 'https://example.com/offer.jpg', address: 'Сочи' }
    })).json.offer;

    await request('/api/metrics/events', { method: 'POST', token: businessToken, body: { eventType: 'profile_view', targetType: 'business', targetId: businessAccountId } });
    await request('/api/metrics/events', { method: 'POST', token: businessToken, body: { eventType: 'route_click', targetType: 'offer', targetId: offer.id } });

    await request('/api/reports', { method: 'POST', token: viewer.session.token, body: { targetType: 'offer', targetId: offer.id, reason: 'other', comment: 'Проверка глобальной очереди' } });

    const overview = (await request('/api/service-owner/overview?period=7d', { token })).json;
    if (overview.users.total < 2 || overview.accounts.business < 1 || overview.content.offers < 1) throw new Error('Overview should aggregate platform users/accounts/content');
    if (overview.activity.routeClicks !== 1 || overview.moderation.total < 1) throw new Error('Overview should include activity and reports');

    const users = (await request(`/api/service-owner/users?query=${encodeURIComponent('normal_')}`, { token })).json;
    if (!users.items.some((item) => item.login === normal.user.login)) throw new Error('Users endpoint should search users');

    const businesses = (await request('/api/service-owner/businesses?query=Туризм', { token })).json;
    if (!businesses.items.some((item) => item.id === businessAccountId)) throw new Error('Businesses endpoint should search businesses');

    const content = (await request('/api/service-owner/content?period=7d', { token })).json;
    if (content.summary.offers < 1 || !content.recent.some((item) => item.id === offer.id)) throw new Error('Content endpoint should include offers');

    const reports = (await request('/api/service-owner/reports', { token })).json;
    if (reports.summary.total < 1 || !reports.items.length) throw new Error('Reports endpoint should include reports');

    const metrics = (await request('/api/service-owner/metrics?period=7d', { token })).json;
    if (metrics.events.byType.route_click !== 1 || metrics.registrations.businesses < 1) throw new Error('Metrics endpoint should include events and registrations');

    const forbidden = await request('/api/service-owner/overview', { token: normal.session.token, allowError: true });
    if (forbidden.status !== 403) throw new Error('Normal session should not access service owner API');

    await request('/api/service-owner/logout', { method: 'POST', token });
    const afterLogout = await request('/api/service-owner/me', { token, allowError: true });
    if (afterLogout.status !== 401) throw new Error('Service owner logout should revoke session');

    console.log('page31.1 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
