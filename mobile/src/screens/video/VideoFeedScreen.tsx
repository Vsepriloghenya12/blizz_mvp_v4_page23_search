import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, FeedVideoItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getVideoFeed, toggleVideoLike, toggleVideoSave } from '../../features/videos/api/videosApi';

type VideoFeedScreenProps = {
  auth: AuthResponse;
  onOpenAccount: (accountId: string) => void;
  onOpenVideo: (videoId: string) => void;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function VideoFeedScreen({ auth, onOpenAccount, onOpenVideo }: VideoFeedScreenProps) {
  const [items, setItems] = useState<FeedVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFeed({ refresh = false } = {}) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await getVideoFeed(auth.session.token);
      setItems(response.items);
    } catch (_error) {
      setError('Не удалось загрузить видео');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadFeed();
  }, [auth.session.token, auth.activeAccount.id]);

  async function handleLike(videoId: string) {
    const previousItems = items;
    setItems((current) => current.map((item) => {
      if (item.id !== videoId) return item;
      const isLikedByMe = !item.isLikedByMe;
      return {
        ...item,
        isLikedByMe,
        likesCount: Math.max(0, item.likesCount + (isLikedByMe ? 1 : -1))
      };
    }));

    try {
      const response = await toggleVideoLike(auth.session.token, videoId);
      setItems((current) => current.map((item) => item.id === videoId ? {
        ...item,
        isLikedByMe: response.isLikedByMe,
        likesCount: response.likesCount
      } : item));
    } catch (_error) {
      setItems(previousItems);
    }
  }

  async function handleSave(videoId: string) {
    const previousItems = items;
    setItems((current) => current.map((item) => {
      if (item.id !== videoId) return item;
      const isSavedByMe = !item.isSavedByMe;
      return {
        ...item,
        isSavedByMe,
        savesCount: Math.max(0, item.savesCount + (isSavedByMe ? 1 : -1))
      };
    }));

    try {
      const response = await toggleVideoSave(auth.session.token, videoId);
      setItems((current) => current.map((item) => item.id === videoId ? {
        ...item,
        isSavedByMe: response.isSavedByMe,
        savesCount: response.savesCount
      } : item));
    } catch (_error) {
      setItems(previousItems);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFeed({ refresh: true })} />}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Видео</Text>
        <Text style={styles.subtitle}>Вертикальная лента Близз</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Загружаем видео</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && items.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyText}>Пока нет видео</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {items.map((item) => {
          const location = item.location?.title || item.location?.address || '';
          return (
            <View key={item.id} style={styles.videoCard}>
              <Pressable accessibilityRole="button" onPress={() => onOpenVideo(item.id)} style={styles.coverPressable}>
                <Image resizeMode="cover" source={{ uri: item.coverUrl }} style={styles.cover} />
              </Pressable>
              <View style={styles.overlay}>
                <Pressable accessibilityRole="button" onPress={() => onOpenVideo(item.id)} style={styles.infoBlock}>
                  <Pressable accessibilityRole="button" onPress={() => onOpenAccount(item.author.id)}><Text style={styles.author}>@{item.author.username}</Text></Pressable>
                  <Text style={styles.description}>{item.description || 'Без описания'}</Text>
                  <Text style={styles.meta}>♪ {item.soundTitle || 'Оригинальный звук'}</Text>
                  {location ? <Text style={styles.meta}>⌖ {location}</Text> : null}
                  <Text style={styles.time}>{formatTime(item.publishedAt || item.createdAt)}</Text>
                  <Text numberOfLines={1} style={styles.videoUrl}>Видео: {item.videoUrl}</Text>
                </Pressable>
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" onPress={() => handleLike(item.id)} style={styles.actionButton}>
                    <Text style={[styles.actionIcon, item.isLikedByMe && styles.actionIconActive]}>{item.isLikedByMe ? '♥' : '♡'}</Text>
                    <Text style={styles.actionCount}>{item.likesCount}</Text>
                  </Pressable>
                  <View style={styles.actionButton}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionCount}>{item.commentsCount}</Text>
                  </View>
                  <View style={styles.actionButton}>
                    <Text style={styles.actionIcon}>↗</Text>
                    <Text style={styles.actionCount}>Share</Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => handleSave(item.id)} style={styles.actionButton}>
                    <Text style={[styles.actionIcon, item.isSavedByMe && styles.actionIconActive]}>{item.isSavedByMe ? '◆' : '◇'}</Text>
                    <Text style={styles.actionCount}>{item.savesCount}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 20
  },
  header: {
    marginBottom: 18
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3
  },
  loadingBlock: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 12
  },
  emptyBlock: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700'
  },
  list: {
    gap: 18
  },
  videoCard: {
    backgroundColor: '#071B3A',
    borderRadius: 28,
    height: 620,
    overflow: 'hidden'
  },
  cover: {
    height: '100%',
    width: '100%'
  },
  coverPressable: {
    height: '100%',
    width: '100%'
  },
  overlay: {
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0
  },
  infoBlock: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingRight: 12
  },
  author: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4
  },
  description: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4
  },
  meta: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4
  },
  time: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    opacity: 0.82
  },
  videoUrl: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 5,
    opacity: 0.75
  },
  actions: {
    alignItems: 'center',
    gap: 13,
    justifyContent: 'flex-end',
    width: 52
  },
  actionButton: {
    alignItems: 'center'
  },
  actionIcon: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4
  },
  actionIconActive: {
    color: colors.softBlue
  },
  actionCount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  }
});
