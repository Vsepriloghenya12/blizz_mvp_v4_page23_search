import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { BUSINESS_CATEGORIES, createBusinessAccount } from '../../features/accounts/api/accountsApi';
import { BackButton } from '../../shared/ui/BackButton';

const defaultCategory = BUSINESS_CATEGORIES[0];

type CreateBusinessScreenProps = {
  auth: AuthResponse;
  onAuthUpdate: (auth: AuthResponse) => void;
  onBack: () => void;
  onCreated: () => void;
};

export function CreateBusinessScreen({ auth, onAuthUpdate, onBack, onCreated }: CreateBusinessScreenProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState<string>(defaultCategory);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedUsername = useMemo(() => username.trim().toLowerCase(), [username]);

  async function handleCreate() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const response = await createBusinessAccount(auth.session.token, {
        name,
        username: normalizedUsername,
        category,
        description,
        address,
        phone,
        website
      });
      onAuthUpdate(response);
      onCreated();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось создать бизнес. Проверьте интернет';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.title}>Создать бизнес</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>Бизнес-аккаунт будет отдельным аккаунтом. Личный профиль останется доступен в переключателе.</Text>

        <BusinessField label="Название бизнеса" value={name} onChangeText={setName} maxLength={80} placeholder="Кофейня на Морской" />
        <BusinessField label="Никнейм" value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={24} placeholder="coffee_morskaya" />

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Категория</Text>
          <View style={styles.categoryGrid}>
            {BUSINESS_CATEGORIES.map((item) => {
              const active = category === item;
              return (
                <Pressable accessibilityRole="button" key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, active && styles.categoryChipActive]}>
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <BusinessField label="Описание" value={description} onChangeText={setDescription} maxLength={220} multiline placeholder="Коротко о бизнесе" />
        <BusinessField label="Адрес" value={address} onChangeText={setAddress} maxLength={160} placeholder="Город, улица, дом" />
        <BusinessField label="Телефон" value={phone} onChangeText={setPhone} maxLength={32} placeholder="+7..." keyboardType="phone-pad" />
        <BusinessField label="Сайт / ссылка" value={website} onChangeText={setWebsite} autoCapitalize="none" maxLength={140} placeholder="https://..." />

        <Text style={styles.ruleText}>Обязательные поля: название, никнейм и категория. Геометку бизнеса добавим в модуле карты.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable accessibilityRole="button" disabled={saving} onPress={handleCreate} style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}>
          <Text style={styles.primaryButtonText}>{saving ? 'Создаём' : 'Создать бизнес'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type BusinessFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'phone-pad' | 'url';
};

function BusinessField({ label, value, onChangeText, placeholder, maxLength, multiline, autoCapitalize, keyboardType }: BusinessFieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize || 'sentences'}
        keyboardType={keyboardType || 'default'}
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
  title: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  headerSpacer: {
    width: 38
  },
  content: {
    paddingBottom: 30,
    paddingHorizontal: 16,
    paddingTop: 18
  },
  lead: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  },
  fieldBlock: {
    marginTop: 13
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  categoryChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  categoryChipActive: {
    backgroundColor: colors.softBlue,
    borderColor: colors.primary
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700'
  },
  categoryTextActive: {
    color: colors.primary
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
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    minHeight: 50,
    justifyContent: 'center',
    marginTop: 18
  },
  primaryButtonDisabled: {
    opacity: 0.7
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  }
});
