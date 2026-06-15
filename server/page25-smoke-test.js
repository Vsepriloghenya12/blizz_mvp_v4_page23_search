const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page25-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4625';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const app = createApp();
const server = app.listen(4625);
const base = 'http://127.0.0.1:4625';

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
    const owner = await register(`page25_owner_${suffix}@test.ru`);
    const viewer = await register(`page25_viewer_${suffix}@test.ru`);

    const created = (await request('/api/videos', {
      method: 'POST',
      token: owner.session.token,
      body: {
        videoUrl: 'https://example.com/page25-video.mp4',
        coverUrl: 'https://example.com/page25-cover.jpg',
        description: 'Видео для отдельного экрана',
        visibility: 'public',
        soundTitle: 'Page 25 sound',
        location: { title: 'Видео-площадка', address: 'Сочи', precision: 'area' }
      }
    })).json.video;

    const detail = (await request(`/api/videos/${created.id}`, { token: viewer.session.token })).json;
    if (!detail.video || detail.video.id !== created.id) throw new Error('Video detail should return requested video');
    if (detail.video.description !== 'Видео для отдельного экрана') throw new Error('Video detail should return description');
    if (!detail.video.author || detail.video.author.id !== owner.activeAccount.id) throw new Error('Video detail should include author');
    if (detail.video.likesCount !== 0 || detail.video.commentsCount !== 0 || detail.video.savesCount !== 0) throw new Error('Video detail should include counters');
    if (detail.video.isLikedByMe !== false || detail.video.isSavedByMe !== false) throw new Error('Video detail should include viewer state');

    await request(`/api/videos/${created.id}/like`, { method: 'POST', token: viewer.session.token });
    const liked = (await request(`/api/videos/${created.id}`, { token: viewer.session.token })).json;
    if (liked.video.likesCount !== 1 || liked.video.isLikedByMe !== true) throw new Error('Video detail should reflect likes');

    await request('/api/settings/me', {
      method: 'PATCH',
      token: owner.session.token,
      body: { privacy: { isPrivateAccount: true } }
    });
    const privateVideo = (await request('/api/videos', {
      method: 'POST',
      token: owner.session.token,
      body: {
        videoUrl: 'https://example.com/page25-private.mp4',
        coverUrl: 'https://example.com/page25-private.jpg',
        description: 'Закрытое видео для отдельного экрана',
        visibility: 'followers',
        soundTitle: 'Private sound'
      }
    })).json.video;

    const denied = await request(`/api/videos/${privateVideo.id}`, { token: viewer.session.token, allowError: true });
    if (denied.status !== 403) throw new Error('Video detail should deny private followers-only content');

    console.log('page25 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
