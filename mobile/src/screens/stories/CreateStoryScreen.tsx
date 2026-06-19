import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse, StoryMediaType, StoryVisibility } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { createStory } from '../../features/stories/api/storiesApi';
import { BackButton } from '../../shared/ui/BackButton';

const visibilityOptions: { label: string; value: StoryVisibility; disabled?: boolean }[] = [
  { label: 'Всем', value: 'public' },
  { label: 'Подписчикам', value: 'followers' },
  { label: 'Близким', value: 'close_friends' },
  { label: 'Выбранным', value: 'selected', disabled: true }
];

const mediaTypeOptions: { label: string; value: StoryMediaType }[] = [
  { label: 'Фото', value: 'image' },
  { label: 'Видео', value: 'video' }
];

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message || '').trim();
    if (message) return message;
  }
  return fallback;
}

type CreateStoryScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onOpenAccountSwitcher: () => void;
  onStoryPublished: () => void;
};

export function CreateStoryScreen({ auth, onBack, onOpenAccountSwitcher, onStoryPublished }: CreateStoryScreenProps) {
  const [mediaType, setMediaType] = useState<StoryMediaType>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [text, setText] = useState('');
  const [locationTitle, setLocationTitle] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [visibility, setVisibility] = useState<StoryVisibility>('public');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (!mediaUrl.trim()) {
      setError('Добавьте ссылку на фото или видео');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createStory(auth.session.token, {
        mediaType,
        mediaUrl: mediaUrl.trim(),
        text: text.trim(),
        location: locationTitle.trim() || locationAddress.trim()
          ? {
              title: locationTitle.trim(),
              address: locationAddress.trim(),
              lat: null,
              lng: null,
              precision: 'exact'
            }
          : null,
        visibility
      });
      onStoryPublished();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не удалось опубликовать Близз'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.title}>Создание Близза</Text>
        <View style={styles.headerButton} />
      </View>

      <Pressable accessibilityRole="button" onPress={onOpenAccountSwitcher} style={styles.accountPill}>
        <Text style={styles.accountText}>{auth.activeAccount.name} ▼</Text>
        <Text style={styles.accountMeta}>@{auth.activeAccount.username}</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Тип</Text>
      <View style={styles.chipRow}>
        {mediaTypeOptions.map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => setMediaType(option.value)}
            style={[styles.chip, mediaType === option.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, mediaType === option.value && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Ссылка на фото или видео</Text>
      <TextInput
        autoCapitalize="none"
        onChangeText={setMediaUrl}
        placeholder="https://example.com/story.jpg"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={mediaUrl}
      />

      <Text style={styles.label}>Текст поверх Близза</Text>
      <TextInput
        maxLength={300}
        multiline
        onChangeText={setText}
        placeholder="Короткий текст"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, styles.textArea]}
        value={text}
      />

      <Text style={styles.sectionTitle}>Геометка</Text>
      <TextInput
        onChangeText={setLocationTitle}
        placeholder="Название места"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={locationTitle}
      />
      <TextInput
        onChangeText={setLocationAddress}
        placeholder="Адрес"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={locationAddress}
      />

      <Text style={styles.sectionTitle}>Видимость</Text>
      <View style={styles.chipRow}>
        {visibilityOptions.map((option) => (
          <Pressable
            accessibilityRole="button"
            disabled={option.disabled}
            key={option.value}
            onPress={() => setVisibility(option.value)}
            style={[styles.chip, visibility === option.value && styles.chipActive, option.disabled && styles.chipDisabled]}
          >
            <Text style={[styles.chipText, visibility === option.value && styles.chipTextActive, option.disabled && styles.disabledText]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={handlePublish}
        style={[styles.primaryButton, saving && styles.buttonDisabled]}
      >
        <Text style={styles.primaryButtonText}>{saving ? 'Публикуем...' : 'Опубликовать Близз'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  headerButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800'
  },
  accountPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    padding: 14
  },
  accountText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  accountMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 14
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 20
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  chipActive: {
    backgroundColor: colors.softBlue,
    borderColor: colors.primary
  },
  chipDisabled: {
    opacity: 0.45
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  },
  chipTextActive: {
    color: colors.primary
  },
  disabledText: {
    color: colors.textSecondary
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 16
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    marginTop: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top'
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    height: 50,
    justifyContent: 'center',
    marginTop: 26
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  buttonDisabled: {
    opacity: 0.65
  }
});
