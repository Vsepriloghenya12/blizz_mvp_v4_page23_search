import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse, StoryItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getStoryDetail, markStoryView, replyToStory } from '../../features/stories/api/storiesApi';
import { createReport } from '../../features/reports/api/reportsApi';

type StoryDetailScreenProps = {
  auth: AuthResponse;
  storyId: string;
  onBack: () => void;
  onOpenAccount: (accountId: string) => void;
};

function getStoryLocationLabel(story: StoryItem) {
  return story.location?.title || story.location?.address || '';
}

export function StoryDetailScreen({ auth, storyId, onBack, onOpenAccount }: StoryDetailScreenProps) {
  const [story, setStory] = useState<StoryItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyMessage, setReplyMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStory() {
    setLoading(true);
    setError(null);
    setReplyMessage(null);
    try {
      const response = await getStoryDetail(auth.session.token, storyId);
      setStory(response.story);
      if (!response.story.isSeenByMe) {
        const viewed = await markStoryView(auth.session.token, response.story.id);
        setStory({ ...response.story, isSeenByMe: viewed.isSeenByMe, viewsCount: viewed.viewsCount });
      }
    } catch (_error) {
      setStory(null);
      setError('Близз удалён, истёк или недоступен для этого аккаунта.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStory();
  }, [auth.session.token, auth.activeAccount.id, storyId]);

  async function handleSendReply() {
    const text = replyText.trim();
    if (!story || !text) {
      setReplyMessage('Введите ответ');
      return;
    }

    setSendingReply(true);
    setReplyMessage(null);
    try {
      await replyToStory(auth.session.token, story.id, text);
      setReplyText('');
      setReplyMessage('Ответ отправлен');
    } catch (_error) {
      setReplyMessage('Не удалось отправить ответ');
    } finally {
      setSendingReply(false);
    }
  }

  async function reportStory() {
    if (!story) return;
    setReplyMessage(null);
    try {
      await createReport(auth.session.token, { targetType: 'story', targetId: story.id, reason: 'other', comment: 'Жалоба на Близз' });
      setReplyMessage('Жалоба отправлена');
    } catch (_error) {
      setReplyMessage('Не удалось отправить жалобу');
    }
  }

  const location = story ? getStoryLocationLabel(story) : '';

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={styles.statusBlock}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.statusText}>Открываем Близз</Text>
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Назад</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && story ? (
        <>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => onOpenAccount(story.author.id)} style={styles.authorBlock}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{story.author.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.authorName}>{story.author.name}</Text>
                <Text style={styles.authorMeta}>@{story.author.username} · {story.viewsCount} просмотров</Text>
              </View>
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable accessibilityRole="button" onPress={reportStory} style={styles.reportButton}>
                <Text style={styles.reportText}>!</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onBack} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.mediaWrap}>
            {story.mediaType === 'image' ? (
              <Image resizeMode="cover" source={{ uri: story.mediaUrl }} style={styles.image} />
            ) : (
              <View style={styles.videoStub}>
                <Text style={styles.videoText}>Видео Близз</Text>
                <Text style={styles.videoUrl} numberOfLines={3}>{story.mediaUrl}</Text>
              </View>
            )}
            {story.text ? <Text style={styles.overlayText}>{story.text}</Text> : null}
            {location ? <Text style={styles.locationText}>⌖ {location}</Text> : null}
          </View>

          {replyMessage ? <Text style={styles.replyMessage}>{replyMessage}</Text> : null}
          <View style={styles.replyRow}>
            <TextInput
              maxLength={500}
              onChangeText={setReplyText}
              placeholder="Ответить..."
              placeholderTextColor="#D0D5DD"
              style={styles.replyInput}
              value={replyText}
            />
            <Pressable
              accessibilityRole="button"
              disabled={sendingReply}
              onPress={handleSendReply}
              style={[styles.replyButton, sendingReply && styles.buttonDisabled]}
            >
              <Text style={styles.replyButtonText}>{sendingReply ? '...' : 'Отпр.'}</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#061123', flex: 1, paddingHorizontal: 14, paddingTop: 14 },
  statusBlock: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', paddingTop: 40 },
  statusText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  errorBlock: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 22 },
  errorText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', lineHeight: 23, textAlign: 'center' },
  errorButton: { backgroundColor: '#FFFFFF', borderRadius: 18, marginTop: 18, paddingHorizontal: 18, paddingVertical: 10 },
  errorButtonText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  authorBlock: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: 10 },
  avatar: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 19, height: 38, justifyContent: 'center', width: 38 },
  avatarText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  authorName: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  authorMeta: { color: '#D0D5DD', fontSize: 12, marginTop: 2 },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  reportButton: { alignItems: 'center', borderColor: 'rgba(255,255,255,0.32)', borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  reportText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  closeButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  closeText: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', lineHeight: 32 },
  mediaWrap: { borderRadius: 26, flex: 1, marginTop: 16, overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
  videoStub: { alignItems: 'center', backgroundColor: '#0B1F3F', flex: 1, justifyContent: 'center', padding: 22 },
  videoText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  videoUrl: { color: '#D0D5DD', fontSize: 13, lineHeight: 19, marginTop: 10, textAlign: 'center' },
  overlayText: { bottom: 62, color: '#FFFFFF', fontSize: 18, fontWeight: '900', left: 16, lineHeight: 24, position: 'absolute', right: 16, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { height: 1, width: 0 }, textShadowRadius: 4 },
  locationText: { bottom: 28, color: '#FFFFFF', fontSize: 13, fontWeight: '800', left: 16, position: 'absolute', right: 16, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { height: 1, width: 0 }, textShadowRadius: 4 },
  replyMessage: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  replyRow: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingBottom: 14, paddingTop: 10 },
  replyInput: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)', borderRadius: 18, borderWidth: 1, color: '#FFFFFF', flex: 1, fontSize: 14, minHeight: 42, paddingHorizontal: 13 },
  replyButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, minHeight: 42, justifyContent: 'center', paddingHorizontal: 14 },
  replyButtonText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  buttonDisabled: { opacity: 0.55 }
});
