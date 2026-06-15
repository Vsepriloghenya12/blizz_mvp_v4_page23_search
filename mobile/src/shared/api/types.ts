export type AccountType = 'personal' | 'business' | 'creator';

export type BusinessProfile = {
  category: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  logo: string | null;
};

export type AuthUser = {
  id: string;
  login: string;
  status: 'active' | 'restricted' | string;
  createdAt: string;
};

export type AuthAccount = {
  id: string;
  type: AccountType;
  name: string;
  username: string;
  avatar: string | null;
  bio: string;
  city: string;
  link: string;
  isPrivate: boolean;
  role: string | null;
  businessProfile: BusinessProfile | null;
  createdAt: string;
};

export type AuthSession = {
  token: string;
  activeAccountId: string;
  createdAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  activeAccount: AuthAccount;
  accounts: AuthAccount[];
  session: AuthSession;
};

export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export type ProfileStats = {
  posts: number;
  videos: number;
  drafts: number;
  offers: number;
  saved: number;
  followers: number;
  following: number;
};

export type Profile = {
  id: string;
  type: AccountType;
  role: string | null;
  name: string;
  username: string;
  avatar: string | null;
  bio: string;
  city: string;
  link: string;
  isPrivate: boolean;
  businessProfile: BusinessProfile | null;
  stats: ProfileStats;
  isOwnerView: boolean;
};

export type ProfileResponse = {
  profile: Profile;
};

export type UpdateProfileResponse = {
  profile: Profile;
  auth: AuthResponse;
};


export type PostVisibility = 'public' | 'followers' | 'close_friends' | 'selected';

export type PostMedia = {
  id?: string;
  type: 'image';
  url: string;
  order?: number;
};

export type PostLocation = {
  title: string;
  address: string;
  lat: number | null;
  lng: number | null;
  precision: 'exact' | 'area';
};

export type PostAuthor = {
  id: string;
  type: AccountType;
  name: string;
  username: string;
  avatar: string | null;
  businessCategory: string | null;
};

