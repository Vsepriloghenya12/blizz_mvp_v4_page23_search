const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { isBlockedBetween, assertNotBlocked } = require('../blocks/blocks.service');
const { createNotification } = require('../notifications/notifications.service');

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function ensureArrays(state) {
  state.conversations = state.conversations || [];
  state.messages = state.messages || [];
  state.messageReads = state.messageReads || [];
  state.groupCreationRequests = state.groupCreationRequests || [];
  state.gameSessions = state.gameSessions || [];
  state.gameAnswers = state.gameAnswers || [];
}

function getActiveAccountContext(state, userId, activeAccountId) {
  const membership = state.accountMemberships.find((item) => {
    return item.userId === userId && item.accountId === activeAccountId && item.status === 'active';
  });

  if (!membership) {
    throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к активному аккаунту');
  }

  const account = state.accounts.find((item) => item.id === activeAccountId && item.status !== 'archived');
  if (!account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }

  return { account, membership };
}

function accountById(state, accountId) {
  return state.accounts.find((account) => account.id === accountId && account.status !== 'archived') || null;
}

function businessProfileByAccountId(state, accountId) {
  return (state.businessProfiles || []).find((profile) => profile.accountId === accountId) || null;
}

function publicAccount(state, accountId) {
  const account = accountById(state, accountId);
  if (!account) return null;
  const businessProfile = account.type === 'business' ? businessProfileByAccountId(state, account.id) : null;

  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    businessCategory: businessProfile ? businessProfile.category : null
  };
}

function assertConversationAccess(conversation, activeAccountId) {
  if (!conversation || conversation.status === 'archived') {
    throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Диалог не найден');
  }

  if (!Array.isArray(conversation.participantAccountIds) || !conversation.participantAccountIds.includes(activeAccountId)) {
    throw new HttpError(403, 'CONVERSATION_ACCESS_DENIED', 'Нет доступа к диалогу');
  }
}

function normalizeParticipantIds(ids) {
  return Array.from(new Set(ids.filter(Boolean))).sort();
}

function assertParticipantsCanInteract(state, participantAccountIds, activeAccountId) {
  const blockedTarget = (participantAccountIds || []).find((accountId) => {
    return accountId !== activeAccountId && isBlockedBetween(state, activeAccountId, accountId);
  });
  if (blockedTarget) {
    throw new HttpError(403, 'ACCOUNT_BLOCKED', 'Вы не можете отправить сообщение этому аккаунту');
  }
}

function findPersonalConversation(state, firstAccountId, secondAccountId) {
  const targetParticipants = normalizeParticipantIds([firstAccountId, secondAccountId]);
  return (state.conversations || []).find((conversation) => {
    if (conversation.type !== 'personal' || conversation.status === 'archived') return false;
    const participants = normalizeParticipantIds(conversation.participantAccountIds || []);
    return participants.length === targetParticipants.length && participants.every((id, index) => id === targetParticipants[index]);
  }) || null;
}

function findBusinessConversation(state, customerAccountId, businessAccountId) {
  return (state.conversations || []).find((conversation) => {
    return conversation.type === 'business'
      && conversation.status !== 'archived'
      && conversation.customerAccountId === customerAccountId
      && conversation.businessAccountId === businessAccountId;
  }) || null;
}

