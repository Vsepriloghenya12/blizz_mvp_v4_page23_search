import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, FeedVideoItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getVideoDetail, toggleVideoLike, toggleVideoSave } from '../../features/videos/api/videosApi';
import { BackButton } from '../../shared/ui/BackButton';
import { createReport } from '../../features/reports/api/reportsApi';

type VideoDetailScreenProps = {
  auth: AuthResponse;
  videoId: string;
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

export function VideoDetailScreen({ auth, videoId, onBack, onOpenAccount }: VideoDetailScreenProps) {
  const [video, setVideo] = useState<FeedVideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadVideo(mode: 'initial' | 'refresh' = 'initial') {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      const response = await getVideoDetail(auth.session.token, videoId);
      setVideo(response.video);
    } catch (_error) {
      setError('Не удалось открыть видео. Оно удалено или недоступно для этого аккаунта.');
      setVideo(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadVideo();
  }, [auth.session.token, auth.activeAccount.id, videoId]);

  async function handleLike() {
    if (!video) return;
    const previous = video;
    const nextLiked = !video.isLikedByMe;
    setVideo({ ...video, isLikedByMe: nextLiked, likesCount: Math.max(0, video.likesCount + (nextLiked ? 1 : -1)) });
    try {
      const response = await toggleVideoLike(auth.session.token, video.id);
      setVideo((current) => current ? { ...current, isLikedByMe: response.isLikedByMe, likesCount: response.likesCount } : current);
    } catch (_error) {
      setVideo(previous);
      setNotice('Не удалось обновить лайк.');
    }
  }

  async function handleSave() {
    if (!video) return;
    const previous = video;
    const nextSaved = !video.isSavedByMe;
    setVideo({ ...video, isSavedByMe: nextSaved, savesCount: Math.max(0, video.savesCount + (nextSaved ? 1 : -1)) });
    try {
      const response = await toggleVideoSave(auth.session.token, video.id);
      setVideo((current) => current ? { ...current, isSavedByMe: response.isSavedByMe, savesCount: response.savesCount } : current);
    } catch (_error) {
      setVideo(previous);
      setNotice('Не удалось сохранить видео.');
    }
  }

  async function reportVideo() {
    if (!video) return;
    setNotice(null);
    try {
      await createReport(auth.session.token, { targetType: 'video', targetId: video.id, reason: 'other', comment: 'Жалоба на видео' });
      setNotice('Жалоба отправлена на проверку.');
    } catch (_error) {
      setNotice('Не удалось отправить жалобу.');
    }
  }

  const locationText = video ? [video.location?.title, video.location?.address].filter(Boolean).join(' · ') : '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <View style={styles.headerTitleBlock}>
          <Text style={styles.title}>Видео</Text>
          <Text style={styles.subtitle}>{video ? `@${video.author.username}` : 'Отдельный просмотр'}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadVideo('refresh')} />}
      >
        {loading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.statusText}>Открываем видео</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        {!loading && video ? (
          <View style={styles.card}>
            <Pressable accessibilityRole="button" onPress={() => onOpenAccount(video.author.id)} style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                <Text style={styles.authorAvatarText}>{video.author.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.authorTextBlock}>
                <Text numberOfLines={1} style={styles.authorName}>{video.author.name}</Text>
                <Text numberOfLines={1} style={styles.authorMeta}>@{video.author.username}{locationText ? ` · ${locationText}` : ''}</Text>
              </View>
            </Pressable>

            <Image resizeMode="cover" source={{ uri: video.coverUrl }} style={styles.cover} />

            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={handleLike} style={styles.actionButton}>
                <Text style={[styles.actionText, video.isLikedByMe && styles.actionTextActive]}>{video.isLikedByMe ? '♥' : '♡'} {video.likesCount}</Text>
              </Pressable>
              <Text style={styles.actionText}>Коммент. {video.commentsCount}</Text>
              <Pressable accessibilityRole="button" onPress={reportVideo} style={styles.actionButton}>
                <Text style={styles.reportActionText}>Пожаловаться</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={handleSave} style={styles.saveButton}>
                <Text style={[styles.actionText, video.isSavedByMe && styles.actionTextActive]}>{video.isSavedByMe ? 'Сохранено' : 'Сохранить'}</Text>
              </Pressable>
            </View>

            {video.description ? <Text style={styles.description}>{video.description}</Text> : null}
            <Text style={styles.meta}>♪ {video.soundTitle || 'Оригинальный звук'}</Text>
            <Text numberOfLines={2} style={styles.videoUrl}>Видео: {video.videoUrl}</Text>
            <Text style={styles.time}>{formatDate(video.publishedAt || video.createdAt)}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 18 },
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
  cover: { backgroundColor: colors.softBlue, height: 420, width: '100%' },
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 14, paddingTop: 12 },
  actionButton: { paddingVertical: 5 },
  saveButton: { marginLeft: 'auto', paddingVertical: 5 },
  actionText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  actionTextActive: { color: colors.primary },
  reportActionText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  description: { color: colors.textPrimary, fontSize: 15, lineHeight: 22, paddingHorizontal: 14, paddingTop: 10 },
  meta: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', paddingHorizontal: 14, paddingTop: 8 },
  videoUrl: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, paddingHorizontal: 14, paddingTop: 6 },
  time: { color: colors.textSecondary, fontSize: 12, padding: 14, paddingTop: 8 }
});
