const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page16-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4596';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4596);
const base = 'http://127.0.0.1:4596';

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
    const first = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page16_first_${suffix}@test.ru`, password: '123456' }
    })).json;
    const second = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page16_second_${suffix}@test.ru`, password: '123456' }
    })).json;
    const outsider = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page16_outsider_${suffix}@test.ru`, password: '123456' }
    })).json;

    const firstToken = first.session.token;
    const secondToken = second.session.token;
    const firstAccountId = first.activeAccount.id;
    const secondAccountId = second.activeAccount.id;
    const clientRequestId = `client_req_${suffix}`;

    const noMembers = await request('/api/messages/groups', {
      method: 'POST',
      token: firstToken,
      body: { title: 'Пустая группа', participantAccountIds: [], clientRequestId: `empty_${suffix}` },
      allowError: true
    });
    if (noMembers.status !== 400) throw new Error('Group without members should be rejected');

    const groupCreate = (await request('/api/messages/groups', {
      method: 'POST',
      token: firstToken,
      body: {
        title: 'Куда пойдём?',
        participantAccountIds: [secondAccountId],
        clientRequestId
      }
    })).json;
    const group = groupCreate.conversation;
    if (!group || group.type !== 'group') throw new Error('Group conversation should be created');
    if (!group.participantAccountIds.includes(firstAccountId) || !group.participantAccountIds.includes(secondAccountId)) {
      throw new Error('Group should include creator and selected member');
    }

    const duplicate = (await request('/api/messages/groups', {
      method: 'POST',
      token: firstToken,
      body: {
        title: 'Куда пойдём?',
        participantAccountIds: [secondAccountId],
        clientRequestId
      }
    })).json;
    if (!duplicate.reused || duplicate.conversation.id !== group.id) throw new Error('Client request id should make group creation idempotent');

    const firstGroups = (await request('/api/messages/conversations?filter=group', { token: firstToken })).json.conversations;
    if (!firstGroups.some((item) => item.id === group.id && item.title === 'Куда пойдём?')) {
      throw new Error('Creator should see group in group filter');
    }

    const secondGroups = (await request('/api/messages/conversations?filter=group', { token: secondToken })).json.conversations;
    if (!secondGroups.some((item) => item.id === group.id)) throw new Error('Member should see group');

    const members = (await request(`/api/messages/groups/${group.id}/members`, { token: firstToken })).json.members;
    if (!members.some((item) => item.id === firstAccountId) || !members.some((item) => item.id === secondAccountId)) {
      throw new Error('Group members endpoint should return both members');
    }

    const firstMessage = (await request('/api/messages', {
      method: 'POST',
      token: firstToken,
      body: { conversationId: group.id, text: 'Привет группе' }
    })).json.message;
    if (firstMessage.senderAccountId !== firstAccountId || firstMessage.actorUserId !== first.user.id) {
      throw new Error('Group message should be sent from activeAccountId and keep actorUserId');
    }

    const secondMessage = (await request('/api/messages', {
      method: 'POST',
      token: secondToken,
      body: { conversationId: group.id, text: 'Я здесь' }
    })).json.message;
    if (secondMessage.senderAccountId !== secondAccountId || secondMessage.actorUserId !== second.user.id) {
      throw new Error('Group member should be able to send message');
    }

    const chat = (await request(`/api/messages/conversations/${group.id}`, { token: firstToken })).json;
    if (chat.messages.length !== 2 || chat.conversation.type !== 'group') throw new Error('Group chat should return messages');

    const forbidden = await request(`/api/messages/conversations/${group.id}`, {
      token: outsider.session.token,
      allowError: true
    });
    if (forbidden.status !== 403) throw new Error('Outsider should not access group');

    const forbiddenSend = await request('/api/messages', {
      method: 'POST',
      token: outsider.session.token,
      body: { conversationId: group.id, text: 'Нельзя' },
      allowError: true
    });
    if (forbiddenSend.status !== 403) throw new Error('Outsider should not send to group');

    console.log('page16 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
