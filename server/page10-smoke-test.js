const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page10-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4590';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4590);
const base = 'http://127.0.0.1:4590';

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
    const auth = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page10_video_${Date.now()}@test.ru`, password: '123456' }
    })).json;
    const token = auth.session.token;

    const missingCover = await request('/api/videos', {
      method: 'POST',
      token,
      body: {
        videoUrl: 'https://example.com/video.mp4',
        coverUrl: '',
        description: 'Без обложки',
        location: null,
        visibility: 'public',
        soundTitle: 'Оригинальный звук'
      },
      allowError: true
    });
    if (missingCover.status !== 400) throw new Error('Video without cover should be rejected');

    const created = (await request('/api/videos', {
      method: 'POST',
      token,
      body: {
        videoUrl: 'https://example.com/video.mp4',
        coverUrl: 'https://example.com/cover.jpg',
        description: 'Видео для проверки',
        location: { title: 'Парк', address: 'Сочи', lat: null, lng: null, precision: 'exact' },
        visibility: 'public',
        soundTitle: 'Оригинальный звук'
      }
    })).json.video;

    if (!created || created.status !== 'published') throw new Error('Published video was not created');

    const myVideos = (await request('/api/videos/my', { token })).json.videos;
    if (myVideos.length !== 1 || myVideos[0].id !== created.id) throw new Error('My videos should include created video');

    const feed = (await request('/api/videos/feed', { token })).json.items;
    if (feed.length !== 1 || feed[0].id !== created.id) throw new Error('Video feed should include created video');
    if (!feed[0].author || !feed[0].author.username) throw new Error('Video feed should include author');

    const like = (await request(`/api/videos/${created.id}/like`, { method: 'POST', token })).json;
    if (!like.isLikedByMe || like.likesCount !== 1) throw new Error('Video like should be active');

    const save = (await request(`/api/videos/${created.id}/save`, { method: 'POST', token })).json;
    if (!save.isSavedByMe || save.savesCount !== 1) throw new Error('Video save should be active');

    const profile = (await request('/api/profile/me', { token })).json.profile;
    if (profile.stats.videos !== 1) throw new Error('Profile video counter should be updated');

    const business = (await request('/api/accounts/business', {
      method: 'POST',
      token,
      body: {
        name: 'Видео бизнес',
        username: `video_biz_${Date.now()}`.slice(0, 24),
        category: 'Развлечения',
        description: 'Проверка видео бизнеса',
        address: 'Сочи',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    })).json;

    const businessVideo = (await request('/api/videos', {
      method: 'POST',
      token: business.session.token,
      body: {
        videoUrl: 'https://example.com/business-video.mp4',
        coverUrl: 'https://example.com/business-cover.jpg',
        description: 'Бизнес-видео',
        location: null,
        visibility: 'public',
        soundTitle: 'Оригинальный звук'
      }
    })).json.video;
    if (businessVideo.accountId !== business.activeAccount.id) throw new Error('Business video should use activeAccountId');

    const state = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const businessMembership = state.accountMemberships.find((item) => item.accountId === business.activeAccount.id);
    businessMembership.role = 'messages';
    fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));

    const forbidden = await request('/api/videos', {
      method: 'POST',
      token: business.session.token,
      body: {
        videoUrl: 'https://example.com/forbidden.mp4',
        coverUrl: 'https://example.com/forbidden.jpg',
        description: 'Не должно пройти',
        location: null,
        visibility: 'public',
        soundTitle: 'Оригинальный звук'
      },
      allowError: true
    });
    if (forbidden.status !== 403) throw new Error('Business messages role should not create videos');

    console.log('page10 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
