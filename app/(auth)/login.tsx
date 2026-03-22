import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const { isDark, colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Tüm alanları doldurun'); return; }

    setLoading(true);
    const result = await login(email.trim(), password, rememberMe);
    setLoading(false);

    if (result.error) {
      if (result.error.includes('doğrula') && result.userId) {
        router.push({ pathname: '/(auth)/verify-email', params: { userId: result.userId, email } });
      } else {
        setError(result.error);
      }
    }
    // success: _layout.tsx handles redirect via useAuth
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (result.error) setError(result.error);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kv}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.accent }]}>Giriş Yap</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: isDark ? '#27272a' : '#f9fafb', borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={18} color={colors.accent} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="ornek@email.com"
                placeholderTextColor={isDark ? '#52525b' : '#9ca3af'}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Şifre</Text>
            <View style={[styles.inputWrap, { backgroundColor: isDark ? '#27272a' : '#f9fafb', borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.accent} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={isDark ? '#52525b' : '#9ca3af'}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberRow}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                { borderColor: colors.accent, backgroundColor: rememberMe ? colors.accent : 'transparent' },
              ]}>
                {rememberMe && <Ionicons name="checkmark" size={12} color={isDark ? '#09090b' : '#fff'} />}
              </View>
              <Text style={[styles.rememberText, { color: colors.textMuted }]}>Beni Hatırla</Text>
            </TouchableOpacity>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity>
                <Text style={[styles.forgotText, { color: colors.accent }]}>Şifremi Unuttum</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={[styles.btnText, { color: colors.accentText }]}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#3f3f46' : '#e5e7eb' }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>veya</Text>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#3f3f46' : '#e5e7eb' }]} />
          </View>

          {/* Google Login */}
          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: isDark ? '#3f3f46' : '#e5e7eb' }]}
            onPress={handleGoogleLogin}
            disabled={googleLoading || loading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={[styles.googleText, { color: isDark ? '#f4f4f5' : '#111827' }]}>
                  Google ile Giriş Yap
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Signup link */}
          <View style={styles.bottomRow}>
            <Text style={{ color: colors.textMuted }}>Hesabın yok mu? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.accent }]}>Kayıt Ol</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kv: { flex: 1 },
  scroll: { padding: 28, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 32 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  rememberText: { fontSize: 13 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  btn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 24,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  linkText: { fontSize: 14, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, borderRadius: 14, borderWidth: 1, paddingVertical: 14,
    backgroundColor: '#fff', marginBottom: 28,
  },
  googleIcon: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4285F4',
  },
  googleG: { color: '#fff', fontSize: 13, fontWeight: '800' },
  googleText: { fontSize: 15, fontWeight: '600' },
});
