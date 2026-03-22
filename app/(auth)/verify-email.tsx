import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function VerifyEmailScreen() {
  const { userId, email } = useLocalSearchParams<{ userId: string; email: string }>();
  const router = useRouter();
  const { verifyEmail } = useAuth();
  const { isDark, colors } = useTheme();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError('');
    if (!code.trim()) { setError('Doğrulama kodu gerekli'); return; }

    setLoading(true);
    const result = await verifyEmail(userId!, code.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
    }
    // success: _layout.tsx handles redirect
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kv}
      >
        <View style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(34,211,238,0.1)' : 'rgba(37,99,235,0.1)' }]}>
            <Ionicons name="mail" size={40} color={colors.accent} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Email Doğrula</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {email} adresine gönderilen 6 haneli kodu girin.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: isDark ? '#27272a' : '#f9fafb',
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={isDark ? '#52525b' : '#9ca3af'}
            textAlign="center"
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={[styles.btnText, { color: colors.accentText }]}>Doğrula</Text>
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
  iconBox: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 14, marginBottom: 20,
  },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  codeInput: {
    borderRadius: 14, borderWidth: 1,
    fontSize: 28, fontWeight: '700',
    paddingVertical: 16, marginBottom: 24,
    letterSpacing: 8,
  },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
});
