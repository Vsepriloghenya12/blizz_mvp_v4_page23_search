const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page06-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4576';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4576);
const base = 'http://127.0.0.1:4576';

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
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function requestExpectError(pathname, options = {}, expectedStatus) {
  const response = await fetch(`${base}${pathname}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (response.status !== expectedStatus) {
    const text = await response.text();
    throw new Error(`Expected ${expectedStatus} for ${pathname}, got ${response.status}: ${text}`);
  }
}

(async () => {
  try {
    const register = await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page06_${Date.now()}@test.ru`, password: '123456' }
    });
    const token = register.session.token;

    const draft = await request('/api/posts/drafts', {
      method: 'POST',
      token,
      body: {
        media: [],
        text: 'Черновик первого поста',
        location: null,
        visibility: 'public'
      }
    });
    if (!draft.draft || draft.draft.status !== 'draft') throw new Error('Draft was not created');

    const published = await request('/api/posts', {
      method: 'POST',
      token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/photo.jpg' }],
        text: 'Опубликованный пост',
        location: { title: 'Парк Ривьера', address: 'Сочи', lat: null, lng: null, precision: 'exact' },
        visibility: 'public'
      }
    });
    if (!published.post || published.post.status !== 'published') throw new Error('Post was not published');

    const posts = await request('/api/posts/my', { token });
    if (posts.posts.length !== 1) throw new Error('Expected one published post');

    const drafts = await request('/api/posts/drafts', { token });
    if (drafts.drafts.length !== 1) throw new Error('Expected one draft');

    const profile = await request('/api/profile/me', { token });
    if (profile.profile.stats.posts !== 1) throw new Error('Profile post counter was not updated');
    if (profile.profile.stats.drafts !== 1) throw new Error('Profile draft counter was not updated');

    await requestExpectError('/api/posts', {
      method: 'POST',
      token,
      body: { media: [], text: 'No media', location: null, visibility: 'public' }
    }, 400);

    const business = await request('/api/accounts/business', {
      method: 'POST',
      token,
      body: {
        name: 'Кофейня Постов',
        username: `coffee_posts_${Date.now()}`.slice(0, 24),
        category: 'Еда и напитки',
        description: '',
        address: '',
        phone: '',
        website: ''
      }
    });

    await request('/api/posts', {
      method: 'POST',
      token: business.session.token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/business.jpg' }],
        text: 'Пост бизнеса',
        location: null,
        visibility: 'public'
      }
    });

    console.log('page06 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
