const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page24-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4624';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const app = createApp();
const server = app.listen(4624);
const base = 'http://127.0.0.1:4624';

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
    const owner = await register(`page24_owner_${suffix}@test.ru`);
    const viewer = await register(`page24_viewer_${suffix}@test.ru`);

    const created = (await request('/api/posts', {
      method: 'POST',
      token: owner.session.token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/page24-post.jpg' }],
        text: 'Пост для отдельного экрана',
        visibility: 'public',
        location: { title: 'Площадь поиска', address: 'Сочи', precision: 'area' }
      }
    })).json.post;

    const detail = (await request(`/api/posts/${created.id}`, { token: viewer.session.token })).json;
    if (!detail.post || detail.post.id !== created.id) throw new Error('Post detail should return requested post');
    if (detail.post.text !== 'Пост для отдельного экрана') throw new Error('Post detail should return post text');
    if (!detail.post.author || detail.post.author.id !== owner.activeAccount.id) throw new Error('Post detail should include author');
    if (detail.post.likesCount !== 0 || detail.post.commentsCount !== 0 || detail.post.savesCount !== 0) throw new Error('Post detail should include counters');
    if (detail.post.isLikedByMe !== false || detail.post.isSavedByMe !== false) throw new Error('Post detail should include viewer state');

    await request(`/api/posts/${created.id}/like`, { method: 'POST', token: viewer.session.token });
    const liked = (await request(`/api/posts/${created.id}`, { token: viewer.session.token })).json;
    if (liked.post.likesCount !== 1 || liked.post.isLikedByMe !== true) throw new Error('Post detail should reflect likes');

    await request('/api/settings/me', {
      method: 'PATCH',
      token: owner.session.token,
      body: { privacy: { isPrivateAccount: true } }
    });
    const privatePost = (await request('/api/posts', {
      method: 'POST',
      token: owner.session.token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/page24-private.jpg' }],
        text: 'Закрытый пост для отдельного экрана',
        visibility: 'followers'
      }
    })).json.post;

    const denied = await request(`/api/posts/${privatePost.id}`, { token: viewer.session.token, allowError: true });
    if (denied.status !== 403) throw new Error('Post detail should deny private followers-only content');

    console.log('page24 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