function ensurePersonalConversation(state, firstAccountId, secondAccountId) {
  ensureArrays(state);
  if (!firstAccountId || !secondAccountId) {
    throw new HttpError(400, 'CONVERSATION_TARGET_REQUIRED', 'Не выбран получатель');
  }
  if (firstAccountId === secondAccountId) {
    throw new HttpError(400, 'CONVERSATION_SELF_FORBIDDEN', 'Нельзя создать диалог с самим собой');
  }

  const firstAccount = accountById(state, firstAccountId);
  const secondAccount = accountById(state, secondAccountId);
  if (!firstAccount || !secondAccount) {
    throw new HttpError(404, 'CONVERSATION_ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }

  assertNotBlocked(state, firstAccountId, secondAccountId, 'Нельзя создать диалог с заблокированным аккаунтом');

  const existing = findPersonalConversation(state, firstAccountId, secondAccountId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation = {
    id: createId('conv'),
    type: 'personal',
    participantAccountIds: normalizeParticipantIds([firstAccountId, secondAccountId]),
    customerAccountId: null,
    businessAccountId: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastMessageAt: null
  };
  state.conversations.push(conversation);
  return conversation;
}

function ensureBusinessConversation(state, customerAccountId, businessAccountId) {
  ensureArrays(state);
  if (!customerAccountId || !businessAccountId) {
    throw new HttpError(400, 'CONVERSATION_TARGET_REQUIRED', 'Не выбран бизнес');
  }
  if (customerAccountId === businessAccountId) {
    throw new HttpError(400, 'BUSINESS_CHAT_SELF_FORBIDDEN', 'Нельзя написать своему активному бизнесу как клиент');
  }

  const customerAccount = accountById(state, customerAccountId);
  const businessAccount = accountById(state, businessAccountId);
  if (!customerAccount) {
    throw new HttpError(404, 'CUSTOMER_ACCOUNT_NOT_FOUND', 'Аккаунт клиента не найден');
  }
  if (!businessAccount || businessAccount.type !== 'business') {
    throw new HttpError(404, 'BUSINESS_ACCOUNT_NOT_FOUND', 'Бизнес не найден');
  }

  assertNotBlocked(state, customerAccountId, businessAccountId, 'Нельзя создать бизнес-чат с заблокированным аккаунтом');

  const existing = findBusinessConversation(state, customerAccountId, businessAccountId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation = {
    id: createId('conv'),
    type: 'business',
    participantAccountIds: normalizeParticipantIds([customerAccountId, businessAccountId]),
    customerAccountId,
    businessAccountId,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastMessageAt: null
  };
  state.conversations.push(conversation);
  return conversation;
}

function lastMessageForConversation(state, conversationId) {
  return (state.messages || [])
    .filter((message) => message.conversationId === conversationId && message.status !== 'deleted')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] || null;
}

function messagePreview(state, message) {
  if (!message) return 'Нет сообщений';
  if (message.type === 'text') return message.text || 'Сообщение';
  if (message.type === 'shared_content') return 'Отправлен пост';
  if (message.type === 'story_reply') {
    const reply = (state.storyReplies || []).find((item) => item.id === message.storyReplyId);
    return reply && reply.text ? `Ответ на Близз: ${reply.text}` : 'Ответ на Близз';
  }
  if (message.type === 'game_invite') {
    const session = (state.gameSessions || []).find((item) => item.id === message.gameSessionId);
    return session && session.type === 'shells' ? 'Игра: Напёрстки' : 'Игра: Угадай карту';
  }
  if (message.type === 'game_result') {
    const session = (state.gameSessions || []).find((item) => item.id === message.gameSessionId);
    return session && session.type === 'shells' ? 'Результат игры: Напёрстки' : 'Результат игры: Угадай карту';
  }
  return 'Сообщение';
}

function counterpartForConversation(state, conversation, activeAccountId) {
  if (conversation.type === 'group') {
    return null;
  }

  if (conversation.type === 'business') {
    if (activeAccountId === conversation.businessAccountId) {
      return publicAccount(state, conversation.customerAccountId);
    }
    return publicAccount(state, conversation.businessAccountId);
  }

  const otherAccountId = (conversation.participantAccountIds || []).find((id) => id !== activeAccountId) || activeAccountId;
  return publicAccount(state, otherAccountId);
}

function publicConversation(state, conversation, activeAccountId) {
  const lastMessage = lastMessageForConversation(state, conversation.id);
  const counterpart = counterpartForConversation(state, conversation, activeAccountId);
  const isGroup = conversation.type === 'group';
  return {
    id: conversation.id,
    type: conversation.type,
    participantAccountIds: conversation.participantAccountIds || [],
    customerAccountId: conversation.customerAccountId || null,
    businessAccountId: conversation.businessAccountId || null,
    title: isGroup ? (conversation.title || 'Группа') : (counterpart?.name || 'Диалог'),
    counterpart,
    membersCount: isGroup ? (conversation.participantAccountIds || []).length : null,
    createdByAccountId: conversation.createdByAccountId || null,
    lastMessagePreview: messagePreview(state, lastMessage),
    lastMessageAt: conversation.lastMessageAt || lastMessage?.createdAt || conversation.createdAt,
    unreadCount: 0,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
}

function postPreview(state, postId) {
  const post = (state.posts || []).find((item) => item.id === postId);
  if (!post) return null;
  const author = publicAccount(state, post.accountId);
  const firstMedia = Array.isArray(post.media) && post.media[0] ? post.media[0] : null;
  return {
    id: post.id,
    type: 'post',
    title: author ? author.name : 'Пост',
    subtitle: post.text || 'Пост',
    imageUrl: firstMedia ? firstMedia.url : null,
    author
  };
}

function storyPreview(state, storyId) {
  const story = (state.stories || []).find((item) => item.id === storyId);
  if (!story) return null;
  const author = publicAccount(state, story.accountId);
  return {
    id: story.id,
    type: 'story',
    title: author ? `Близз · ${author.name}` : 'Близз',
    subtitle: story.text || 'Близз',
    imageUrl: story.mediaType === 'image' ? story.mediaUrl : null,
    author
  };
}

function sharedContentPayload(state, sharedContentId) {
  const sharedContent = (state.sharedContents || []).find((item) => item.id === sharedContentId);
  if (!sharedContent) return null;
  return {
    id: sharedContent.id,
    type: sharedContent.type,
    contentId: sharedContent.contentId,
    createdAt: sharedContent.createdAt,
    preview: sharedContent.type === 'post' ? postPreview(state, sharedContent.contentId) : null
  };
}

function storyReplyPayload(state, storyReplyId) {
  const reply = (state.storyReplies || []).find((item) => item.id === storyReplyId);
  if (!reply) return null;
  return {
    id: reply.id,
    storyId: reply.storyId,
    text: reply.text,
    createdAt: reply.createdAt,
    story: storyPreview(state, reply.storyId)
  };
}


function gameSessionTitle(type) {
  if (type === 'shells') return 'Напёрстки';
  if (type === 'football') return 'Футбол';
  return 'Угадай карту';
}

function gameSessionPayload(state, gameSessionId, activeAccountId) {
  const session = (state.gameSessions || []).find((item) => item.id === gameSessionId);
  if (!session) return null;
  const answer = (state.gameAnswers || []).find((item) => item.sessionId === session.id && item.accountId === activeAccountId) || null;
  const creator = publicAccount(state, session.createdByAccountId);
  const showCardResult = session.type === 'card_guess' && (session.status === 'finished' || Boolean(answer));
  const shellsRounds = session.type === 'shells' && answer && Array.isArray(answer.rounds) ? answer.rounds : [];
  const lastShellRound = shellsRounds.length > 0 ? shellsRounds[shellsRounds.length - 1] : null;
  const roundsTotal = session.type === 'shells' ? (session.state?.roundsTotal || 5) : null;
  const shellsFinished = session.type === 'shells' && shellsRounds.length >= (roundsTotal || 5);

  return {
    id: session.id,
    conversationId: session.conversationId,
    type: session.type,
    title: gameSessionTitle(session.type),
    status: session.status,
    createdByAccountId: session.createdByAccountId,
    creator,
    round: session.type === 'shells' ? Math.min(shellsRounds.length + 1, roundsTotal || 5) : (session.round || 1),
    roundsTotal,
    cards: session.type === 'card_guess' ? (session.state?.cards || []) : [],
    cups: session.type === 'shells' ? (session.state?.cups || []) : [],
    selectedIndex: session.type === 'card_guess' && answer ? answer.answerIndex : null,
    winningIndex: showCardResult ? session.state?.winningIndex : null,
    selectedCup: lastShellRound ? lastShellRound.selectedCup : null,
    ballPosition: lastShellRound ? lastShellRound.ballPosition : null,
    lastRoundResult: lastShellRound ? lastShellRound.result : null,
    shellsRounds,
    shellsFinished,
    correctAnswers: session.type === 'shells' && answer ? answer.correctAnswers : 0,
    isCorrect: answer ? answer.isCorrect : null,
    score: answer ? answer.score : 0,
    scoreboard: session.scoreboard || [],
    resultMessageId: session.resultMessageId || null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    finishedAt: session.finishedAt || null
  };
}

function publicMessage(state, message, activeAccountId) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderAccountId: message.senderAccountId,
    actorUserId: message.actorUserId,
    sender: publicAccount(state, message.senderAccountId),
    type: message.type,
    text: message.text || '',
    sharedContent: message.sharedContentId ? sharedContentPayload(state, message.sharedContentId) : null,
    storyReply: message.storyReplyId ? storyReplyPayload(state, message.storyReplyId) : null,
    gameSession: message.gameSessionId ? gameSessionPayload(state, message.gameSessionId, activeAccountId) : null,
    status: message.status,
    isMine: message.senderAccountId === activeAccountId,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
}

function notificationPayloadForMessage(state, conversation, message) {
  const sender = publicAccount(state, message.senderAccountId);
  const senderName = sender ? sender.name : 'Новый контакт';
  if (message.type === 'story_reply') {
    const reply = (state.storyReplies || []).find((item) => item.id === message.storyReplyId);
    return {
      type: 'story_reply',
      title: `${senderName} ответил на ваш Близз`,
      body: message.text || 'Ответ на Близз',
      targetType: 'story',
      targetId: reply ? reply.storyId : message.storyReplyId
    };
  }
  if (message.type === 'game_invite') {
    return {
      type: 'game_invite',
      title: `${senderName} пригласил вас в игру`,
      body: message.text || 'Новая игра в чате',
      targetType: 'game',
      targetId: message.gameSessionId || conversation.id
    };
  }
  if (message.type === 'game_result') {
    return {
      type: 'game_result',
      title: 'Результат игры',
      body: message.text || 'Игра завершена',
      targetType: 'game',
      targetId: message.gameSessionId || conversation.id
    };
  }
  if (conversation.type === 'group') {
    return {
      type: 'group_message',
      title: conversation.title || 'Группа',
      body: `${senderName}: ${messagePreview(state, message)}`,
      targetType: 'chat',
      targetId: conversation.id
    };
  }
  if (conversation.type === 'business') {
    return {
      type: 'business_message',
      title: senderName,
      body: messagePreview(state, message),
      targetType: 'chat',
      targetId: conversation.id
    };
  }
  return {
    type: 'direct_message',
    title: senderName,
    body: messagePreview(state, message),
    targetType: 'chat',
    targetId: conversation.id
  };
}

function notifyConversationParticipants(state, conversation, message) {
  const payload = notificationPayloadForMessage(state, conversation, message);
  (conversation.participantAccountIds || [])
    .filter((accountId) => accountId && accountId !== message.senderAccountId)
    .forEach((accountId) => {
      createNotification(state, {
        accountId,
        userId: null,
        ...payload,
        actorAccountId: message.senderAccountId
      });
    });
}

function appendMessage(state, { conversation, senderAccountId, actorUserId, type, text = '', sharedContentId = null, storyReplyId = null, gameSessionId = null }) {
  ensureArrays(state);
  const now = new Date().toISOString();
  const message = {
    id: createId('msg'),
    conversationId: conversation.id,
    senderAccountId,
    actorUserId,
    type,
    text,
    sharedContentId,
    storyReplyId,
    gameSessionId,
    status: 'sent',
    createdAt: now,
    updatedAt: now
  };
  state.messages.push(message);
  conversation.lastMessageAt = now;
  conversation.updatedAt = now;
  notifyConversationParticipants(state, conversation, message);
  return message;
}

function listConversations({ userId, activeAccountId, filter }) {
  const safeFilter = sanitizeString(filter) || 'all';
  const state = db.read();
  getActiveAccountContext(state, userId, activeAccountId);
  ensureArrays(state);

  let conversations = (state.conversations || [])
    .filter((conversation) => conversation.status !== 'archived')
    .filter((conversation) => (conversation.participantAccountIds || []).includes(activeAccountId));

  if (safeFilter === 'personal') {
    conversations = conversations.filter((conversation) => conversation.type === 'personal');
  }
  if (safeFilter === 'business') {
    conversations = conversations.filter((conversation) => conversation.type === 'business');
  }
  if (safeFilter === 'group') {
    conversations = conversations.filter((conversation) => conversation.type === 'group');
  }

  return {
    filter: ['all', 'personal', 'business', 'group'].includes(safeFilter) ? safeFilter : 'all',
    conversations: conversations
      .map((conversation) => publicConversation(state, conversation, activeAccountId))
      .sort((a, b) => String(b.lastMessageAt || '').localeCompare(String(a.lastMessageAt || '')))
  };
}

function getConversation({ userId, activeAccountId, conversationId }) {
  const state = db.read();
  getActiveAccountContext(state, userId, activeAccountId);
  ensureArrays(state);

  const conversation = (state.conversations || []).find((item) => item.id === conversationId);
  assertConversationAccess(conversation, activeAccountId);

  const messages = (state.messages || [])
    .filter((message) => message.conversationId === conversation.id && message.status !== 'deleted')
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .map((message) => publicMessage(state, message, activeAccountId));

  return {
    conversation: publicConversation(state, conversation, activeAccountId),
    messages
  };
}

function createConversation({ userId, activeAccountId, input }) {
  const payload = input || {};
  const type = sanitizeString(payload.type) || 'personal';

  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    ensureArrays(state);

    let conversation;
    if (type === 'business') {
      const businessAccountId = sanitizeString(payload.businessAccountId);
      conversation = ensureBusinessConversation(state, account.id, businessAccountId);
    } else if (type === 'personal') {
      const targetAccountId = sanitizeString(payload.targetAccountId);
      conversation = ensurePersonalConversation(state, account.id, targetAccountId);
    } else {
      throw new HttpError(400, 'CONVERSATION_TYPE_INVALID', 'Неподдерживаемый тип диалога');
    }

    return { conversation: publicConversation(state, conversation, account.id) };
  });
}


function createGroupConversation({ userId, activeAccountId, input }) {
  const payload = input || {};
  const title = sanitizeString(payload.title);
  const clientRequestId = sanitizeString(payload.clientRequestId);
  const rawParticipantIds = Array.isArray(payload.participantAccountIds) ? payload.participantAccountIds : [];

  if (!title) {
    throw new HttpError(400, 'GROUP_TITLE_REQUIRED', 'Введите название группы');
  }
  if (title.length > 60) {
    throw new HttpError(400, 'GROUP_TITLE_TOO_LONG', 'Название группы должно быть не длиннее 60 символов');
  }
  if (!clientRequestId) {
    throw new HttpError(400, 'CLIENT_REQUEST_ID_REQUIRED', 'Не передан идентификатор запроса');
  }

  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    ensureArrays(state);

    const existingRequest = state.groupCreationRequests.find((request) => {
      return request.clientRequestId === clientRequestId && request.createdByAccountId === account.id;
    });
    if (existingRequest) {
      const existingConversation = state.conversations.find((conversation) => conversation.id === existingRequest.conversationId);
      if (existingConversation && existingConversation.status !== 'archived') {
        return { conversation: publicConversation(state, existingConversation, account.id), reused: true };
      }
    }

    const participantAccountIds = normalizeParticipantIds([
      account.id,
      ...rawParticipantIds.map((id) => sanitizeString(id))
    ]);

    if (participantAccountIds.length < 2) {
      throw new HttpError(400, 'GROUP_MEMBERS_REQUIRED', 'Выберите хотя бы одного участника');
    }
    if (participantAccountIds.length > 50) {
      throw new HttpError(400, 'GROUP_MEMBERS_TOO_MANY', 'В группе слишком много участников');
    }

    const missingAccountId = participantAccountIds.find((accountId) => !accountById(state, accountId));
    if (missingAccountId) {
      throw new HttpError(404, 'GROUP_MEMBER_NOT_FOUND', 'Один из участников не найден');
    }
    assertParticipantsCanInteract(state, participantAccountIds, account.id);

    const now = new Date().toISOString();
    const conversation = {
      id: createId('conv_group'),
      type: 'group',
      title,
      participantAccountIds,
      customerAccountId: null,
      businessAccountId: null,
      createdByAccountId: account.id,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: null,
      clientRequestId
    };
    state.conversations.push(conversation);
    state.groupCreationRequests.push({
      id: createId('group_req'),
      clientRequestId,
      conversationId: conversation.id,
      createdByAccountId: account.id,
      actorUserId: userId,
      createdAt: now
    });

    return { conversation: publicConversation(state, conversation, account.id), reused: false };
  });
}

