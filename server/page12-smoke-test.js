const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page12-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4592';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4592);
const base = 'http://127.0.0.1:4592';

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

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const auth = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page12_${suffix}@test.ru`, password: '123456' }
    })).json;
    const token = auth.session.token;
    const personalAccountId = auth.activeAccount.id;

    const personalPost = (await request('/api/posts', {
      method: 'POST',
      token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/personal.jpg' }],
        text: 'Пользовательский пост для Ленты',
        location: null,
        visibility: 'public'
      }
    })).json.post;

    const business = (await request('/api/accounts/business', {
      method: 'POST',
      token,
      body: {
        name: 'Кофейня витрина',
        username: `showcase_${suffix}`.slice(0, 24),
        category: 'Еда и напитки',
        description: 'Проверка витрины',
        address: 'Сочи, ул. Морская, 10',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    })).json;
    const businessAccountId = business.activeAccount.id;

    const businessPost = (await request('/api/posts', {
      method: 'POST',
      token: business.session.token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/business-post.jpg' }],
        text: 'Бизнес-пост для Витрины',
        location: { title: 'Кофейня витрина', address: 'Сочи', lat: null, lng: null, precision: 'exact' },
        visibility: 'public'
      }
    })).json.post;

    const offer = (await request('/api/offers', {
      method: 'POST',
      token: business.session.token,
      body: {
        type: 'promo',
        title: 'Завтрак -20%',
        coverUrl: 'https://example.com/offer.jpg',
        description: 'Скидка на завтраки до 12:00',
        priceOrCondition: '-20%',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        address: 'Сочи, ул. Морская, 10',
        location: { title: 'Кофейня витрина', address: 'Сочи, ул. Морская, 10', lat: null, lng: null, precision: 'exact' }
      }
    })).json.offer;

    if (!offer || offer.businessAccountId !== businessAccountId) throw new Error('Offer should belong to active business account');

    const personalFeed = (await request('/api/posts/feed?scope=personal', { token: business.session.token })).json.items;
    if (!personalFeed.some((item) => item.id === personalPost.id)) throw new Error('Personal feed should include personal post');
    if (personalFeed.some((item) => item.id === businessPost.id)) throw new Error('Personal feed should not include business post');

    const showcase = (await request('/api/offers/showcase', { token: business.session.token })).json.items;
    if (!showcase.some((item) => item.kind === 'business_post' && item.post.id === businessPost.id)) {
      throw new Error('Showcase should include business posts');
    }
    if (!showcase.some((item) => item.kind === 'offer' && item.offer.id === offer.id)) {
      throw new Error('Showcase should include offers');
    }
    if (showcase.some((item) => item.kind === 'business_post' && item.post.id === personalPost.id)) {
      throw new Error('Showcase should not include personal posts');
    }

    const myOffers = (await request('/api/offers/my', { token: business.session.token })).json.offers;
    if (myOffers.length !== 1 || myOffers[0].id !== offer.id) throw new Error('Business profile showcase should include own offer');

    const publicBusinessOffers = (await request(`/api/business/${businessAccountId}/offers`, { token: business.session.token })).json.offers;
    if (publicBusinessOffers.length !== 1 || publicBusinessOffers[0].id !== offer.id) throw new Error('Public business offers should include active offer');

    const saved = (await request(`/api/offers/${offer.id}/save`, { method: 'POST', token: business.session.token })).json;
    if (!saved.isSavedByMe || saved.savesCount !== 1) throw new Error('Offer should be saved');

    await request('/api/accounts/switch', { method: 'POST', token, body: { accountId: personalAccountId } });
    const forbiddenPersonal = await request('/api/offers', {
      method: 'POST',
      token,
      body: { type: 'promo', title: 'Нельзя', coverUrl: 'https://example.com/no.jpg' },
      allowError: true
    });
    if (forbiddenPersonal.status !== 403) throw new Error('Personal account should not create offers');

    const state = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const membership = state.accountMemberships.find((item) => item.accountId === businessAccountId);
    membership.role = 'messages';
    const session = state.sessions.find((item) => item.token === business.session.token);
    session.activeAccountId = businessAccountId;
    fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));

    const forbiddenMessages = await request('/api/offers', {
      method: 'POST',
      token: business.session.token,
      body: { type: 'promo', title: 'Нельзя messages', coverUrl: 'https://example.com/no2.jpg' },
      allowError: true
    });
    if (forbiddenMessages.status !== 403) throw new Error('Business messages role should not create offers');

    console.log('page12 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
