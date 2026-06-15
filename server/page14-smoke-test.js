const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page14-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4594';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4594);
const base = 'http://127.0.0.1:4594';

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

function hasSaved(items, targetType, targetId) {
  return items.some((item) => item.targetType === targetType && item.targetId === targetId);
}

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const auth = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page14_${suffix}@test.ru`, password: '123456' }
    })).json;
    const token = auth.session.token;

    const post = (await request('/api/posts', {
      method: 'POST',
      token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/saved-post.jpg' }],
        text: 'Пост для Хочу сходить',
        location: { title: 'Парк', address: 'Сочи, парк', lat: null, lng: null, precision: 'exact' },
        visibility: 'public'
      }
    })).json.post;

    const video = (await request('/api/videos', {
      method: 'POST',
      token,
      body: {
        videoUrl: 'https://example.com/saved-video.mp4',
        coverUrl: 'https://example.com/saved-video.jpg',
        description: 'Видео для сохранённого',
        location: { title: 'Морпорт', address: 'Сочи, Морпорт', lat: null, lng: null, precision: 'exact' },
        visibility: 'public',
        soundTitle: 'Оригинальный звук'
      }
    })).json.video;

    const business = (await request('/api/accounts/business', {
      method: 'POST',
      token,
      body: {
        name: 'Сохранённая кофейня',
        username: `savedbiz_${suffix}`.slice(0, 24),
        category: 'Еда и напитки',
        description: 'Бизнес для сохранённого',
        address: 'Сочи, ул. Морская, 8',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    })).json;
    const businessToken = business.session.token;
    const businessId = business.activeAccount.id;

    const offer = (await request('/api/offers', {
      method: 'POST',
      token: businessToken,
      body: {
        type: 'promo',
        title: 'Сохранённое: завтрак -20%',
        coverUrl: 'https://example.com/saved-offer.jpg',
        description: 'Проверка Хочу сходить',
        priceOrCondition: '-20%',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        address: 'Сочи, ул. Морская, 8',
        location: { title: 'Сохранённая кофейня', address: 'Сочи, ул. Морская, 8', lat: null, lng: null, precision: 'exact' }
      }
    })).json.offer;

    await request('/api/saved', { method: 'POST', token: businessToken, body: { targetType: 'post', targetId: post.id } });
    await request('/api/saved', { method: 'POST', token: businessToken, body: { targetType: 'video', targetId: video.id } });
    await request('/api/saved', { method: 'POST', token: businessToken, body: { targetType: 'offer', targetId: offer.id } });
    await request('/api/saved', { method: 'POST', token: businessToken, body: { targetType: 'business', targetId: businessId } });

    const savedAll = (await request('/api/saved?filter=all', { token: businessToken })).json.items;
    if (!hasSaved(savedAll, 'post', post.id)) throw new Error('Saved should include post');
    if (!hasSaved(savedAll, 'video', video.id)) throw new Error('Saved should include video');
    if (!hasSaved(savedAll, 'offer', offer.id)) throw new Error('Saved should include offer');
    if (!hasSaved(savedAll, 'business', businessId)) throw new Error('Saved should include business');

    const savedOffers = (await request('/api/saved?filter=offer', { token: businessToken })).json.items;
    if (!savedOffers.every((item) => item.targetType === 'offer')) throw new Error('Offer filter should include only offers');

    const savedMap = (await request('/api/map/objects?filter=saved', { token: businessToken })).json.items;
    if (!savedMap.some((item) => item.type === 'business' && item.contentId === businessId)) {
      throw new Error('Map saved filter should include saved business');
    }

    await request(`/api/saved/post/${post.id}`, { method: 'DELETE', token: businessToken });
    const afterRemove = (await request('/api/saved?filter=all', { token: businessToken })).json.items;
    if (hasSaved(afterRemove, 'post', post.id)) throw new Error('Deleted post should not remain saved');

    const outsider = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page14_other_${suffix}@test.ru`, password: '123456' }
    })).json;
    const outsiderSaved = (await request('/api/saved?filter=all', { token: outsider.session.token })).json.items;
    if (outsiderSaved.length !== 0) throw new Error('Saved should be private per active account');

    console.log('page14 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
