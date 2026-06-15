const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page07-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4577';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4577);
const base = 'http://127.0.0.1:4577';

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

(async () => {
  try {
    const first = await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page07_first_${Date.now()}@test.ru`, password: '123456' }
    });
    const firstToken = first.session.token;

    const postResponse = await request('/api/posts', {
      method: 'POST',
      token: firstToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/feed-photo.jpg' }],
        text: 'Пост для главной ленты',
        location: { title: 'Парк Ривьера', address: 'Сочи', lat: null, lng: null, precision: 'exact' },
        visibility: 'public'
      }
    });

    const firstFeed = await request('/api/posts/feed', { token: firstToken });
    if (firstFeed.items.length !== 1) throw new Error('Expected one item in feed for author');
    if (!firstFeed.items[0].author || firstFeed.items[0].author.username !== first.activeAccount.username) {
      throw new Error('Feed item author is missing or incorrect');
    }

    const second = await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page07_second_${Date.now()}@test.ru`, password: '123456' }
    });
    const secondToken = second.session.token;

    const secondFeed = await request('/api/posts/feed', { token: secondToken });
    if (secondFeed.items.length !== 1) throw new Error('Expected one public item in feed for second user');
    if (secondFeed.items[0].isLikedByMe) throw new Error('Post should not be liked before action');
    if (secondFeed.items[0].isSavedByMe) throw new Error('Post should not be saved before action');

    const like = await request(`/api/posts/${postResponse.post.id}/like`, { method: 'POST', token: secondToken });
    if (!like.isLikedByMe || like.likesCount !== 1) throw new Error('Post like was not created');

    const save = await request(`/api/posts/${postResponse.post.id}/save`, { method: 'POST', token: secondToken });
    if (!save.isSavedByMe || save.savesCount !== 1) throw new Error('Post save was not created');

    const secondFeedAfter = await request('/api/posts/feed', { token: secondToken });
    if (!secondFeedAfter.items[0].isLikedByMe || secondFeedAfter.items[0].likesCount !== 1) {
      throw new Error('Like state did not persist in feed');
    }
    if (!secondFeedAfter.items[0].isSavedByMe || secondFeedAfter.items[0].savesCount !== 1) {
      throw new Error('Save state did not persist in feed');
    }

    const unlike = await request(`/api/posts/${postResponse.post.id}/like`, { method: 'POST', token: secondToken });
    if (unlike.isLikedByMe || unlike.likesCount !== 0) throw new Error('Post like was not toggled off');

    console.log('page07 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
