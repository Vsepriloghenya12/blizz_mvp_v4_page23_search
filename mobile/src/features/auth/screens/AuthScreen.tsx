import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { BlizzIcon } from '../../../shared/ui/BlizzIcon';
import { ApiError } from '../../../shared/api/client';
import type { AuthResponse } from '../../../shared/api/types';
import { colors } from '../../../shared/ui/theme';
import { login as loginRequest, register as registerRequest } from '../api/authApi';

type AuthMode = 'register' | 'login';

type AuthScreenProps = {
  onAuthSuccess: (auth: AuthResponse) => void;
};

const ICON_COLOR = '#0B1220';
const ICON_SIZE = 23;
const ICON_STROKE = 2.25;

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('register');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegisterMode = mode === 'register';

  async function submit() {
    const trimmedLogin = login.trim();
    if (!trimmedLogin) {
      setError('Введите телефон или email');
      return;
    }

    if (!password) {
      setError('Введите пароль');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = isRegisterMode
        ? await registerRequest(trimmedLogin, password)
        : await loginRequest(trimmedLogin, password);
      onAuthSuccess(response);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Не удалось выполнить действие. Попробуйте позже.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.phoneShell}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="cover"
                source={require('../../../../assets/auth-hero-city-oil-clean.png')}
                style={styles.heroImage}
              />
            </View>

            <View style={styles.brandBlock}>
              <Text style={styles.logo}>Близз</Text>
              <Text style={styles.subtitle}>Люди, места, Близзы и бизнес рядом</Text>
            </View>

            <View style={styles.formArea}>
              <View style={styles.form}>
                <View style={styles.inputRow}>
                  <BlizzIcon color={ICON_COLOR} name="smartphone" size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChangeText={setLogin}
                    placeholder="Телефон или email"
                    placeholderTextColor="#8A96A8"
                    style={styles.inputField}
                    value={login}
                  />
                </View>

                <View style={styles.inputRow}>
                  <BlizzIcon color={ICON_COLOR} name="lock" size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setPassword}
                    placeholder="Пароль"
                    placeholderTextColor="#8A96A8"
                    secureTextEntry={!passwordVisible}
                    style={styles.inputField}
                    value={password}
                  />
                  <Pressable
                    accessibilityLabel={passwordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                    accessibilityRole="button"
                    onPress={() => setPasswordVisible((value) => !value)}
                    style={styles.iconButton}
                  >
                    {passwordVisible ? (
                      <BlizzIcon color={ICON_COLOR} name="eyeOff" size={24} strokeWidth={2.25} />
                    ) : (
                      <BlizzIcon color={ICON_COLOR} name="eye" size={24} strokeWidth={2.25} />
                    )}
                  </Pressable>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={submit}
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>{isRegisterMode ? 'Создать аккаунт' : 'Войти'}</Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.modeLine}>
                <Text style={styles.modeLineText}>{isRegisterMode ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => switchMode(isRegisterMode ? 'login' : 'register')}
                  style={styles.modeLinkPressable}
                >
                  <Text style={styles.modeLineLink}>{isRegisterMode ? 'Войти' : 'Создать'}</Text>
                </Pressable>
              </View>

              <Text style={styles.legalText}>
                Регистрируясь в приложении,{`\n`}вы соглашаетесь с <Text style={styles.legalLink}>пользовательским соглашением</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? '#EEF2F7' : colors.background,
    flex: 1,
    justifyContent: 'center',
    width: '100%'
  },
  phoneShell: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    flex: 1,
    maxWidth: 430,
    overflow: 'hidden',
    width: '100%'
  },
  keyboard: {
    flex: 1
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 26
  },
  heroCard: {
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    height: 318,
    overflow: 'hidden',
    width: '100%'
  },
  heroImage: {
    height: '100%',
    width: '100%'
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: 34,
    paddingHorizontal: 28,
    width: '100%'
  },
  logo: {
    color: colors.primary,
    fontSize: 58,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: -2.4,
    lineHeight: 62,
    textAlign: 'center'
  },
  subtitle: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 24,
    marginTop: 14,
    textAlign: 'center'
  },
  formArea: {
    marginTop: 30,
    maxWidth: 390,
    paddingHorizontal: 28,
    width: '100%'
  },
  form: {
    gap: 16,
    width: '100%'
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: '#D7E1EF',
    borderRadius: 22,
    borderWidth: 1.4,
    flexDirection: 'row',
    minHeight: 68,
    paddingLeft: 20,
    paddingRight: 16
  },
  inputField: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    marginLeft: 16,
    minHeight: 62,
    padding: 0
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 38,
    justifyContent: 'center',
    marginLeft: 10,
    width: 38
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -2
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 66
  },
  submitButtonDisabled: {
    opacity: 0.72
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  modeLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30
  },
  modeLineText: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 24
  },
  modeLinkPressable: {
    marginLeft: 9,
    paddingVertical: 4
  },
  modeLineLink: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22
  },
  legalText: {
    alignSelf: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 26,
    textAlign: 'center',
    width: '100%'
  },
  legalLink: {
    color: colors.primary,
    fontWeight: '700'
  }
});
