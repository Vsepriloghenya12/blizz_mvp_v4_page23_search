const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page23-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4623';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const app = createApp();
const server = app.listen(4623);
const base = 'http://127.0.0.1:4623';

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

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const owner = await register(`page23_owner_${suffix}@test.ru`);
    const ownerToken = owner.session.token;
    const ownerAccountId = owner.activeAccount.id;

    await request('/api/posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/search-post.jpg' }],
        text: 'Пост про морскую набережную и кофе',
        visibility: 'public',
        location: { title: 'Морская набережная', address: 'Сочи, Морская улица', precision: 'area' }
      }
    });

    await request('/api/videos', {
      method: 'POST',
      token: ownerToken,
      body: {
        videoUrl: 'https://example.com/search-video.mp4',
        coverUrl: 'https://example.com/search-video.jpg',
        description: 'Видео про прогулку на Морской',
        visibility: 'public',
        soundTitle: 'Оригинальный звук',
        location: { title: 'Морская площадь', address: 'Сочи', precision: 'area' }
      }
    });

    const viewer = await register(`page23_viewer_${suffix}@test.ru`);
    const viewerToken = viewer.session.token;

    const businessAuth = await request('/api/accounts/business', {
      method: 'POST',
      token: viewerToken,
      body: {
        name: `Кофейня Морская ${suffix}`,
        username: `coffee_search_${suffix}`.toLowerCase(),
        category: 'Еда и напитки',
        description: 'Кофе рядом с морем',
        address: 'Сочи, Морская 1',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    });
    const businessToken = businessAuth.json.session.token;
    const businessId = businessAuth.json.activeAccount.id;

    const offer = (await request('/api/offers', {
      method: 'POST',
      token: businessToken,
      body: {
        type: 'promo',
        title: 'Скидка на капучино у моря',
        coverUrl: 'https://example.com/cappuccino.jpg',
        description: 'Утреннее предложение на кофе',
        priceOrCondition: '-20%',
        address: 'Сочи, Морская 1',
        location: { title: 'Кофейня Морская', address: 'Сочи, Морская 1', precision: 'exact' }
      }
    })).json.offer;

    const all = (await request('/api/search?q=морская&type=all', { token: ownerToken })).json;
    if (!all.results.some((item) => item.type === 'business' && item.targetId === businessId)) throw new Error('Search all should find business');
    if (!all.results.some((item) => item.type === 'offer' && item.targetId === offer.id)) throw new Error('Search all should find offer');
    if (!all.results.some((item) => item.type === 'post')) throw new Error('Search all should find post');
    if (!all.results.some((item) => item.type === 'video')) throw new Error('Search all should find video');
    if (!all.results.some((item) => item.type === 'place')) throw new Error('Search all should find place');

    const people = (await request('/api/search?q=user&type=people', { token: viewerToken })).json;
    if (!people.results.every((item) => item.type === 'person')) throw new Error('People filter should only return people');

    await request('/api/search/recent', {
      method: 'POST',
      token: ownerToken,
      body: { query: 'морская', targetType: 'business', targetId: businessId, title: 'Кофейня Морская', subtitle: 'Кофейня' }
    });
    const recent = (await request('/api/search/recent', { token: ownerToken })).json;
    if (!recent.items.length || recent.items[0].targetType !== 'business') throw new Error('Recent search should be saved');
    await request(`/api/search/recent/${recent.items[0].id}`, { method: 'DELETE', token: ownerToken });
    const afterDelete = (await request('/api/search/recent', { token: ownerToken })).json;
    if (afterDelete.items.length !== 0) throw new Error('Recent search should be deleted');

    await request('/api/settings/me', {
      method: 'PATCH',
      token: ownerToken,
      body: { privacy: { isPrivateAccount: true } }
    });
    await request('/api/posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/hidden-search.jpg' }],
        text: 'Скрытый поиск только для подписчиков',
        visibility: 'followers'
      }
    });
    const hidden = (await request('/api/search?q=скрытый&type=posts', { token: viewerToken })).json;
    if (hidden.results.length !== 0) throw new Error('Followers-only private content should not appear in search');

    console.log('page23 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
