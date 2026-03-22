import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const { isDark, colors } = useTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) { setError('Email adresinizi girin'); return; }

    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push({ pathname: '/(auth)/reset-password', params: { userId: result.data.userId, email } });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kv}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>Şifremi Unuttum</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Email adresinize şifre sıfırlama kodu göndereceğiz.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

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

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={[styles.btnText, { color: colors.accentText }]}>Kod Gönder</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kv: { flex: 1 },
  container: { flex: 1, padding: 28, paddingTop: 20 },
  backBtn: { marginBottom: 32, alignSelf: 'flex-start', padding: 4 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 28 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 14, marginBottom: 20,
  },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  field: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 14 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
});
