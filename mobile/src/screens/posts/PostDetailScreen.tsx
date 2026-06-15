import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse, FeedPostItem, PostComment } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { createPostComment, deletePostComment, getPostComments, togglePostLike, togglePostSave } from '../../features/feed/api/feedApi';
import { getPostDetail } from '../../features/posts/api/postsApi';
import { createReport } from '../../features/reports/api/reportsApi';

type PostDetailScreenProps = {
  auth: AuthResponse;
  postId: string;
  onBack: () => void;
  onOpenAccount: (accountId: string) => void;
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

export function PostDetailScreen({ auth, postId, onBack, onOpenAccount }: PostDetailScreenProps) {
  const [post, setPost] = useState<FeedPostItem | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPost(mode: 'initial' | 'refresh' = 'initial') {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      const response = await getPostDetail(auth.session.token, postId);
      setPost(response.post);
      await loadComments(response.post.id);
    } catch (_error) {
      setError('Не удалось открыть пост. Он удалён или недоступен для этого аккаунта.');
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadComments(nextPostId = postId) {
    setCommentsLoading(true);
    try {
      const response = await getPostComments(auth.session.token, nextPostId);
      setComments(response.comments);
    } catch (_error) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    loadPost();
  }, [auth.session.token, auth.activeAccount.id, postId]);

  async function handleLike() {
    if (!post) return;
    const previous = post;
    const nextLiked = !post.isLikedByMe;
    setPost({ ...post, isLikedByMe: nextLiked, likesCount: post.likesCount + (nextLiked ? 1 : -1) });
    try {
      const response = await togglePostLike(auth.session.token, post.id);
      setPost((current) => current ? { ...current, isLikedByMe: response.isLikedByMe, likesCount: response.likesCount } : current);
    } catch (_error) {
      setPost(previous);
      setNotice('Не удалось обновить лайк.');
    }
  }

  async function handleSave() {
    if (!post) return;
    const previous = post;
    const nextSaved = !post.isSavedByMe;
    setPost({ ...post, isSavedByMe: nextSaved, savesCount: post.savesCount + (nextSaved ? 1 : -1) });
    try {
      const response = await togglePostSave(auth.session.token, post.id);
      setPost((current) => current ? { ...current, isSavedByMe: response.isSavedByMe, savesCount: response.savesCount } : current);
    } catch (_error) {
      setPost(previous);
      setNotice('Не удалось сохранить пост.');
    }
  }

  async function reportPost() {
    if (!post) return;
    setNotice(null);
    try {
      await createReport(auth.session.token, { targetType: 'post', targetId: post.id, reason: 'other', comment: 'Жалоба на пост' });
      setNotice('Жалоба отправлена на проверку.');
    } catch (_error) {
      setNotice('Не удалось отправить жалобу.');
    }
  }

  async function reportComment(commentId: string) {
    setNotice(null);
    try {
      await createReport(auth.session.token, { targetType: 'comment', targetId: commentId, reason: 'other', comment: 'Жалоба на комментарий' });
      setNotice('Жалоба на комментарий отправлена.');
    } catch (_error) {
      setNotice('Не удалось отправить жалобу.');
    }
  }

  async function handleSendComment() {
    const text = commentText.trim();
    if (!post || !text) return;
    setSendingComment(true);
    setNotice(null);
    try {
      const response = await createPostComment(auth.session.token, post.id, text);
      setComments((current) => [...current, response.comment]);
      setPost({ ...post, commentsCount: response.commentsCount });
      setCommentText('');
    } catch (_error) {
      setNotice('Не удалось отправить комментарий.');
    } finally {
      setSendingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!post) return;
    const previous = comments;
    setComments((current) => current.filter((comment) => comment.id !== commentId));
    try {
      const response = await deletePostComment(auth.session.token, commentId);
      setPost({ ...post, commentsCount: response.commentsCount });
    } catch (_error) {
      setComments(previous);
      setNotice('Не удалось удалить комментарий.');
    }
  }

  const locationText = post ? [post.location?.title, post.location?.address].filter(Boolean).join(' · ') : '';
  const firstPhoto = post?.media[0]?.url || '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.title}>Пост</Text>
          <Text style={styles.subtitle}>{post ? `@${post.author.username}` : 'Отдельный просмотр'}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPost('refresh')} />}
      >
        {loading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.statusText}>Открываем пост</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        {!loading && post ? (
          <>
            <View style={styles.card}>
              <Pressable accessibilityRole="button" onPress={() => onOpenAccount(post.author.id)} style={styles.authorRow}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorAvatarText}>{post.author.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.authorTextBlock}>
                  <Text numberOfLines={1} style={styles.authorName}>{post.author.name}</Text>
                  <Text numberOfLines={1} style={styles.authorMeta}>@{post.author.username}{locationText ? ` · ${locationText}` : ''}</Text>
                </View>
              </Pressable>

              {firstPhoto ? (
                <Image resizeMode="cover" source={{ uri: firstPhoto }} style={styles.postImage} />
              ) : null}

              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={handleLike} style={styles.actionButton}>
                  <Text style={[styles.actionText, post.isLikedByMe && styles.actionTextActive]}>{post.isLikedByMe ? '♥' : '♡'} {post.likesCount}</Text>
                </Pressable>
                <Text style={styles.actionText}>Коммент. {post.commentsCount}</Text>
                <Pressable accessibilityRole="button" onPress={reportPost} style={styles.actionButton}>
                  <Text style={styles.reportActionText}>Пожаловаться</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={handleSave} style={styles.saveButton}>
                  <Text style={[styles.actionText, post.isSavedByMe && styles.actionTextActive]}>{post.isSavedByMe ? 'Сохранено' : 'Сохранить'}</Text>
                </Pressable>
              </View>

              {post.text ? <Text style={styles.postText}>{post.text}</Text> : null}
              <Text style={styles.postTime}>{formatDate(post.publishedAt || post.createdAt)}</Text>
            </View>

            <View style={styles.commentsBlock}>
              <Text style={styles.sectionTitle}>Комментарии</Text>
              {commentsLoading ? (
                <View style={styles.commentsLoading}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={styles.statusText}>Загружаем комментарии</Text>
                </View>
              ) : null}
              {!commentsLoading && comments.length === 0 ? <Text style={styles.emptyText}>Пока нет комментариев</Text> : null}
              {!commentsLoading && comments.map((comment) => (
                <View key={comment.id} style={styles.commentRow}>
                  <Pressable accessibilityRole="button" onPress={() => onOpenAccount(comment.author.id)} style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{comment.author.name.slice(0, 1).toUpperCase()}</Text>
                  </Pressable>
                  <View style={styles.commentBody}>
                    <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <View style={styles.commentMetaRow}>
                      <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                      {comment.canDelete ? (
                        <Pressable accessibilityRole="button" onPress={() => handleDeleteComment(comment.id)}>
                          <Text style={styles.deleteCommentText}>Удалить</Text>
                        </Pressable>
                      ) : (
                        <Pressable accessibilityRole="button" onPress={() => reportComment(comment.id)}>
                          <Text style={styles.reportCommentText}>Пожаловаться</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              <View style={styles.commentInputRow}>
                <TextInput
                  maxLength={500}
                  onChangeText={setCommentText}
                  placeholder="Написать комментарий..."
                  placeholderTextColor={colors.textSecondary}
                  style={styles.commentInput}
                  value={commentText}
                />
                <Pressable accessibilityRole="button" disabled={sendingComment || !commentText.trim()} onPress={handleSendComment} style={[styles.sendButton, (sendingComment || !commentText.trim()) && styles.buttonDisabled]}>
                  <Text style={styles.sendButtonText}>{sendingComment ? '...' : 'Отпр.'}</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 18 },
  backButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38 },
  backText: { color: colors.primary, fontSize: 28, fontWeight: '700', lineHeight: 30 },
  headerTitleBlock: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  content: { paddingBottom: 34, paddingHorizontal: 16, paddingTop: 14 },
  statusBlock: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', paddingVertical: 26 },
  statusText: { color: colors.textSecondary, fontSize: 14 },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '700', lineHeight: 20, paddingVertical: 20, textAlign: 'center' },
  noticeText: { color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  authorRow: { alignItems: 'center', flexDirection: 'row', padding: 14 },
  authorAvatar: { alignItems: 'center', backgroundColor: colors.softBlue, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  authorAvatarText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  authorTextBlock: { flex: 1, marginLeft: 10 },
  authorName: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  authorMeta: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  postImage: { backgroundColor: colors.softBlue, height: 300, width: '100%' },
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 14, paddingTop: 12 },
  actionButton: { paddingVertical: 5 },
  saveButton: { marginLeft: 'auto', paddingVertical: 5 },
  actionText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  actionTextActive: { color: colors.primary },
  reportActionText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  postText: { color: colors.textPrimary, fontSize: 15, lineHeight: 22, paddingHorizontal: 14, paddingTop: 10 },
  postTime: { color: colors.textSecondary, fontSize: 12, padding: 14, paddingTop: 8 },
  commentsBlock: { gap: 10, marginTop: 16 },
  sectionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  commentsLoading: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', paddingVertical: 10, textAlign: 'center' },
  commentRow: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', padding: 12 },
  commentAvatar: { alignItems: 'center', backgroundColor: colors.softBlue, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  commentAvatarText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  commentBody: { flex: 1, marginLeft: 10 },
  commentAuthor: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  commentText: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, marginTop: 3 },
  commentMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 6 },
  commentTime: { color: colors.textSecondary, fontSize: 12 },
  deleteCommentText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  reportCommentText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  commentInputRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 4 },
  commentInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, color: colors.textPrimary, flex: 1, fontSize: 14, minHeight: 44, paddingHorizontal: 13 },
  sendButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 18, height: 44, justifyContent: 'center', paddingHorizontal: 14 },
  sendButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  buttonDisabled: { opacity: 0.55 }
});
