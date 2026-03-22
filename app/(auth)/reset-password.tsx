import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function ResetPasswordScreen() {
  const { userId, email } = useLocalSearchParams<{ userId: string; email: string }>();
  const router = useRouter();
  const { verifyResetCode, resetPassword } = useAuth();
  const { isDark, colors } = useTheme();

  const [step, setStep] = useState<'code' | 'password'>('code');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVerifyCode = async () => {
    setError('');
    if (!code.trim()) { setError('Kodu girin'); return; }

    setLoading(true);
    const result = await verifyResetCode(userId!, code.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setVerificationId(result.data.verificationId);
      setStep('password');
    }
  };

  const handleResetPassword = async () => {
    setError('');
    if (!newPassword || !confirmPassword) { setError('Tüm alanları doldurun'); return; }
    if (newPassword !== confirmPassword) { setError('Şifreler eşleşmiyor'); return; }
    if (newPassword.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }

    setLoading(true);
    const result = await resetPassword(userId!, verificationId, newPassword);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kv}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>Şifre Sıfırla</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {step === 'code' ? `${email} adresine gönderilen kodu girin.` : 'Yeni şifrenizi belirleyin.'}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Şifreniz başarıyla güncellendi! Yönlendiriliyorsunuz...</Text>
            </View>
          ) : null}

          {step === 'code' ? (
            <>
              <TextInput
                style={[styles.codeInput, { backgroundColor: isDark ? '#27272a' : '#f9fafb', borderColor: colors.border, color: colors.text }]}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={isDark ? '#52525b' : '#9ca3af'}
                textAlign="center"
              />
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={handleVerifyCode} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={colors.accentText} /> : <Text style={[styles.btnText, { color: colors.accentText }]}>Kodu Doğrula</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Yeni Şifre</Text>
                <View style={[styles.inputWrap, { backgroundColor: isDark ? '#27272a' : '#f9fafb', borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.accent} style={styles.inputIcon} />
                  <TextInput style={[styles.input, { color: colors.text }]} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showPwd} placeholder="••••••••" placeholderTextColor={isDark ? '#52525b' : '#9ca3af'} />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)}><Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} /></TouchableOpacity>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Şifre Tekrar</Text>
                <View style={[styles.inputWrap, { backgroundColor: isDark ? '#27272a' : '#f9fafb', borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.accent} style={styles.inputIcon} />
                  <TextInput style={[styles.input, { color: colors.text }]} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} placeholder="••••••••" placeholderTextColor={isDark ? '#52525b' : '#9ca3af'} />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}><Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} /></TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={handleResetPassword} disabled={loading || success} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={colors.accentText} /> : <Text style={[styles.btnText, { color: colors.accentText }]}>Şifreyi Güncelle</Text>}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kv: { flex: 1 },
  scroll: { padding: 28, paddingTop: 20 },
  backBtn: { marginBottom: 32, alignSelf: 'flex-start', padding: 4 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 28 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 14, marginBottom: 20 },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  successBox: { backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', borderRadius: 12, padding: 14, marginBottom: 20 },
  successText: { color: '#22c55e', fontSize: 13, textAlign: 'center' },
  codeInput: { borderRadius: 14, borderWidth: 1, fontSize: 28, fontWeight: '700', paddingVertical: 16, marginBottom: 24, letterSpacing: 8 },
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 14 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: '700' },
});