function listGroupMembers({ userId, activeAccountId, conversationId }) {
  const state = db.read();
  getActiveAccountContext(state, userId, activeAccountId);
  ensureArrays(state);
  const conversation = state.conversations.find((item) => item.id === conversationId && item.type === 'group');
  assertConversationAccess(conversation, activeAccountId);

  return {
    conversation: publicConversation(state, conversation, activeAccountId),
    members: (conversation.participantAccountIds || [])
      .map((accountId) => publicAccount(state, accountId))
      .filter(Boolean)
  };
}

function sendMessage({ userId, activeAccountId, input }) {
  const conversationId = sanitizeString(input && input.conversationId);
  const text = sanitizeString(input && input.text);

  if (!conversationId) {
    throw new HttpError(400, 'CONVERSATION_ID_REQUIRED', 'Не выбран диалог');
  }
  if (!text) {
    throw new HttpError(400, 'MESSAGE_TEXT_REQUIRED', 'Введите сообщение');
  }
  if (text.length > 1000) {
    throw new HttpError(400, 'MESSAGE_TEXT_TOO_LONG', 'Сообщение должно быть не длиннее 1000 символов');
  }

  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    ensureArrays(state);
    const conversation = state.conversations.find((item) => item.id === conversationId);
    assertConversationAccess(conversation, account.id);
    assertParticipantsCanInteract(state, conversation.participantAccountIds || [], account.id);
    const message = appendMessage(state, {
      conversation,
      senderAccountId: account.id,
      actorUserId: userId,
      type: 'text',
      text
    });

    return {
      conversation: publicConversation(state, conversation, account.id),
      message: publicMessage(state, message, account.id)
    };
  });
}

