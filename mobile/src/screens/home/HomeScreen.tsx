import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import type { AuthResponse, FeedPostItem, OfferItem, PostComment, ShareRecipient, ShowcaseFeedItem, StoryGroup, StoryItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import {
  createPostComment,
  deletePostComment,
  getFeed,
  getPostComments,
  getShareRecipients,
  sharePostToAccount,
  togglePostLike,
  togglePostSave
} from '../../features/feed/api/feedApi';
import { getStoriesFeed, markStoryView, replyToStory } from '../../features/stories/api/storiesApi';
import { getShowcaseFeed, toggleOfferSave } from '../../features/offers/api/offersApi';
import { BlizzIcon } from '../../shared/ui/BlizzIcon';

type HomeScreenProps = {
  auth: AuthResponse;
  onCreateStory: () => void;
  onOpenMessages: () => void;
  onOpenOffer: (offerId: string) => void;
  onOpenAccount: (accountId: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
};

function formatDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getLocationLabel(post: FeedPostItem) {
  return post.location?.title || post.location?.address || '';
}

function getCanCreateStory(auth: AuthResponse) {
  if (auth.activeAccount.type === 'personal') return true;
  if (auth.activeAccount.type === 'business') {
    return ['owner', 'admin', 'smm'].includes(String(auth.activeAccount.role || ''));
  }
  return false;
}

function getStoryLocationLabel(story: StoryItem) {
  return story.location?.title || story.location?.address || '';
}

type FeedPostCardProps = {
  item: FeedPostItem;
  onLike: (postId: string) => void;
  onOpenComments: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onFutureAction: (message: string) => void;
  onOpenAccount: (accountId: string) => void;
  onOpenPost: (postId: string) => void;
};

function FeedPostCard({ item, onLike, onOpenComments, onSave, onShare, onFutureAction, onOpenAccount, onOpenPost }: FeedPostCardProps) {
  const location = getLocationLabel(item);
  const firstPhoto = item.media[0]?.url || '';
  const avatarUri = item.author.avatar || '';
  const hasCarousel = item.media.length > 1;

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Pressable accessibilityRole="button" onPress={() => onOpenAccount(item.author.id)} style={styles.authorPressable}>
          {avatarUri ? (
            <Image resizeMode="cover" source={{ uri: avatarUri }} style={styles.authorAvatarImage} />
          ) : (
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>{item.author.name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.authorBlock}>
            <Text numberOfLines={1} style={styles.authorName}>{item.author.name}</Text>
            {location ? (
              <View style={styles.inlineMetaRow}>
                <BlizzIcon color={colors.textSecondary} name="mapPin" size={14} strokeWidth={2} />
                <Text numberOfLines={1} style={styles.inlineMetaText}>{location}</Text>
              </View>
            ) : (
              <Text numberOfLines={1} style={styles.authorMeta}>@{item.author.username}</Text>
            )}
          </View>
        </Pressable>
        <View style={styles.postHeaderRight}>
          <Text style={styles.postHeaderTime}>{formatDate(item.publishedAt || item.createdAt)}</Text>
          <Pressable accessibilityRole="button" onPress={() => onFutureAction('Меню поста будет согласовано отдельным модулем.')} style={styles.moreButton}>
            <BlizzIcon color={colors.textSecondary} name="moreHorizontal" size={24} />
          </Pressable>
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={() => onOpenPost(item.id)} style={styles.postMediaPressable}>
        {firstPhoto ? (
          <Image resizeMode="cover" source={{ uri: firstPhoto }} style={styles.postImage} />
        ) : (
          <View style={styles.postImageFallback}>
            <Text style={styles.postImageFallbackText}>Фото недоступно</Text>
          </View>
        )}
      </Pressable>

      {hasCarousel ? (
        <View style={styles.carouselDots}>
          {item.media.slice(0, 4).map((media, index) => (
            <View key={media.id || `${item.id}-${index}`} style={[styles.carouselDot, index === 0 && styles.carouselDotActive]} />
          ))}
        </View>
      ) : null}

      {item.text ? (
        <Pressable accessibilityRole="button" onPress={() => onOpenPost(item.id)}>
          <Text style={styles.postText}>{item.text}</Text>
        </Pressable>
      ) : null}

      <View style={styles.postActionsDivider} />
      <View style={styles.postActions}>
        <Pressable accessibilityRole="button" onPress={() => onLike(item.id)} style={styles.actionButton}>
          <BlizzIcon color={item.isLikedByMe ? colors.danger : colors.textPrimary} filled={item.isLikedByMe} name="heart" size={24} />
          <Text style={styles.actionCountText}>{item.likesCount}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onOpenComments(item.id)} style={styles.actionButton}>
          <BlizzIcon color={colors.textPrimary} name="comment" size={24} />
          <Text style={styles.actionCountText}>{item.commentsCount}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onShare(item.id)} style={styles.actionButton}>
          <BlizzIcon color={colors.textPrimary} name="share" size={24} />
          <Text style={styles.actionCountText}>Поделиться</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onSave(item.id)} style={styles.saveButton}>
          <BlizzIcon color={item.isSavedByMe ? colors.primary : colors.textPrimary} filled={item.isSavedByMe} name="bookmark" size={25} />
        </Pressable>
      </View>
    </View>
  );
}


type OfferCardProps = {
  item: OfferItem;
  onOpen: (offerId: string) => void;
  onSave: (offerId: string) => void;
  onOpenBusiness: (accountId: string) => void;
  onFutureAction: (message: string) => void;
};

function formatOfferDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function OfferCard({ item, onOpen, onSave, onOpenBusiness, onFutureAction }: OfferCardProps) {
  const expires = formatOfferDate(item.expiresAt);
  const location = item.location?.title || item.address || item.business.address || '';

  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={styles.offerCard}>
      <Image resizeMode="cover" source={{ uri: item.coverUrl }} style={styles.offerImage} />
      <Pressable accessibilityRole="button" onPress={(event) => { event.stopPropagation(); onSave(item.id); }} style={styles.offerSaveButton}>
        <Text style={[styles.offerSaveText, item.isSavedByMe && styles.actionTextActive]}>{item.isSavedByMe ? 'Сохранено' : 'Сохранить'}</Text>
      </Pressable>
      <View style={styles.offerBody}>
        <Text style={styles.offerType}>{item.typeLabel}</Text>
        <Text style={styles.offerTitle}>{item.title}</Text>
        <Pressable accessibilityRole="button" onPress={() => onOpenBusiness(item.business.id)}><Text style={styles.offerBusiness}>{item.business.name} · @{item.business.username}</Text></Pressable>
        {location ? (
          <View style={styles.inlineMetaRow}>
            <BlizzIcon color={colors.textSecondary} name="mapPin" size={14} strokeWidth={2} />
            <Text style={styles.inlineMetaText}>{location}</Text>
          </View>
        ) : null}
        {item.priceOrCondition ? <Text style={styles.offerMeta}>{item.priceOrCondition}</Text> : null}
        {expires ? <Text style={styles.offerMeta}>Активно до: {expires}</Text> : null}
        <View style={styles.offerActionsRow}>
          <Pressable accessibilityRole="button" onPress={(event) => { event.stopPropagation(); onFutureAction('Маршрут к предложению будет подключён отдельным модулем карты.'); }}>
            <Text style={styles.offerActionText}>Маршрут</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={(event) => { event.stopPropagation(); onFutureAction('Поделиться предложением будет отдельным модулем.'); }}>
            <Text style={styles.offerActionText}>Поделиться позже</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

type CommentsSheetProps = {
  comments: PostComment[];
  commentsError: string | null;
  commentsLoading: boolean;
  commentText: string;
  onChangeCommentText: (value: string) => void;
  onClose: () => void;
  onDeleteComment: (commentId: string) => void;
  onReply: (username: string) => void;
  onOpenAccount: (accountId: string) => void;
  onSendComment: () => void;
  sendingComment: boolean;
  visible: boolean;
};

function CommentsSheet({
  comments,
  commentsError,
  commentsLoading,
  commentText,
  onChangeCommentText,
  onClose,
  onDeleteComment,
  onReply,
  onOpenAccount,
  onSendComment,
  sendingComment,
  visible
}: CommentsSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.commentsSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Комментарии</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.sheetCloseButton}>
              <Text style={styles.sheetCloseText}>Закрыть</Text>
            </Pressable>
          </View>

          {commentsError ? <Text style={styles.commentsErrorText}>{commentsError}</Text> : null}

          {commentsLoading ? (
            <View style={styles.commentsLoadingBlock}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingText}>Загружаем комментарии</Text>
            </View>
          ) : null}

          {!commentsLoading && comments.length === 0 ? (
            <View style={styles.emptyCommentsBlock}>
              <Text style={styles.emptyText}>Пока нет комментариев</Text>
            </View>
          ) : null}

          {!commentsLoading && comments.length > 0 ? (
            <ScrollView style={styles.commentsList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Pressable accessibilityRole="button" onPress={() => onOpenAccount(comment.author.id)} style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{comment.author.name.slice(0, 1).toUpperCase()}</Text>
                  </Pressable>
                  <View style={styles.commentBody}>
                    <Pressable accessibilityRole="button" onPress={() => onOpenAccount(comment.author.id)}><Text style={styles.commentAuthor}>{comment.author.name}</Text></Pressable>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <View style={styles.commentMetaRow}>
                      <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                      <Pressable accessibilityRole="button" onPress={() => onReply(comment.author.username)}>
                        <Text style={styles.commentAction}>Ответить</Text>
                      </Pressable>
                      {comment.canDelete ? (
                        <Pressable accessibilityRole="button" onPress={() => onDeleteComment(comment.id)}>
                          <Text style={styles.commentDeleteAction}>Удалить</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.commentInputRow}>
            <TextInput
              maxLength={500}
              multiline
              onChangeText={onChangeCommentText}
              placeholder="Написать комментарий..."
              placeholderTextColor={colors.textSecondary}
              style={styles.commentInput}
              value={commentText}
            />
            <Pressable
              accessibilityRole="button"
              disabled={sendingComment}
              onPress={onSendComment}
              style={[styles.commentSendButton, sendingComment && styles.buttonDisabled]}
            >
              <Text style={styles.commentSendText}>{sendingComment ? '...' : 'Отпр.'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}



type ShareSheetProps = {
  copyMessage: string | null;
  loading: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onExternalShare: () => void;
  onSendToRecipient: (recipientId: string) => void;
  recipients: ShareRecipient[];
  sendingTargetId: string | null;
  shareError: string | null;
  visible: boolean;
};

function ShareSheet({
  copyMessage,
  loading,
  onClose,
  onCopyLink,
  onExternalShare,
  onSendToRecipient,
  recipients,
  sendingTargetId,
  shareError,
  visible
}: ShareSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.shareSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Поделиться</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.sheetCloseButton}>
              <Text style={styles.sheetCloseText}>Закрыть</Text>
            </Pressable>
          </View>

          {shareError ? <Text style={styles.commentsErrorText}>{shareError}</Text> : null}
          {copyMessage ? <Text style={styles.shareInfoText}>{copyMessage}</Text> : null}

          <TextInput
            editable={false}
            placeholder="Поиск людей и чатов подключим в модуле сообщений"
            placeholderTextColor={colors.textSecondary}
            style={styles.shareSearchInput}
          />

          <Text style={styles.shareSectionTitle}>Быстрые получатели</Text>
          {loading ? (
            <View style={styles.commentsLoadingBlock}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingText}>Загружаем получателей</Text>
            </View>
          ) : null}

          {!loading && recipients.length === 0 ? (
            <View style={styles.emptyCommentsBlock}>
              <Text style={styles.emptyText}>Пока нет получателей</Text>
            </View>
          ) : null}

          {!loading && recipients.length > 0 ? (
            <View style={styles.recipientsList}>
              {recipients.map((recipient) => (
                <Pressable
                  accessibilityRole="button"
                  key={recipient.id}
                  onPress={() => onSendToRecipient(recipient.id)}
                  style={styles.recipientRow}
                >
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{recipient.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.recipientTextBlock}>
                    <Text style={styles.commentAuthor}>{recipient.name}</Text>
                    <Text style={styles.commentTime}>@{recipient.username}</Text>
                  </View>
                  <Text style={styles.shareSendText}>{sendingTargetId === recipient.id ? '...' : 'Отправить'}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.shareSectionTitle}>Действия</Text>
          <Pressable accessibilityRole="button" onPress={onCopyLink} style={styles.shareActionRow}>
            <Text style={styles.shareActionText}>Скопировать ссылку</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onExternalShare} style={styles.shareActionRow}>
            <Text style={styles.shareActionText}>Поделиться вне приложения</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}


type StoryViewerProps = {
  group: StoryGroup | null;
  onChangeReplyText: (value: string) => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onOpenAccount: (accountId: string) => void;
  onSendReply: () => void;
  replyMessage: string | null;
  replyText: string;
  sendingReply: boolean;
  storyIndex: number;
  visible: boolean;
};

function StoryViewer({
  group,
  onChangeReplyText,
  onClose,
  onNext,
  onPrevious,
  onOpenAccount,
  onSendReply,
  replyMessage,
  replyText,
  sendingReply,
  storyIndex,
  visible
}: StoryViewerProps) {
  const story = group?.items[storyIndex] || null;
  const location = story ? getStoryLocationLabel(story) : '';

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={styles.storyViewerRoot}>
        <View style={styles.storyViewerProgressRow}>
          {(group?.items || []).map((item, index) => (
            <View key={item.id} style={[styles.storyViewerProgress, index <= storyIndex && styles.storyViewerProgressActive]} />
          ))}
        </View>

        <View style={styles.storyViewerHeader}>
          <Pressable accessibilityRole="button" onPress={() => story?.author.id ? onOpenAccount(story.author.id) : undefined} style={styles.storyViewerAuthorBlock}>
            <View style={styles.storyViewerAvatar}>
              <Text style={styles.storyViewerAvatarText}>{story?.author.name.slice(0, 1).toUpperCase() || 'Б'}</Text>
            </View>
            <View>
              <Text style={styles.storyViewerAuthor}>{story?.author.name || 'Близз'}</Text>
              <Text style={styles.storyViewerMeta}>{story ? `@${story.author.username} · ${story.viewsCount} просмотров` : ''}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.storyViewerCloseButton}>
            <Text style={styles.storyViewerCloseText}>×</Text>
          </Pressable>
        </View>

        <View style={styles.storyViewerMediaWrap}>
          {story?.mediaType === 'image' ? (
            <Image resizeMode="cover" source={{ uri: story.mediaUrl }} style={styles.storyViewerImage} />
          ) : (
            <View style={styles.storyViewerVideoStub}>
              <Text style={styles.storyViewerVideoText}>Видео Близз</Text>
              <Text style={styles.storyViewerVideoUrl} numberOfLines={3}>{story?.mediaUrl}</Text>
            </View>
          )}
          {story?.text ? <Text style={styles.storyViewerOverlayText}>{story.text}</Text> : null}
          {location ? (
            <View style={styles.storyViewerLocationRow}>
              <BlizzIcon color="#FFFFFF" name="mapPin" size={14} strokeWidth={2} />
              <Text style={styles.storyViewerLocation}>{location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.storyViewerTapRow}>
          <Pressable accessibilityRole="button" onPress={onPrevious} style={styles.storyViewerTapButton}>
            <Text style={styles.storyViewerTapText}>←</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onNext} style={styles.storyViewerTapButton}>
            <Text style={styles.storyViewerTapText}>→</Text>
          </Pressable>
        </View>

        {replyMessage ? <Text style={styles.storyReplyMessage}>{replyMessage}</Text> : null}
        <View style={styles.storyReplyRow}>
          <TextInput
            maxLength={500}
            onChangeText={onChangeReplyText}
            placeholder="Ответить..."
            placeholderTextColor="#D0D5DD"
            style={styles.storyReplyInput}
            value={replyText}
          />
          <Pressable
            accessibilityRole="button"
            disabled={sendingReply}
            onPress={onSendReply}
            style={[styles.storyReplyButton, sendingReply && styles.buttonDisabled]}
          >
            <Text style={styles.storyReplyButtonText}>{sendingReply ? '...' : 'Отпр.'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function HomeScreen({ auth, onCreateStory, onOpenMessages, onOpenOffer, onOpenAccount, onOpenPost, onOpenSearch, onOpenNotifications }: HomeScreenProps) {
  const [homeTab, setHomeTab] = useState<'feed' | 'showcase'>('feed');
  const [items, setItems] = useState<FeedPostItem[]>([]);
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [selectedSharePostId, setSelectedSharePostId] = useState<string | null>(null);
  const [shareRecipients, setShareRecipients] = useState<ShareRecipient[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [sendingShareTargetId, setSendingShareTargetId] = useState<string | null>(null);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  const [selectedStoryGroupIndex, setSelectedStoryGroupIndex] = useState<number | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [storyReplyText, setStoryReplyText] = useState('');
  const [storyReplyMessage, setStoryReplyMessage] = useState<string | null>(null);
  const [sendingStoryReply, setSendingStoryReply] = useState(false);

  const canCreateStory = getCanCreateStory(auth);

  const loadStories = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setStoriesLoading(true);
    setStoriesError(null);
    try {
      const response = await getStoriesFeed(auth.session.token);
      setStoryGroups(response.groups);
    } catch (_requestError) {
      setStoriesError('Не удалось загрузить Близзы');
    } finally {
      if (mode === 'initial') setStoriesLoading(false);
    }
  }, [auth.session.token]);

  const loadFeed = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await getFeed(auth.session.token, 'personal');
      setItems(response.items);
    } catch (_requestError) {
      setError('Не удалось загрузить ленту. Проверьте подключение и backend.');
    } finally {
      if (mode === 'refresh') {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [auth.session.token]);


  const loadShowcase = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await getShowcaseFeed(auth.session.token);
      setShowcaseItems(response.items);
    } catch (_requestError) {
      setError('Не удалось загрузить витрину. Проверьте подключение и backend.');
    } finally {
      if (mode === 'refresh') {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [auth.session.token]);

  function updateShowcasePost(postId: string, patch: Partial<FeedPostItem>) {
    setShowcaseItems((current) => current.map((item) => {
      if (item.kind !== 'business_post' || item.post.id !== postId) return item;
      return { ...item, post: { ...item.post, ...patch } };
    }));
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFeed('refresh'), loadShowcase('refresh'), loadStories('refresh')]);
    setRefreshing(false);
  }, [loadFeed, loadShowcase, loadStories]);

  useEffect(() => {
    loadFeed();
    loadShowcase();
    loadStories();
  }, [loadFeed, loadShowcase, loadStories]);

  async function handleLike(postId: string) {
    const previous = items;
    const previousShowcase = showcaseItems;
    const showcaseTarget = showcaseItems.find((item) => item.kind === 'business_post' && item.post.id === postId);
    const target = items.find((item) => item.id === postId) || (showcaseTarget?.kind === 'business_post' ? showcaseTarget.post : undefined);
    if (!target) return;

    setItems((current) => current.map((item) => {
      if (item.id !== postId) return item;
      const nextLiked = !item.isLikedByMe;
      return {
        ...item,
        isLikedByMe: nextLiked,
        likesCount: Math.max(0, item.likesCount + (nextLiked ? 1 : -1))
      };
    }));
    setShowcaseItems((current) => current.map((item) => {
      if (item.kind !== 'business_post' || item.post.id !== postId) return item;
      const nextLiked = !item.post.isLikedByMe;
      return { ...item, post: { ...item.post, isLikedByMe: nextLiked, likesCount: Math.max(0, item.post.likesCount + (nextLiked ? 1 : -1)) } };
    }));

    try {
      const result = await togglePostLike(auth.session.token, postId);
      setItems((current) => current.map((item) => item.id === postId
        ? { ...item, isLikedByMe: result.isLikedByMe, likesCount: result.likesCount }
        : item));
      updateShowcasePost(postId, { isLikedByMe: result.isLikedByMe, likesCount: result.likesCount });
    } catch (_requestError) {
      setItems(previous);
      setShowcaseItems(previousShowcase);
      setInfo('Не удалось обновить лайк. Изменение отменено.');
    }
  }

  async function handleSave(postId: string) {
    const previous = items;
    const previousShowcase = showcaseItems;
    const showcaseTarget = showcaseItems.find((item) => item.kind === 'business_post' && item.post.id === postId);
    const target = items.find((item) => item.id === postId) || (showcaseTarget?.kind === 'business_post' ? showcaseTarget.post : undefined);
    if (!target) return;

    setItems((current) => current.map((item) => {
      if (item.id !== postId) return item;
      const nextSaved = !item.isSavedByMe;
      return {
        ...item,
        isSavedByMe: nextSaved,
        savesCount: Math.max(0, item.savesCount + (nextSaved ? 1 : -1))
      };
    }));
    setShowcaseItems((current) => current.map((item) => {
      if (item.kind !== 'business_post' || item.post.id !== postId) return item;
      const nextSaved = !item.post.isSavedByMe;
      return { ...item, post: { ...item.post, isSavedByMe: nextSaved, savesCount: Math.max(0, item.post.savesCount + (nextSaved ? 1 : -1)) } };
    }));

    try {
      const result = await togglePostSave(auth.session.token, postId);
      setItems((current) => current.map((item) => item.id === postId
        ? { ...item, isSavedByMe: result.isSavedByMe, savesCount: result.savesCount }
        : item));
      updateShowcasePost(postId, { isSavedByMe: result.isSavedByMe, savesCount: result.savesCount });
    } catch (_requestError) {
      setItems(previous);
      setShowcaseItems(previousShowcase);
      setInfo('Не удалось обновить сохранение. Изменение отменено.');
    }
  }

  async function openComments(postId: string) {
    setSelectedPostId(postId);
    setCommentText('');
    setComments([]);
    setCommentsError(null);
    setCommentsLoading(true);
    try {
      const response = await getPostComments(auth.session.token, postId);
      setComments(response.comments);
      setItems((current) => current.map((item) => item.id === postId
        ? { ...item, commentsCount: response.commentsCount }
        : item));
      updateShowcasePost(postId, { commentsCount: response.commentsCount });
    } catch (_requestError) {
      setCommentsError('Не удалось загрузить комментарии');
    } finally {
      setCommentsLoading(false);
    }
  }

  function closeComments() {
    setSelectedPostId(null);
    setCommentText('');
    setComments([]);
    setCommentsError(null);
    setCommentsLoading(false);
  }

  async function handleSendComment() {
    if (!selectedPostId) return;
    const text = commentText.trim();
    if (!text) {
      setCommentsError('Введите комментарий');
      return;
    }

    setSendingComment(true);
    setCommentsError(null);
    try {
      const response = await createPostComment(auth.session.token, selectedPostId, text);
      setComments((current) => [...current, response.comment]);
      setCommentText('');
      setItems((current) => current.map((item) => item.id === selectedPostId
        ? { ...item, commentsCount: response.commentsCount }
        : item));
      updateShowcasePost(selectedPostId, { commentsCount: response.commentsCount });
    } catch (_requestError) {
      setCommentsError('Не удалось отправить комментарий');
    } finally {
      setSendingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const response = await deletePostComment(auth.session.token, commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      setItems((current) => current.map((item) => item.id === response.postId
        ? { ...item, commentsCount: response.commentsCount }
        : item));
      updateShowcasePost(response.postId, { commentsCount: response.commentsCount });
    } catch (_requestError) {
      setCommentsError('Не удалось удалить комментарий');
    }
  }

  function handleReply(username: string) {
    setCommentText(`@${username} `);
  }

  async function openShare(postId: string) {
    setSelectedSharePostId(postId);
    setShareRecipients([]);
    setShareError(null);
    setShareMessage(null);
    setShareLoading(true);
    try {
      const response = await getShareRecipients(auth.session.token);
      setShareRecipients(response.recipients);
    } catch (_requestError) {
      setShareError('Не удалось загрузить получателей');
    } finally {
      setShareLoading(false);
    }
  }

  function closeShare() {
    setSelectedSharePostId(null);
    setShareRecipients([]);
    setShareError(null);
    setShareMessage(null);
    setSendingShareTargetId(null);
  }

  async function handleSendShare(targetAccountId: string) {
    if (!selectedSharePostId) return;
    setSendingShareTargetId(targetAccountId);
    setShareError(null);
    setShareMessage(null);
    try {
      await sharePostToAccount(auth.session.token, selectedSharePostId, targetAccountId);
      setShareMessage('Отправлено');
    } catch (_requestError) {
      setShareError('Этот пост нельзя отправить выбранному получателю');
    } finally {
      setSendingShareTargetId(null);
    }
  }

  async function handleCopyLink() {
    if (!selectedSharePostId) return;
    const link = `blizz://post/${selectedSharePostId}`;
    const browserNavigator = typeof globalThis !== 'undefined' ? (globalThis as any).navigator : null;
    try {
      if (browserNavigator?.clipboard?.writeText) {
        await browserNavigator.clipboard.writeText(link);
      }
      setShareMessage('Ссылка скопирована');
    } catch (_error) {
      setShareMessage(link);
    }
  }

  async function handleExternalShare() {
    if (!selectedSharePostId) return;
    const link = `blizz://post/${selectedSharePostId}`;
    const browserNavigator = typeof globalThis !== 'undefined' ? (globalThis as any).navigator : null;
    try {
      if (browserNavigator?.share) {
        await browserNavigator.share({ title: 'Пост в Близз', url: link });
        setShareMessage('Открыто системное меню отправки');
        return;
      }
      if (browserNavigator?.clipboard?.writeText) {
        await browserNavigator.clipboard.writeText(link);
      }
      setShareMessage('Системное меню недоступно. Ссылка скопирована');
    } catch (_error) {
      setShareMessage('Не удалось открыть системное меню отправки');
    }
  }

  async function markViewed(groupIndex: number, storyIndex: number) {
    const story = storyGroups[groupIndex]?.items[storyIndex];
    if (!story) return;

    try {
      const response = await markStoryView(auth.session.token, story.id);
      setStoryGroups((current) => current.map((group, currentGroupIndex) => {
        if (currentGroupIndex !== groupIndex) return group;
        const items = group.items.map((item, currentStoryIndex) => currentStoryIndex === storyIndex
          ? { ...item, isSeenByMe: response.isSeenByMe, viewsCount: response.viewsCount }
          : item);
        return {
          ...group,
          hasUnseen: items.some((item) => !item.isSeenByMe),
          items
        };
      }));
    } catch (_requestError) {
      setInfo('Близз больше недоступен');
    }
  }

  function openStoryGroup(groupIndex: number) {
    setSelectedStoryGroupIndex(groupIndex);
    setSelectedStoryIndex(0);
    setStoryReplyText('');
    setStoryReplyMessage(null);
    markViewed(groupIndex, 0);
  }

  function closeStoryViewer() {
    setSelectedStoryGroupIndex(null);
    setSelectedStoryIndex(0);
    setStoryReplyText('');
    setStoryReplyMessage(null);
    setSendingStoryReply(false);
  }

  function handleNextStory() {
    if (selectedStoryGroupIndex === null) return;
    const group = storyGroups[selectedStoryGroupIndex];
    if (!group) return;
    const nextIndex = selectedStoryIndex + 1;
    if (nextIndex >= group.items.length) {
      closeStoryViewer();
      return;
    }
    setSelectedStoryIndex(nextIndex);
    setStoryReplyText('');
    setStoryReplyMessage(null);
    markViewed(selectedStoryGroupIndex, nextIndex);
  }

  function handlePreviousStory() {
    if (selectedStoryGroupIndex === null) return;
    const previousIndex = Math.max(0, selectedStoryIndex - 1);
    setSelectedStoryIndex(previousIndex);
    setStoryReplyText('');
    setStoryReplyMessage(null);
    markViewed(selectedStoryGroupIndex, previousIndex);
  }

  async function handleSendStoryReply() {
    if (selectedStoryGroupIndex === null) return;
    const story = storyGroups[selectedStoryGroupIndex]?.items[selectedStoryIndex];
    if (!story) return;
    const text = storyReplyText.trim();
    if (!text) {
      setStoryReplyMessage('Введите ответ');
      return;
    }

    setSendingStoryReply(true);
    setStoryReplyMessage(null);
    try {
      await replyToStory(auth.session.token, story.id, text);
      setStoryReplyText('');
      setStoryReplyMessage('Ответ отправлен');
    } catch (_requestError) {
      setStoryReplyMessage('Не удалось отправить ответ');
    } finally {
      setSendingStoryReply(false);
    }
  }

  function handleCreateStoryPress() {
    if (!canCreateStory) {
      setInfo('У вас доступ только к сообщениям');
      return;
    }
    onCreateStory();
  }


  async function handleOfferSave(offerId: string) {
    const previousShowcase = showcaseItems;
    setShowcaseItems((current) => current.map((item) => {
      if (item.kind !== 'offer' || item.offer.id !== offerId) return item;
      const nextSaved = !item.offer.isSavedByMe;
      return { ...item, offer: { ...item.offer, isSavedByMe: nextSaved, savesCount: Math.max(0, item.offer.savesCount + (nextSaved ? 1 : -1)) } };
    }));

    try {
      const result = await toggleOfferSave(auth.session.token, offerId);
      setShowcaseItems((current) => current.map((item) => item.kind === 'offer' && item.offer.id === offerId
        ? { ...item, offer: { ...item.offer, isSavedByMe: result.isSavedByMe, savesCount: result.savesCount } }
        : item));
    } catch (_requestError) {
      setShowcaseItems(previousShowcase);
      setInfo('Не удалось обновить сохранение предложения.');
    }
  }

  const selectedStoryGroup = selectedStoryGroupIndex === null ? null : storyGroups[selectedStoryGroupIndex] || null;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={(
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        )}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Близз</Text>
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" onPress={onOpenSearch} style={styles.headerIconButton}>
              <BlizzIcon color="#061327" name="search" size={22} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onOpenNotifications} style={styles.headerIconButton}>
              <BlizzIcon color="#061327" name="bell" size={22} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onOpenMessages} style={styles.headerIconButton}>
              <BlizzIcon color="#061327" name="message" size={22} />
            </Pressable>
          </View>
        </View>

        <View style={styles.storiesBlock}>
          {storiesError ? <Text style={styles.storyErrorText}>{storiesError}</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRowContent} style={styles.storiesRow}>
            <Pressable accessibilityRole="button" onPress={handleCreateStoryPress} style={styles.storyItem}>
              <View style={[styles.myStoryCircle, !canCreateStory && styles.storyCircleDisabled]}>
                <BlizzIcon color={canCreateStory ? colors.primary : colors.textSecondary} name="plus" size={26} strokeWidth={2.4} />
              </View>
              <Text numberOfLines={2} style={styles.storyLabel}>Ваш Близз</Text>
            </Pressable>
            {storiesLoading ? (
              <View style={styles.storyInfoCard}>
                <Text style={styles.storyInfoText}>Загружаем Близзы</Text>
              </View>
            ) : null}
            {!storiesLoading && storyGroups.map((group, index) => {
              const storyPreview = group.account.avatar || group.items.find((story) => story.mediaType === 'image')?.mediaUrl || '';
              return (
                <Pressable accessibilityRole="button" key={group.account.id} onPress={() => openStoryGroup(index)} style={styles.storyItem}>
                  <View style={[styles.storyRing, group.hasUnseen && styles.storyRingUnseen]}>
                    {storyPreview ? (
                      <Image resizeMode="cover" source={{ uri: storyPreview }} style={styles.storyImage} />
                    ) : (
                      <View style={styles.storyCircle}>
                        <Text style={styles.storyCircleText}>{group.account.name.slice(0, 1).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={2} style={styles.storyLabel}>{group.account.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {info ? <Text style={styles.infoText}>{info}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.homeTabs}>
          <Pressable accessibilityRole="button" onPress={() => setHomeTab('feed')} style={[styles.homeTabButton, homeTab === 'feed' && styles.homeTabButtonActive]}>
            <Text style={[styles.homeTabText, homeTab === 'feed' && styles.homeTabTextActive]}>Лента</Text>
            {homeTab === 'feed' ? <View style={styles.homeTabIndicator} /> : null}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setHomeTab('showcase')} style={[styles.homeTabButton, homeTab === 'showcase' && styles.homeTabButtonActive]}>
            <Text style={[styles.homeTabText, homeTab === 'showcase' && styles.homeTabTextActive]}>Витрина</Text>
            {homeTab === 'showcase' ? <View style={styles.homeTabIndicator} /> : null}
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>{homeTab === 'feed' ? 'Загружаем ленту' : 'Загружаем витрину'}</Text>
          </View>
        ) : null}

        {!loading && homeTab === 'feed' && items.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>Пока нет публикаций</Text>
          </View>
        ) : null}

        {!loading && homeTab === 'showcase' && showcaseItems.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>Пока нет публикаций бизнеса</Text>
          </View>
        ) : null}

        {homeTab === 'feed' ? (
          <View style={styles.feedList}>
            {items.map((item) => (
              <FeedPostCard
                item={item}
                key={item.id}
                onFutureAction={setInfo}
                onLike={handleLike}
                onOpenComments={openComments}
                onOpenAccount={onOpenAccount}
                onOpenPost={onOpenPost}
                onSave={handleSave}
                onShare={openShare}
              />
            ))}
          </View>
        ) : (
          <View style={styles.feedList}>
            {showcaseItems.map((item) => item.kind === 'business_post' ? (
              <FeedPostCard
                item={item.post}
                key={item.id}
                onFutureAction={setInfo}
                onLike={handleLike}
                onOpenComments={openComments}
                onOpenAccount={onOpenAccount}
                onOpenPost={onOpenPost}
                onSave={handleSave}
                onShare={openShare}
              />
            ) : (
              <OfferCard
                item={item.offer}
                key={item.id}
                onOpen={onOpenOffer}
                onOpenBusiness={onOpenAccount}
                onFutureAction={setInfo}
                onSave={handleOfferSave}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CommentsSheet
        commentText={commentText}
        comments={comments}
        commentsError={commentsError}
        commentsLoading={commentsLoading}
        onChangeCommentText={setCommentText}
        onClose={closeComments}
        onDeleteComment={handleDeleteComment}
        onReply={handleReply}
        onOpenAccount={onOpenAccount}
        onSendComment={handleSendComment}
        sendingComment={sendingComment}
        visible={selectedPostId !== null}
      />

      <ShareSheet
        copyMessage={shareMessage}
        loading={shareLoading}
        onClose={closeShare}
        onCopyLink={handleCopyLink}
        onExternalShare={handleExternalShare}
        onSendToRecipient={handleSendShare}
        recipients={shareRecipients}
        sendingTargetId={sendingShareTargetId}
        shareError={shareError}
        visible={selectedSharePostId !== null}
      />

      <StoryViewer
        group={selectedStoryGroup}
        onChangeReplyText={setStoryReplyText}
        onClose={closeStoryViewer}
        onNext={handleNextStory}
        onPrevious={handlePreviousStory}
        onOpenAccount={onOpenAccount}
        onSendReply={handleSendStoryReply}
        replyMessage={storyReplyMessage}
        replyText={storyReplyText}
        sendingReply={sendingStoryReply}
        storyIndex={selectedStoryIndex}
        visible={selectedStoryGroup !== null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 18
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 4
  },
  logo: {
    color: colors.primary,
    fontSize: 28,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: -1.4
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  },
  headerIconButton: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  messagesIcon: {
    color: '#061327',
    fontSize: 24,
    fontWeight: '800'
  },
  storiesBlock: {
    backgroundColor: '#FFFFFF',
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  storiesRow: {
    marginHorizontal: -16
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 18,
    width: 78
  },
  myStoryCircle: {
    alignItems: 'center',
    backgroundColor: '#F4F7FF',
    borderColor: colors.primary,
    borderRadius: 36,
    borderWidth: 3,
    height: 72,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: 72
  },
  myStoryPlus: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: '500',
    lineHeight: 40
  },
  storyLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 17,
    marginTop: 8,
    minHeight: 34,
    textAlign: 'center'
  },
  storyInfoCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 72,
    paddingHorizontal: 14
  },
  storyInfoText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800'
  },
  feedHeader: {
    marginTop: 24
  },
  homeTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginTop: 20
  },
  homeTabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingBottom: 10,
    paddingTop: 10,
    position: 'relative'
  },
  homeTabButtonActive: {},
  homeTabIndicator: {
    backgroundColor: '#0B3D99',
    borderRadius: 2,
    bottom: 0,
    height: 2.5,
    left: '25%',
    position: 'absolute',
    right: '25%'
  },
  homeTabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  homeTabTextActive: {
    color: colors.primary
  },
  infoText: {
    backgroundColor: colors.softBlue,
    borderRadius: 14,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 14,
    padding: 12
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 14
  },
  loadingBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13
  },
  emptyBlock: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    padding: 22
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600'
  },
  feedList: {
    gap: 16,
    marginTop: 20
  },
  offerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0B3D99',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 14
  },
  offerImage: {
    backgroundColor: colors.softBlue,
    height: 190,
    width: '100%'
  },
  offerSaveButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    marginRight: 12,
    marginTop: -42,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  offerSaveText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800'
  },
  offerBody: {
    padding: 14
  },
  offerType: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  offerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 6
  },
  offerBusiness: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4
  },
  offerMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6
  },
  inlineMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 5
  },
  inlineMetaText: {
    color: colors.textSecondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18
  },
  offerActionsRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12
  },
  offerActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900'
  },
  postCard: {
    backgroundColor: colors.surface,
    borderColor: '#E6EEF8',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0B3D99',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12
  },
  postHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 14
  },
  authorPressable: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row'
  },
  authorAvatar: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    width: 46
  },
  authorAvatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800'
  },
  authorBlock: {
    flex: 1,
    marginLeft: 11
  },
  authorName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  authorMeta: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 3
  },
  moreButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    marginLeft: 4,
    width: 30
  },
  moreText: {
    color: '#0A1224',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 24
  },
  postImage: {
    backgroundColor: colors.softBlue,
    borderRadius: 0,
    height: 280,
    width: '100%'
  },
  postImageFallback: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 0,
    height: 220,
    justifyContent: 'center'
  },
  postImageFallbackText: {
    color: colors.textSecondary,
    fontSize: 14
  },
  postActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 12
  },
  actionButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    minHeight: 32
  },
  saveButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    marginLeft: 'auto',
    width: 34
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  },
  actionTextActive: {
    color: colors.primary
  },
  postText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 2
  },
  postTime: {
    color: colors.textSecondary,
    fontSize: 12,
    paddingHorizontal: 0,
    paddingVertical: 8
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalBackdrop: {
    backgroundColor: 'rgba(16, 24, 40, 0.12)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  commentsSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '82%',
    minHeight: 420,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 10
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#D0D5DD',
    borderRadius: 2,
    height: 4,
    marginBottom: 14,
    width: 42
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800'
  },
  sheetCloseButton: {
    paddingHorizontal: 4,
    paddingVertical: 6
  },
  sheetCloseText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700'
  },
  commentsErrorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 10
  },
  commentsLoadingBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 18
  },
  emptyCommentsBlock: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 16,
    padding: 22
  },
  commentsList: {
    marginTop: 14
  },
  commentItem: {
    flexDirection: 'row',
    paddingBottom: 16
  },
  commentAvatar: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  commentAvatarText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800'
  },
  commentBody: {
    flex: 1,
    marginLeft: 10
  },
  commentAuthor: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  commentText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3
  },
  commentMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 6
  },
  commentTime: {
    color: colors.textSecondary,
    fontSize: 12
  },
  commentAction: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  commentDeleteAction: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700'
  },
  commentInputRow: {
    alignItems: 'flex-end',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12
  },
  commentInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
    maxHeight: 90,
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 10
  },
  commentSendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  commentSendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },

  shareSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '82%',
    minHeight: 390,
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 10
  },
  shareInfoText: {
    backgroundColor: colors.softBlue,
    borderRadius: 14,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    padding: 10
  },
  shareSearchInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.textSecondary,
    fontSize: 14,
    height: 46,
    marginTop: 14,
    paddingHorizontal: 12
  },
  shareSectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 18,
    textTransform: 'uppercase'
  },
  recipientsList: {
    marginTop: 10
  },
  recipientRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 12
  },
  recipientTextBlock: {
    flex: 1,
    marginLeft: 10
  },
  shareSendText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800'
  },
  shareActionRow: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  shareActionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },

  storyCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 30,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    width: 60
  },
  storyCircleUnseen: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  storyCircleDisabled: {
    opacity: 0.45
  },
  storyCircleText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800'
  },
  storyCountText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  storyErrorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6
  },
  storyViewerRoot: {
    backgroundColor: '#071B3A',
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 18
  },
  storyViewerProgressRow: {
    flexDirection: 'row',
    gap: 4
  },
  storyViewerProgress: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    flex: 1,
    height: 4
  },
  storyViewerProgressActive: {
    backgroundColor: '#FFFFFF'
  },
  storyViewerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14
  },
  storyViewerAuthorBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1
  },
  storyViewerAvatar: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 40
  },
  storyViewerAvatarText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800'
  },
  storyViewerAuthor: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  storyViewerMeta: {
    color: '#D0D5DD',
    fontSize: 12,
    marginTop: 2
  },
  storyViewerCloseButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  storyViewerCloseText: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 36
  },
  storyViewerMediaWrap: {
    alignItems: 'center',
    backgroundColor: '#101828',
    borderRadius: 26,
    flex: 1,
    justifyContent: 'center',
    marginTop: 16,
    overflow: 'hidden',
    position: 'relative'
  },
  storyViewerImage: {
    height: '100%',
    width: '100%'
  },
  storyViewerVideoStub: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  storyViewerVideoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800'
  },
  storyViewerVideoUrl: {
    color: '#D0D5DD',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center'
  },
  storyViewerOverlayText: {
    backgroundColor: 'rgba(7,27,58,0.46)',
    borderRadius: 16,
    bottom: 72,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    left: 18,
    lineHeight: 26,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    right: 18,
    textAlign: 'center'
  },
  storyViewerLocation: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  storyViewerLocationRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,27,58,0.50)',
    borderRadius: 14,
    bottom: 24,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute'
  },
  storyViewerTapRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  storyViewerTapButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    flex: 1,
    height: 40,
    justifyContent: 'center'
  },
  storyViewerTapText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800'
  },
  storyReplyMessage: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center'
  },
  storyReplyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 18,
    paddingTop: 12
  },
  storyReplyInput: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 20,
    borderWidth: 1,
    color: '#FFFFFF',
    flex: 1,
    fontSize: 14,
    height: 44,
    paddingHorizontal: 14
  },
  storyReplyButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  storyReplyButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800'
  },

  storiesRowContent: {
    paddingHorizontal: 16,
    paddingRight: 30
  },
  storyRing: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 36,
    borderWidth: 2.5,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 3,
    width: 72
  },
  storyRingUnseen: {
    borderColor: '#E48A3F',
    borderWidth: 3
  },
  storyImage: {
    borderRadius: 31,
    height: 62,
    width: 62
  },
  authorAvatarImage: {
    borderRadius: 23,
    height: 46,
    width: 46
  },
  postHeaderRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  },
  postHeaderTime: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600'
  },
  postMediaPressable: {
    borderRadius: 0,
    overflow: 'hidden'
  },
  carouselDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 12
  },
  carouselDot: {
    backgroundColor: '#CBD5E1',
    borderRadius: 4,
    height: 7,
    width: 7
  },
  carouselDotActive: {
    backgroundColor: colors.primary
  },
  postActionsDivider: {
    backgroundColor: '#EEF2F8',
    height: 1,
    marginHorizontal: 14,
    marginTop: 14
  },
  actionIconText: {
    color: '#081120',
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 31
  },
  actionCountText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  likeIconActive: {
    color: '#F04438'
  },
  bookmarkText: {
    color: '#081120',
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 32
  },
  buttonDisabled: {
    opacity: 0.65
  }
});