export type PostItem = {
  id: string;
  accountId: string;
  status: 'published' | 'draft' | string;
  media: PostMedia[];
  text: string;
  location: PostLocation | null;
  visibility: PostVisibility;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type FeedPostItem = PostItem & {
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  isLikedByMe: boolean;
  isSavedByMe: boolean;
};

export type CreatePostResponse = {
  post: PostItem;
};

export type CreateDraftResponse = {
  draft: PostItem;
};

export type MyPostsResponse = {
  posts: PostItem[];
};

export type MyDraftsResponse = {
  drafts: PostItem[];
};

export type FeedResponse = {
  items: FeedPostItem[];
};

export type PostDetailResponse = {
  post: FeedPostItem;
};

export type TogglePostLikeResponse = {
  postId: string;
  likesCount: number;
  isLikedByMe: boolean;
};

export type TogglePostSaveResponse = {
  postId: string;
  savesCount: number;
  isSavedByMe: boolean;
};

export type CommentAuthor = PostAuthor;

export type PostComment = {
  id: string;
  postId: string;
  accountId: string;
  author: CommentAuthor;
  text: string;
  createdAt: string;
  updatedAt: string;
  canDelete: boolean;
};

export type CommentsResponse = {
  postId: string;
  comments: PostComment[];
  commentsCount: number;
};

export type CreateCommentResponse = {
  comment: PostComment;
  commentsCount: number;
};

export type DeleteCommentResponse = {
  commentId: string;
  postId: string;
  commentsCount: number;
};

export type ShareRecipient = {
  id: string;
  type: AccountType;
  name: string;
  username: string;
  avatar: string | null;
  role: string | null;
  businessCategory: string | null;
};

export type ShareRecipientsResponse = {
  recipients: ShareRecipient[];
};

export type SharedContent = {
  id: string;
  type: 'post';
  contentId: string;
  senderAccountId: string;
  targetType: 'account';
  targetAccountId: string;
  createdAt: string;
};

export type SharePostResponse = {
  sharedContent: SharedContent;
};

export type VideoVisibility = PostVisibility;

export type VideoLocation = PostLocation;

export type VideoItem = {
  id: string;
  accountId: string;
  status: 'published' | 'draft' | string;
  videoUrl: string;
  coverUrl: string;
  description: string;
  location: VideoLocation | null;
  visibility: VideoVisibility;
  soundTitle: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type FeedVideoItem = VideoItem & {
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  isLikedByMe: boolean;
  isSavedByMe: boolean;
};

export type CreateVideoResponse = {
  video: VideoItem;
};

export type MyVideosResponse = {
  videos: VideoItem[];
};

export type VideoFeedResponse = {
  items: FeedVideoItem[];
};

export type VideoDetailResponse = {
  video: FeedVideoItem;
};

export type ToggleVideoLikeResponse = {
  videoId: string;
  likesCount: number;
  isLikedByMe: boolean;
};

export type ToggleVideoSaveResponse = {
  videoId: string;
  savesCount: number;
  isSavedByMe: boolean;
};

export type StoryMediaType = 'image' | 'video';
export type StoryVisibility = PostVisibility;
export type StoryLocation = PostLocation;

export type StoryItem = {
  id: string;
  accountId: string;
  author: PostAuthor;
  mediaType: StoryMediaType;
  mediaUrl: string;
  text: string;
  location: StoryLocation | null;
  visibility: StoryVisibility;
  viewsCount: number;
  isSeenByMe: boolean;
  createdAt: string;
  expiresAt: string;
};

export type StoryGroup = {
  account: PostAuthor;
  storiesCount: number;
  hasUnseen: boolean;
  items: StoryItem[];
};

export type StoriesFeedResponse = {
  groups: StoryGroup[];
};

export type MyStoriesResponse = {
  items: StoryItem[];
};

export type AccountStoriesResponse = {
  accountId: string;
  items: StoryItem[];
};

export type StoryDetailResponse = {
  story: StoryItem;
};

export type CreateStoryResponse = {
  story: StoryItem;
};

export type StoryViewResponse = {
  storyId: string;
  viewsCount: number;
  isSeenByMe: boolean;
};

export type StoryReply = {
  id: string;
  storyId: string;
  storyAccountId: string;
  senderAccountId: string;
  senderUserId: string;
  text: string;
  status: 'sent' | string;
  createdAt: string;
};

export type StoryReplyResponse = {
  reply: StoryReply;
};

export type OfferType = 'promo' | 'product' | 'service' | 'event';
export type OfferLocation = PostLocation;

export type OfferBusiness = {
  id: string;
  type: 'business';
  name: string;
  username: string;
  avatar: string | null;
  category: string | null;
  address: string;
  phone: string;
  website: string;
};

export type OfferItem = {
  id: string;
  businessAccountId: string;
  type: OfferType;
  typeLabel: string;
  title: string;
  coverUrl: string;
  description: string;
  priceOrCondition: string;
  expiresAt: string | null;
  address: string;
  location: OfferLocation | null;
  status: 'active' | string;
  createdAt: string;
  updatedAt: string;
  business: OfferBusiness;
  savesCount: number;
  isSavedByMe: boolean;
};

export type CreateOfferResponse = {
  offer: OfferItem;
};

export type MyOffersResponse = {
  offers: OfferItem[];
};

export type OfferResponse = {
  offer: OfferItem;
};

export type ToggleOfferSaveResponse = {
  offerId: string;
  savesCount: number;
  isSavedByMe: boolean;
};

export type ShowcaseFeedItem =
  | { kind: 'business_post'; id: string; createdAt: string; post: FeedPostItem }
  | { kind: 'offer'; id: string; createdAt: string; offer: OfferItem };

export type ShowcaseFeedResponse = {
  items: ShowcaseFeedItem[];
};


export type MapObjectType = 'post' | 'video' | 'story' | 'business' | 'offer';
export type MapFilter = 'all' | MapObjectType | 'saved';

export type MapObjectActions = {
  canOpen: boolean;
  canRoute: boolean;
  canSave: boolean;
  canShare: boolean;
};

export type MapObjectItem = {
  id: string;
  type: MapObjectType;
  contentId: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
  location: PostLocation;
  author: PostAuthor;
  createdAt: string;
  isSavedByMe: boolean;
  actions: MapObjectActions;
};

export type MapObjectsResponse = {
  filter: MapFilter;
  items: MapObjectItem[];
};


export type SavedTargetType = 'post' | 'video' | 'offer' | 'business';
export type SavedFilter = 'all' | SavedTargetType;

export type SavedObjectActions = {
  canOpen: boolean;
  canRoute: boolean;
  canShare: boolean;
  canRemove: boolean;
};

export type SavedObjectItem = {
  id: string;
  targetType: SavedTargetType;
  targetId: string;
  category: 'want_to_go' | 'visited' | 'favorite' | 'offers' | 'routes' | string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
  location: PostLocation | null;
  author: PostAuthor;
  createdAt: string;
  savedAt: string;
  actions: SavedObjectActions;
};

export type SavedResponse = {
  filter: SavedFilter;
  items: SavedObjectItem[];
};

export type SaveObjectResponse = {
  saved: SavedObjectItem;
  savesCount: number;
};

export type RemoveSavedResponse = {
  targetType: SavedTargetType;
  targetId: string;
  removed: true;
  savesCount: number;
};

export type ConversationType = 'personal' | 'business' | 'group';

export type MessageAccount = {
  id: string;
  type: AccountType;
  name: string;
  username: string;
  avatar: string | null;
  businessCategory: string | null;
};

export type ConversationItem = {
  id: string;
  type: ConversationType;
  participantAccountIds: string[];
  customerAccountId: string | null;
  businessAccountId: string | null;
  title: string;
  membersCount: number | null;
  createdByAccountId: string | null;
  counterpart: MessageAccount | null;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MessageSharedContent = {
  id: string;
  type: 'post' | string;
  contentId: string;
  createdAt: string;
  preview: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    imageUrl: string | null;
    author: MessageAccount | null;
  } | null;
};

export type MessageStoryReply = {
  id: string;
  storyId: string;
  text: string;
  createdAt: string;
  story: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    imageUrl: string | null;
    author: MessageAccount | null;
  } | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderAccountId: string;
  actorUserId: string;
  sender: MessageAccount | null;
  type: 'text' | 'shared_content' | 'story_reply' | string;
  text: string;
  sharedContent: MessageSharedContent | null;
  storyReply: MessageStoryReply | null;
  gameSession: GameSession | null;
  status: 'sent' | 'error' | string;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ConversationsResponse = {
  filter: 'all' | 'personal' | 'business' | 'group' | string;
  conversations: ConversationItem[];
};

export type ConversationResponse = {
  conversation: ConversationItem;
  messages: ChatMessage[];
};

export type CreateConversationResponse = {
  conversation: ConversationItem;
  reused?: boolean;
};

export type GroupMembersResponse = {
  conversation: ConversationItem;
  members: MessageAccount[];
};

export type SendMessageResponse = {
  conversation: ConversationItem;
  message: ChatMessage;
};

export type MarkConversationReadResponse = {
  conversationId: string;
  readAt: string;
};

export type GameType = 'card_guess' | 'football' | 'shells';
export type GameStatus = 'active' | 'finished' | string;

export type GameCatalogItem = {
  type: GameType;
  title: string;
  description: string;
  status: 'ready' | 'planned' | string;
};

export type GameCatalogResponse = {
  games: GameCatalogItem[];
};

export type GameCard = {
  index: number;
  label: string;
  icon: string;
};

export type GameCup = {
  index: number;
  label: string;
  icon: string;
};

export type GameShellRound = {
  round: number;
  selectedCup: number;
  ballPosition: number;
  result: 'correct' | 'miss' | string;
  createdAt: string;
};

export type GameScoreItem = {
  accountId: string;
  account: MessageAccount | null;
  score: number;
  isCorrect: boolean;
  answeredAt: string;
};

export type GameSession = {
  id: string;
  conversationId: string;
  type: GameType;
  title: string;
  status: GameStatus;
  createdByAccountId: string;
  creator: MessageAccount | null;
  cards: GameCard[];
  cups?: GameCup[];
  round?: number;
  roundsTotal?: number | null;
  selectedIndex: number | null;
  winningIndex: number | null;
  selectedCup?: number | null;
  ballPosition?: number | null;
  lastRoundResult?: 'correct' | 'miss' | string | null;
  shellsRounds?: GameShellRound[];
  shellsFinished?: boolean;
  correctAnswers?: number;
  isCorrect: boolean | null;
  score: number;
  scoreboard: GameScoreItem[];
  resultMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
};

export type GameSessionResponse = {
  conversation: ConversationItem;
  session: GameSession;
};

export type GameAnswerResponse = {
  session: GameSession;
  reused?: boolean;
};

export type SettingsVisibility = 'public' | 'followers' | 'close_friends' | 'nobody';
export type SettingsAudience = 'everyone' | 'followers' | 'close_friends' | 'nobody';
export type SettingsInviteAudience = 'everyone' | 'followers' | 'nobody';
export type GeotagsVisibility = 'public' | 'followers' | 'nobody';
export type LocationPrecision = 'exact' | 'area';
export type RecommendationRadius = '1km' | '3km' | '5km' | 'city';

export type AccountSettings = {
  id: string;
  accountId: string;
  privacy: {
    isPrivateAccount: boolean;
    defaultStoryVisibility: SettingsVisibility;
    defaultPostVisibility: SettingsVisibility;
    defaultVideoVisibility: SettingsVisibility;
    draftsVisibility: 'only_me' | string;
    closeFriendsCount: number;
    hiddenAccountsCount: number;
    blockedAccountsCount: number;
  };
  map: {
    showLiveLocation: boolean;
    geotagsVisibility: GeotagsVisibility;
    showPublicationsOnMap: boolean;
    locationPrecision: LocationPrecision;
    placesHistoryEnabled: boolean;
    myPlacesCount: number;
    recommendationRadius: RecommendationRadius;
    savedPlacesCount: number;
    routesCount: number;
  };
  messages: {
    allowMessagesFrom: SettingsAudience;
    allowStoryRepliesFrom: SettingsAudience;
    allowGroupInvitesFrom: SettingsInviteAudience;
    gamesInMessagesEnabled: boolean;
    allowGameInvitesFrom: SettingsInviteAudience;
    messageRequestsCount: number;
    blockedChatsCount: number;
    autoSaveSharedPlaces: boolean;
    chatContentPreview: boolean;
  };
  content: {
    favoritesCount: number;
    feedMode: string;
    showcaseMode: string;
    recommendationsNearby: boolean;
    showLikeAndShareCounts: boolean;
    mediaQuality: string;
    recentSearchesCount: number;
    viewHistoryCount: number;
  };
  safety: {
    restrictedAccountsCount: number;
    interactionLimitsEnabled: boolean;
    suspiciousMessagesFilter: boolean;
    familySafetyMode: boolean;
    teenRestrictionsEnabled: boolean;
    reportsCount: number;
    moderationItemsCount: number;
  };
  app: {
    language: string;
    dataSaver: boolean;
    devicePermissionsStatus: string;
    pwaInstallHintShown: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export type AccountSettingsResponse = {
  account: {
    id: string;
    type: AccountType;
    role: string | null;
    name: string;
    username: string;
  };
  settings: AccountSettings;
};

export type UpdateSettingsInput = Partial<{
  privacy: Partial<AccountSettings['privacy']>;
  map: Partial<AccountSettings['map']>;
  messages: Partial<AccountSettings['messages']>;
  content: Partial<AccountSettings['content']>;
  safety: Partial<AccountSettings['safety']>;
  app: Partial<AccountSettings['app']>;
}>;

export type FollowState = 'self' | 'not_following' | 'requested' | 'following' | 'blocked';

export type FollowAccountSummary = {
  id: string;
  type: AccountType;
  name: string;
  username: string;
  avatar: string | null;
  bio: string;
  city: string;
  link: string;
  isPrivate: boolean;
  businessCategory: string | null;
  createdAt: string;
};

export type FollowStats = {
  followers: number;
  following: number;
  requests: number;
};

export type FollowStateResponse = {
  targetAccount: FollowAccountSummary;
  followState: FollowState;
  isPrivate: boolean;
  stats: FollowStats;
};

export type FollowListItem = {
  followId: string;
  account: FollowAccountSummary;
  createdAt: string;
};

export type FollowersResponse = {
  account: FollowAccountSummary;
  followers: FollowListItem[];
};

export type FollowingResponse = {
  account: FollowAccountSummary;
  following: FollowListItem[];
};

export type FollowRequestItem = {
  id: string;
  requester: FollowAccountSummary;
  createdAt: string;
};

export type FollowRequestsResponse = {
  requests: FollowRequestItem[];
};

export type FollowRequestActionResponse = {
  requestId: string;
  status: 'accepted' | 'declined';
  stats: FollowStats;
};


export type PublicProfileAccount = FollowAccountSummary & {
  businessProfile: BusinessProfile | null;
};

export type PublicProfileStats = FollowStats & {
  posts: number;
  videos: number;
  offers: number;
};

export type PublicProfileResponse = {
  account: PublicProfileAccount;
  followState: FollowState;
  isBlocked: boolean;
  isPrivate: boolean;
  canViewContent: boolean;
  isSelf: boolean;
  stats: PublicProfileStats;
};

export type PublicProfilePostsResponse = {
  account: FollowAccountSummary;
  items: FeedPostItem[];
};

export type PublicProfileVideosResponse = {
  account: FollowAccountSummary;
  items: FeedVideoItem[];
};


export type BlockedAccountItem = {
  id: string;
  blockerAccountId: string;
  blockedAccountId: string;
  blockedAccount: FollowAccountSummary;
  createdAt: string;
  updatedAt: string;
};

export type BlockedAccountsResponse = {
  items: BlockedAccountItem[];
  count: number;
};

export type BlockAccountResponse = {
  block: BlockedAccountItem;
  count: number;
};

export type UnblockAccountResponse = {
  blockedAccountId: string;
  removed: true;
  count: number;
};

export type SearchType = 'all' | 'people' | 'business' | 'places' | 'offers' | 'posts' | 'videos';
export type SearchResultType = 'person' | 'business' | 'place' | 'offer' | 'post' | 'video';

export type SearchResultItem = {
  id: string;
  type: SearchResultType;
  targetType: SearchResultType;
  targetId: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
  accountId: string | null;
  offerId: string | null;
  postId: string | null;
  videoId: string | null;
  location: PostLocation | null;
  createdAt: string;
};

export type SearchResponse = {
  query: string;
  type: SearchType;
  results: SearchResultItem[];
};

export type RecentSearchItem = {
  id: string;
  accountId: string;
  query: string;
  targetType: 'query' | SearchResultType | string;
  targetId: string | null;
  title: string;
  subtitle: string;
  status: 'active' | 'deleted' | string;
  createdAt: string;
  updatedAt: string;
};

export type RecentSearchesResponse = {
  items: RecentSearchItem[];
};

export type AddRecentSearchResponse = {
  item: RecentSearchItem;
};

export type DeleteRecentSearchResponse = {
  id: string;
  deleted: true;
};

export type ClearRecentSearchesResponse = {
  cleared: number;
};

export type NotificationFilter = 'all' | 'messages' | 'activity' | 'business' | 'system' | 'unread';
export type NotificationCategory =
  | 'directMessages'
  | 'groupMessages'
  | 'businessMessages'
  | 'storyReplies'
  | 'follows'
  | 'comments'
  | 'likes'
  | 'stories'
  | 'videos'
  | 'games'
  | 'business'
  | 'sounds'
  | 'security'
  | 'system';

export type NotificationTargetType = 'post' | 'video' | 'story' | 'account' | 'business' | 'offer' | 'chat' | 'game' | 'settings' | string;

export type NotificationItem = {
  id: string;
  accountId: string;
  userId: string | null;
  type: string;
  category: NotificationCategory | string;
  title: string;
  body: string;
  targetType: NotificationTargetType | null;
  targetId: string | null;
  actorAccountId: string | null;
  actor: PostAuthor | null;
  actorAccountIds: string[];
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationsResponse = {
  filter: NotificationFilter;
  unreadCount: number;
  items: NotificationItem[];
};

export type NotificationReadResponse = {
  notification: NotificationItem;
  unreadCount: number;
};

export type NotificationsReadAllResponse = {
  markedCount: number;
  unreadCount: number;
};

export type NotificationSettings = {
  id: string;
  accountId: string;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  directMessages: boolean;
  groupMessages: boolean;
  businessMessages: boolean;
  storyReplies: boolean;
  follows: boolean;
  comments: boolean;
  likes: boolean;
  stories: boolean;
  videos: boolean;
  games: boolean;
  business: boolean;
  sounds: boolean;
  security: boolean;
  system: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationSettingsResponse = {
  settings: NotificationSettings;
};

export type UpdateNotificationSettingsInput = Partial<Omit<NotificationSettings, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>>;

export type PushTokenResponse = {
  pushToken: {
    id: string;
    platform: 'android' | 'web' | string;
    deviceId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type MetricsPeriod = '7d' | '30d' | '90d';

export type MetricsCapabilities = {
  canViewPersonal: boolean;
  canViewBusiness: boolean;
  canViewContent: boolean;
  canViewOffers: boolean;
  canViewActions: boolean;
  canViewMessages: boolean;
};

export type MetricsSummary = {
  period: MetricsPeriod;
  account: PostAuthor | null;
  role: string | null;
  capabilities: MetricsCapabilities;
  overview: {
    profileViews: number;
    reach: number;
    engagement: number;
    newFollowers: number;
    messages: number;
  };
  personal: null | {
    profileViews: number;
    postViews: number;
    videoViews: number;
    storyViews: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
    newFollowers: number;
  };
  business: null | {
    profileViews: number;
    messages: number;
    routes: number;
    phoneClicks: number;
    siteClicks: number;
    saves: number;
    followers: number;
    offerViews: number;
    activeOffers: number;
  };
};

export type MetricsContentItem = {
  id: string;
  type: 'post' | 'video' | 'story' | string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  score: number;
  createdAt: string;
};

export type MetricsContentResponse = {
  period: MetricsPeriod;
  account: PostAuthor | null;
  items: MetricsContentItem[];
};

export type MetricsOfferItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  views: number;
  saves: number;
  routeClicks: number;
  shares: number;
  createdAt: string;
};

export type MetricsOffersResponse = {
  period: MetricsPeriod;
  account: PostAuthor | null;
  items: MetricsOfferItem[];
};

export type MetricsActionItem = {
  id: string;
  actorAccountId: string | null;
  actor: PostAuthor | null;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type MetricsActionsResponse = {
  period: MetricsPeriod;
  account: PostAuthor | null;
  items: MetricsActionItem[];
};

export type MetricEventResponse = {
  event: {
    id: string;
    accountId: string;
    actorAccountId: string;
    eventType: string;
    targetType: string | null;
    targetId: string | null;
    metadata: Record<string, unknown>;
    status: string;
    createdAt: string;
  };
};

export type ReportReason = 'spam' | 'abuse' | 'fraud' | 'forbidden_content' | 'personal_data' | 'other';
export type ReportTargetType = 'profile' | 'business' | 'post' | 'video' | 'story' | 'comment' | 'message' | 'offer' | 'sound' | 'game' | 'place' | string;
export type ReportOwnerStatus = 'new' | 'seen' | 'handled' | 'archived' | string;
export type ReportModerationStatus = 'new' | 'reviewing' | 'resolved' | 'rejected' | string;

export type ReportItem = {
  id: string;
  reporterAccountId: string;
  reporter: PostAuthor | null;
  targetType: ReportTargetType;
  targetId: string;
  targetAccountId: string | null;
  targetAccount: PostAuthor | null;
  businessAccountId: string | null;
  businessAccount: PostAuthor | null;
  reason: ReportReason | string;
  comment: string;
  title: string;
  subtitle: string;
  objectStatus: string;
  ownerStatus: ReportOwnerStatus;
  moderationStatus: ReportModerationStatus;
  moderationNote: string;
  ownerNote: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  comment?: string;
};

export type CreateReportResponse = {
  report: ReportItem;
  reused?: boolean;
};

export type BusinessReportsResponse = {
  items: ReportItem[];
  count: number;
};

export type ModerationReportsResponse = BusinessReportsResponse;
export type ReportOwnerStatusResponse = { report: ReportItem };
export type ReportModerationStatusResponse = { report: ReportItem };

export type BusinessDashboardCapabilities = {
  canViewOverview: boolean;
  canViewMetrics: boolean;
  canViewContent: boolean;
  canViewOffers: boolean;
  canViewMessages: boolean;
  canViewReports: boolean;
  canViewStaff: boolean;
  canViewActions: boolean;
};

export type BusinessDashboardOfferPreview = {
  id: string;
  title: string;
  type: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
};

export type BusinessDashboardMessagePreview = {
  id: string;
  type: ConversationType;
  title: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type BusinessDashboardStaffItem = {
  id: string;
  userId: string;
  login: string;
  role: string;
  status: string;
  createdAt: string;
};

export type BusinessDashboardResponse = {
  period: MetricsPeriod;
  account: PostAuthor | null;
  role: string;
  capabilities: BusinessDashboardCapabilities;
  profile: null | {
    category: string;
    description: string;
    address: string;
    phone: string;
    website: string;
  };
  overview: {
    status: string;
    profileViews: number;
    messages: number;
    routes: number;
    saves: number;
    activeOffers: number;
    newReports: number;
  };
  metrics: {
    summary: MetricsSummary | null;
    content: MetricsContentItem[];
    offers: MetricsOfferItem[];
    actions: MetricsActionItem[];
  };
  showcase: {
    active: number;
    expiring: number;
    archived: number;
    restricted: number;
    items: BusinessDashboardOfferPreview[];
  };
  messages: {
    total: number;
    unread: number;
    items: BusinessDashboardMessagePreview[];
  };
  reports: {
    total: number;
    new: number;
    reviewing: number;
    resolved: number;
    items: ReportItem[];
  };
  staff: BusinessDashboardStaffItem[];
};

export type UpdateBusinessOfferStatusResponse = {
  offer: BusinessDashboardOfferPreview & { updatedAt: string };
};
