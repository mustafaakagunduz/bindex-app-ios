import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator, ScrollView, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { resetAllUserData } from '../src/lib/database';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark, setTheme, currency, setCurrency, colors } = useTheme();

  const [resetting, setResetting] = useState(false);

  const handleThemeToggle = () => setTheme(isDark ? 'light' : 'dark');

  const handleCurrencyToggle = () => setCurrency(currency === 'TRY' ? 'USD' : 'TRY');

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const handleReset = () => {
    Alert.alert(
      'Tüm Verileri Sıfırla',
      'Bu işlem tüm gelir/gider kayıtlarınızı, ödeme yöntemlerinizi ve IBAN bilgilerinizi kalıcı olarak siler. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Sıfırla',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            await resetAllUserData(user!.id);
            setResetting(false);
            Alert.alert('Başarılı', 'Tüm kayıtlar başarıyla sıfırlandı.');
          },
        },
      ]
    );
  };

  const Row = ({ icon, label, right, onPress, destructive = false }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, { backgroundColor: isDark ? 'rgba(24,24,27,0.5)' : 'rgba(255,255,255,0.8)', borderColor: isDark ? 'rgba(63,63,70,0.3)' : 'rgba(229,231,235,0.5)' }]}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: isDark ? 'rgba(63,63,70,0.5)' : 'rgba(243,244,246,0.8)' }]}>
        <Ionicons name={icon} size={18} color={destructive ? '#ef4444' : colors.accent} />
      </View>
      <Text style={[styles.rowLabel, { color: destructive ? '#ef4444' : colors.text }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Ayarlar</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User info */}
        <View style={[styles.userCard, { backgroundColor: isDark ? 'rgba(34,211,238,0.08)' : 'rgba(37,99,235,0.06)', borderColor: isDark ? 'rgba(34,211,238,0.2)' : 'rgba(37,99,235,0.15)' }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={[styles.avatarTxt, { color: colors.accentText }]}>{user?.email?.[0]?.toUpperCase()}</Text>
          </View>
          <Text style={[styles.userEmail, { color: colors.text }]}>{user?.email}</Text>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Görünüm</Text>
        <Row
          icon={isDark ? 'moon' : 'sunny'}
          label={isDark ? 'Karanlık Mod' : 'Aydınlık Mod'}
          onPress={handleThemeToggle}
          right={<Switch value={isDark} onValueChange={handleThemeToggle} trackColor={{ false: '#d1d5db', true: colors.accent }} thumbColor="#fff" />}
        />

        {/* Currency */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Para Birimi</Text>
        <Row
          icon="cash-outline"
          label={currency === 'TRY' ? 'Türk Lirası (₺)' : 'Amerikan Doları ($)'}
          onPress={handleCurrencyToggle}
          right={
            <View style={[styles.currencyBadge, { backgroundColor: isDark ? 'rgba(34,211,238,0.15)' : 'rgba(37,99,235,0.12)' }]}>
              <Text style={[styles.currencyTxt, { color: colors.accent }]}>{currency === 'TRY' ? '₺ TRY' : '$ USD'}</Text>
            </View>
          }
        />

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Hesap</Text>
        <Row
          icon="log-out-outline"
          label="Çıkış Yap"
          onPress={handleLogout}
        />

        {/* Danger zone */}
        <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Tehlikeli Bölge</Text>
        <View style={[styles.dangerCard, { borderColor: 'rgba(239,68,68,0.25)', backgroundColor: isDark ? 'rgba(239,68,68,0.05)' : 'rgba(254,242,242,0.8)' }]}>
          <View style={styles.dangerHeader}>
            <Ionicons name="warning-outline" size={16} color="#ef4444" />
            <Text style={styles.dangerTitle}>Tüm Kayıtlarımı Sıfırla</Text>
          </View>
          <Text style={[styles.dangerDesc, { color: colors.textMuted }]}>
            Bu işlem tüm gelir/gider kayıtlarınızı, ödeme yöntemlerinizi ve IBAN bilgilerinizi kalıcı olarak siler.
          </Text>
          <TouchableOpacity
            onPress={handleReset}
            disabled={resetting}
            style={styles.dangerBtn}
            activeOpacity={0.85}
          >
            {resetting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.dangerBtnTxt}>Evet, Sıfırla</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingBottom: 48 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 18, fontWeight: '700' },
  userEmail: { fontSize: 14, flex: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 20, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  currencyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currencyTxt: { fontSize: 13, fontWeight: '700' },
  dangerCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dangerTitle: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  dangerDesc: { fontSize: 13, lineHeight: 18 },
  dangerBtn: { backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  dangerBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
