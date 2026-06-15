import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { updateMyProfile } from '../../features/profile/api/profileApi';

type EditProfileScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onAuthUpdate: (auth: AuthResponse) => void;
};

export function EditProfileScreen({ auth, onBack, onAuthUpdate }: EditProfileScreenProps) {
  const account = auth.activeAccount;
  const [name, setName] = useState(account.name);
  const [username, setUsername] = useState(account.username);
  const [bio, setBio] = useState(account.bio || '');
  const [city, setCity] = useState(account.city || '');
  const [link, setLink] = useState(account.link || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const response = await updateMyProfile(auth.session.token, { name, username, bio, city, link });
      onAuthUpdate(response.auth);
      onBack();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось сохранить. Проверьте интернет';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Редактировать профиль</Text>
        <Pressable accessibilityRole="button" disabled={saving} onPress={handleSave} style={styles.saveButton}>
          <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>{saving ? 'Сохраняем' : 'Сохранить'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase() || 'П'}</Text>
          </View>
          <Text style={styles.avatarNote}>Фото профиля добавим после согласования media-picker.</Text>
        </View>

        <ProfileField label="Имя" value={name} onChangeText={setName} maxLength={40} placeholder="Пользователь" />
        <ProfileField label="Никнейм" value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={24} placeholder="user_123456" />
        <ProfileField label="О себе" value={bio} onChangeText={setBio} maxLength={150} multiline placeholder="Расскажите коротко о себе" />
        <ProfileField label="Город" value={city} onChangeText={setCity} maxLength={60} placeholder="Город" />
        <ProfileField label="Ссылка" value={link} onChangeText={setLink} autoCapitalize="none" maxLength={120} placeholder="https://..." />

        <Text style={styles.ruleText}>Никнейм: латинские буквы, цифры и подчёркивание, 3–24 символа.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type ProfileFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function ProfileField({ label, value, onChangeText, placeholder, maxLength, multiline, autoCapitalize }: ProfileFieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize || 'sentences'}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 12
  },
  backButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700'
  },
  title: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  saveButton: {
    alignItems: 'flex-end',
    minWidth: 86,
    paddingVertical: 9
  },
  saveText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800'
  },
  saveTextDisabled: {
    color: colors.textSecondary
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 18
  },
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderColor: colors.border,
    borderRadius: 36,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    width: 72
  },
  avatarText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800'
  },
  avatarNote: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  fieldBlock: {
    marginTop: 12
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: 'top'
  },
  ruleText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 14
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12
  }
});
