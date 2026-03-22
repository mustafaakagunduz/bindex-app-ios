import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const { isDark, colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError('');
    if (!email || !password || !confirmPassword) { setError('Tüm alanları doldurun'); return; }
    if (password !== confirmPassword) { setError('Şifreler eşleşmiyor'); return; }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }

    setLoading(true);
    const result = await signup(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push({ pathname: '/(auth)/verify-email', params: { userId: result.data.id, email: result.data.email } });
    }
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
          <Text style={[styles.title, { color: colors.accent }]}>Kayıt Ol</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Yeni hesap oluştur</Text>

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
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Şifre Tekrar</Text>
            <View style={[
              styles.inputWrap,
              {
                backgroundColor: isDark ? '#27272a' : '#f9fafb',
                borderColor: confirmPassword && confirmPassword !== password
                  ? 'rgba(239,68,68,0.5)'
                  : colors.border,
              },
            ]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.accent} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholder="••••••••"
                placeholderTextColor={isDark ? '#52525b' : '#9ca3af'}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={[styles.btnText, { color: colors.accentText }]}>Kayıt Ol</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={{ color: colors.textMuted }}>Zaten hesabın var mı? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.accent }]}>Giriş Yap</Text>
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
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 32 },
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
  btn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 24,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  linkText: { fontSize: 14, fontWeight: '700' },
});
