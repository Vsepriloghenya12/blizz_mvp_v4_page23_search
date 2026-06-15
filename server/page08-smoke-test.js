const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page08-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4588';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4588);
const base = 'http://127.0.0.1:4588';

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
    const author = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page08_author_${Date.now()}@test.ru`, password: '123456' }
    })).json;
    const authorToken = author.session.token;

    const post = (await request('/api/posts', {
      method: 'POST',
      token: authorToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/comments-photo.jpg' }],
        text: 'Пост для проверки комментариев',
        location: { title: 'Парк Ривьера', address: 'Сочи', lat: null, lng: null, precision: 'exact' },
        visibility: 'public'
      }
    })).json.post;

    const viewer = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page08_viewer_${Date.now()}@test.ru`, password: '123456' }
    })).json;
    const viewerToken = viewer.session.token;

    const emptyComments = (await request(`/api/posts/${post.id}/comments`, { token: viewerToken })).json;
    if (emptyComments.comments.length !== 0) throw new Error('Expected empty comments list');

    const commentResult = (await request(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      token: viewerToken,
      body: { text: 'Классное место!' }
    })).json;
    if (!commentResult.comment || commentResult.commentsCount !== 1) throw new Error('Comment was not created');
    if (commentResult.comment.author.username !== viewer.activeAccount.username) {
      throw new Error('Comment author should use activeAccountId');
    }
    if (!commentResult.comment.canDelete) throw new Error('Comment author must be able to delete own comment');

    const feedAfterComment = (await request('/api/posts/feed', { token: viewerToken })).json;
    if (feedAfterComment.items[0].commentsCount !== 1) throw new Error('Feed commentsCount did not update');

    const commentsForAuthor = (await request(`/api/posts/${post.id}/comments`, { token: authorToken })).json;
    if (!commentsForAuthor.comments[0].canDelete) throw new Error('Post author must be able to delete comment');

    const deleteResult = (await request(`/api/comments/${commentResult.comment.id}`, {
      method: 'DELETE',
      token: authorToken
    })).json;
    if (deleteResult.commentsCount !== 0) throw new Error('Comment was not deleted by post author');

    const commentsAfterDelete = (await request(`/api/posts/${post.id}/comments`, { token: viewerToken })).json;
    if (commentsAfterDelete.comments.length !== 0) throw new Error('Deleted comment should not be listed');

    const emptyComment = await request(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      token: viewerToken,
      body: { text: '   ' },
      allowError: true
    });
    if (emptyComment.status !== 400) throw new Error('Empty comment should be rejected');

    const stranger = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page08_stranger_${Date.now()}@test.ru`, password: '123456' }
    })).json;
    const strangerToken = stranger.session.token;
    const secondComment = (await request(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      token: viewerToken,
      body: { text: 'Комментарий для проверки прав удаления' }
    })).json.comment;
    const forbiddenDelete = await request(`/api/comments/${secondComment.id}`, {
      method: 'DELETE',
      token: strangerToken,
      allowError: true
    });
    if (forbiddenDelete.status !== 403) throw new Error('Stranger should not delete comment');

    console.log('page08 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
