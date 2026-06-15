const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page13-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4593';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4593);
const base = 'http://127.0.0.1:4593';

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

function hasType(items, type, contentId) {
  return items.some((item) => item.type === type && (!contentId || item.contentId === contentId));
}

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const auth = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page13_${suffix}@test.ru`, password: '123456' }
    })).json;
    const token = auth.session.token;

    const post = (await request('/api/posts', {
      method: 'POST',
      token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/map-post.jpg' }],
        text: 'Пост с геометкой для карты',
        location: { title: 'Парк Ривьера', address: 'Сочи, парк Ривьера', lat: null, lng: null, precision: 'exact' },
        visibility: 'public'
      }
    })).json.post;

    const privatePost = (await request('/api/posts', {
      method: 'POST',
      token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/private-map-post.jpg' }],
        text: 'Закрытый собственный пост виден владельцу',
        location: { title: 'Дом', address: 'Сочи', lat: null, lng: null, precision: 'area' },
        visibility: 'followers'
      }
    })).json.post;

    const video = (await request('/api/videos', {
      method: 'POST',
      token,
      body: {
        videoUrl: 'https://example.com/video.mp4',
        coverUrl: 'https://example.com/video-cover.jpg',
        description: 'Видео с геометкой',
        location: { title: 'Морпорт', address: 'Сочи, Морпорт', lat: null, lng: null, precision: 'exact' },
        visibility: 'public',
        soundTitle: 'Оригинальный звук'
      }
    })).json.video;

    const story = (await request('/api/stories', {
      method: 'POST',
      token,
      body: {
        mediaType: 'image',
        mediaUrl: 'https://example.com/story.jpg',
        text: 'Близз с геометкой',
        location: { title: 'Набережная', address: 'Сочи, набережная', lat: null, lng: null, precision: 'exact' },
        visibility: 'public'
      }
    })).json.story;

    const business = (await request('/api/accounts/business', {
      method: 'POST',
      token,
      body: {
        name: 'Кофейня на карте',
        username: `mapbiz_${suffix}`.slice(0, 24),
        category: 'Еда и напитки',
        description: 'Проверка карты',
        address: 'Сочи, ул. Морская, 10',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    })).json;
    const businessToken = business.session.token;
    const businessAccountId = business.activeAccount.id;

    const offer = (await request('/api/offers', {
      method: 'POST',
      token: businessToken,
      body: {
        type: 'promo',
        title: 'Карта: завтрак -20%',
        coverUrl: 'https://example.com/map-offer.jpg',
        description: 'Скидка рядом',
        priceOrCondition: '-20%',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        address: 'Сочи, ул. Морская, 10',
        location: { title: 'Кофейня на карте', address: 'Сочи, ул. Морская, 10', lat: null, lng: null, precision: 'exact' }
      }
    })).json.offer;

    const all = (await request('/api/map/objects?filter=all', { token: businessToken })).json.items;
    if (!hasType(all, 'post', post.id)) throw new Error('Map should include public post with location');
    if (!hasType(all, 'video', video.id)) throw new Error('Map should include public video with location');
    if (!hasType(all, 'story', story.id)) throw new Error('Map should include active story with location');
    if (!hasType(all, 'business', businessAccountId)) throw new Error('Map should include business with address');
    if (!hasType(all, 'offer', offer.id)) throw new Error('Map should include active offer with location');

    const postFilter = (await request('/api/map/objects?filter=post', { token: businessToken })).json.items;
    if (!postFilter.every((item) => item.type === 'post')) throw new Error('Post filter should include only posts');

    await request('/api/posts/' + post.id + '/save', { method: 'POST', token: businessToken });
    await request('/api/videos/' + video.id + '/save', { method: 'POST', token: businessToken });
    await request('/api/offers/' + offer.id + '/save', { method: 'POST', token: businessToken });

    const saved = (await request('/api/map/objects?filter=saved', { token: businessToken })).json.items;
    if (!hasType(saved, 'post', post.id)) throw new Error('Saved map should include saved post');
    if (!hasType(saved, 'video', video.id)) throw new Error('Saved map should include saved video');
    if (!hasType(saved, 'offer', offer.id)) throw new Error('Saved map should include saved offer');
    if (saved.some((item) => item.contentId === privatePost.id)) throw new Error('Saved filter should not include unsaved private post');

    const outsider = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page13_other_${suffix}@test.ru`, password: '123456' }
    })).json;
    const outsiderMap = (await request('/api/map/objects?filter=post', { token: outsider.session.token })).json.items;
    if (outsiderMap.some((item) => item.contentId === privatePost.id)) {
      throw new Error('Map should not expose non-public post to another account');
    }

    console.log('page13 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