function markConversationRead({ userId, activeAccountId, conversationId }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    ensureArrays(state);
    const conversation = state.conversations.find((item) => item.id === conversationId);
    assertConversationAccess(conversation, account.id);
    const now = new Date().toISOString();
    const existing = state.messageReads.find((item) => item.conversationId === conversation.id && item.accountId === account.id);
    if (existing) {
      existing.readAt = now;
    } else {
      state.messageReads.push({ id: createId('read'), conversationId: conversation.id, accountId: account.id, userId, readAt: now });
    }
    return { conversationId: conversation.id, readAt: now };
  });
}

function createSharedContentMessage(state, { sharedContent, actorUserId }) {
  ensureArrays(state);
  if (!sharedContent || sharedContent.status === 'deleted') return null;
  let conversation;
  const senderAccount = accountById(state, sharedContent.senderAccountId);
  const targetAccount = accountById(state, sharedContent.targetAccountId);
  if (!senderAccount || !targetAccount) return null;

  if (senderAccount.type === 'business' && targetAccount.type !== 'business') {
    conversation = ensureBusinessConversation(state, targetAccount.id, senderAccount.id);
  } else if (targetAccount.type === 'business' && senderAccount.type !== 'business') {
    conversation = ensureBusinessConversation(state, senderAccount.id, targetAccount.id);
  } else {
    conversation = ensurePersonalConversation(state, senderAccount.id, targetAccount.id);
  }

  return appendMessage(state, {
    conversation,
    senderAccountId: senderAccount.id,
    actorUserId,
    type: 'shared_content',
    sharedContentId: sharedContent.id
  });
}

function createStoryReplyMessage(state, { reply, actorUserId }) {
  ensureArrays(state);
  if (!reply) return null;
  const senderAccount = accountById(state, reply.senderAccountId);
  const storyAccount = accountById(state, reply.storyAccountId);
  if (!senderAccount || !storyAccount || senderAccount.id === storyAccount.id) return null;

  const conversation = storyAccount.type === 'business'
    ? ensureBusinessConversation(state, senderAccount.id, storyAccount.id)
    : ensurePersonalConversation(state, senderAccount.id, storyAccount.id);

  return appendMessage(state, {
    conversation,
    senderAccountId: senderAccount.id,
    actorUserId,
    type: 'story_reply',
    text: reply.text,
    storyReplyId: reply.id
  });
}

module.exports = {
  listConversations,
  getConversation,
  createConversation,
  sendMessage,
  markConversationRead,
  createGroupConversation,
  listGroupMembers,
  createSharedContentMessage,
  createStoryReplyMessage
};
