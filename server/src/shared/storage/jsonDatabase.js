const fs = require('fs');
const path = require('path');
const { env } = require('../../config/env');

const initialState = {
  meta: {
    name: 'Blizz MVP v4',
    version: 1
  },
  users: [],
  accounts: [],
  accountMemberships: [],
  businessProfiles: [],
  posts: [],
  videos: [],
  videoLikes: [],
  stories: [],
  storyViews: [],
  storyReplies: [],
  offers: [],
  drafts: [],
  savedItems: [],
  postLikes: [],
  postComments: [],
  sharedContents: [],
  conversations: [],
  messages: [],
  messageReads: [],
  gameSessions: [],
  gameAnswers: [],
  accountSettings: [],
  follows: [],
  recentSearches: [],
  blocks: [],
  notifications: [],
  notificationSettings: [],
  pushTokens: [],
  metricsEvents: [],
  reports: [],
  sessions: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

class JsonDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.ensureFile();
  }

  ensureFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(initialState, null, 2));
    }
  }

  read() {
    this.ensureFile();
    const raw = fs.readFileSync(this.filePath, 'utf8');
    if (!raw.trim()) {
      return clone(initialState);
    }

    const parsed = JSON.parse(raw);
    return {
      ...clone(initialState),
      ...parsed,
      meta: { ...initialState.meta, ...(parsed.meta || {}) },
      users: parsed.users || [],
      accounts: parsed.accounts || [],
      accountMemberships: parsed.accountMemberships || [],
      businessProfiles: parsed.businessProfiles || [],
      posts: parsed.posts || [],
      videos: parsed.videos || [],
      videoLikes: parsed.videoLikes || [],
      stories: parsed.stories || [],
      storyViews: parsed.storyViews || [],
      storyReplies: parsed.storyReplies || [],
      offers: parsed.offers || [],
      drafts: parsed.drafts || [],
      savedItems: parsed.savedItems || [],
      postLikes: parsed.postLikes || [],
      postComments: parsed.postComments || [],
      sharedContents: parsed.sharedContents || [],
      conversations: parsed.conversations || [],
      messages: parsed.messages || [],
      messageReads: parsed.messageReads || [],
      gameSessions: parsed.gameSessions || [],
      gameAnswers: parsed.gameAnswers || [],
      accountSettings: parsed.accountSettings || [],
      follows: parsed.follows || [],
      recentSearches: parsed.recentSearches || [],
      blocks: parsed.blocks || [],
      notifications: parsed.notifications || [],
      notificationSettings: parsed.notificationSettings || [],
      pushTokens: parsed.pushTokens || [],
      metricsEvents: parsed.metricsEvents || [],
      reports: parsed.reports || [],
      sessions: parsed.sessions || []
    };
  }

  write(state) {
    const nextState = {
      ...clone(initialState),
      ...state,
      meta: {
        ...initialState.meta,
        ...(state.meta || {}),
        updatedAt: new Date().toISOString()
      }
    };

    fs.writeFileSync(this.filePath, JSON.stringify(nextState, null, 2));
    return nextState;
  }

  transaction(mutator) {
    const state = this.read();
    const result = mutator(state);
    this.write(state);
    return result;
  }
}

const db = new JsonDatabase(env.dataFile);

module.exports = { db, initialState };
