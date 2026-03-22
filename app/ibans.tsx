import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, SafeAreaView, TextInput, ActionSheetIOS, Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { getUserIbans, addIban, updateIban, deleteIban } from '../src/lib/database';
import GenericModal from '../src/components/GenericModal';

export default function IbansScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark, colors } = useTheme();

  const [ibans, setIbans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIban, setEditingIban] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formBank, setFormBank] = useState('');
  const [formIban, setFormIban] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // View modal
  const [viewIban, setViewIban] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { if (user?.id) load(); }, [user?.id]);

  const load = async () => {
    setLoading(true);
    const { data } = await getUserIbans(user!.id);
    setIbans(data || []);
    setLoading(false);
  };

  const openModal = (iban?: any) => {
    setEditingIban(iban || null);
    setFormName(iban?.name || '');
    setFormBank(iban?.bank || '');
    setFormIban(iban?.iban_number || '');
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingIban(null); setFormError(''); };

  const handleSave = async () => {
    setFormError('');
    if (!formName.trim() || !formIban.trim()) { setFormError('İsim ve IBAN numarası gerekli'); return; }
    setSaving(true);
    if (editingIban) {
      await updateIban(editingIban.id, { name: formName.trim(), bank: formBank.trim() || null, iban_number: formIban.trim() });
    } else {
      await addIban(user!.id, formName.trim(), formBank.trim() || null, formIban.trim());
    }
    setSaving(false);
    closeModal();
    load();
  };

  const handleLongPress = (iban: any) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['İptal', 'Düzenle', 'Sil'], cancelButtonIndex: 0, destructiveButtonIndex: 2, title: iban.name },
        (idx) => {
          if (idx === 1) openModal(iban);
          if (idx === 2) confirmDelete(iban);
        }
      );
    } else {
      Alert.alert(iban.name, '', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Düzenle', onPress: () => openModal(iban) },
        { text: 'Sil', style: 'destructive', onPress: () => confirmDelete(iban) },
      ]);
    }
  };

  const confirmDelete = (iban: any) => {
    Alert.alert('Emin misiniz?', `"${iban.name}" IBAN kaydı silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteIban(iban.id); load(); } },
    ]);
  };

  const copyText = async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}><Ionicons name="chevron-back" size={26} color={colors.accent} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>IBAN Bilgileri</Text>
        <TouchableOpacity onPress={() => openModal()} style={[styles.addBtn, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
          <Ionicons name="add" size={24} color={colors.accentText} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      ) : ibans.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>Henüz IBAN eklenmemiş</Text>
          <TouchableOpacity onPress={() => openModal()} style={[styles.emptyBtn, { borderColor: colors.accent }]} activeOpacity={0.7}>
            <Ionicons name="add" size={28} color={colors.accent} />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {ibans.map(iban => (
            <TouchableOpacity
              key={iban.id}
              onPress={() => setViewIban(iban)}
              onLongPress={() => handleLongPress(iban)}
              style={[styles.row, { backgroundColor: isDark ? 'rgba(24,24,27,0.5)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(63,63,70,0.3)' : 'rgba(229,231,235,0.5)' }]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(34,211,238,0.1)' : 'rgba(37,99,235,0.1)' }]}>
                <Ionicons name="card-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.ibanName, { color: colors.text }]}>{iban.name}</Text>
                {iban.bank && <Text style={[styles.ibanBank, { color: colors.textMuted }]}>{iban.bank}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <GenericModal isOpen={modalOpen} onClose={closeModal} title={editingIban ? 'IBAN Düzenle' : 'IBAN Ekle'}>
        {formError ? <View style={styles.errBox}><Text style={styles.errTxt}>{formError}</Text></View> : null}

        {[
          { label: 'İsim', value: formName, set: setFormName, placeholder: 'örn. Mustafa' },
          { label: 'Banka', value: formBank, set: setFormBank, placeholder: 'örn. Ziraat Bankası' },
          { label: 'IBAN Numarası', value: formIban, set: setFormIban, placeholder: 'TR00 0000 0000 0000 0000 0000 00', mono: true },
        ].map(f => (
          <View key={f.label} style={styles.mField}>
            <Text style={[styles.mLabel, { color: colors.textMuted }]}>{f.label}</Text>
            <TextInput
              style={[styles.mInput, { backgroundColor: isDark ? '#27272a' : '#f9fafb', borderColor: colors.border, color: colors.text, fontFamily: f.mono ? 'Courier' : undefined }]}
              value={f.value}
              onChangeText={f.set}
              placeholder={f.placeholder}
              placeholderTextColor={isDark ? '#52525b' : '#9ca3af'}
              autoCapitalize="characters"
            />
          </View>
        ))}

        <View style={styles.mBtns}>
          <TouchableOpacity onPress={closeModal} style={[styles.mBtn, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]} activeOpacity={0.7}>
            <Text style={[styles.mBtnTxt, { color: colors.textMuted }]}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.mBtn, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color={colors.accentText} size="small" /> : <Text style={[styles.mBtnTxt, { color: colors.accentText }]}>{editingIban ? 'Güncelle' : 'Ekle'}</Text>}
          </TouchableOpacity>
        </View>
      </GenericModal>

      {/* View Modal */}
      <GenericModal isOpen={!!viewIban} onClose={() => setViewIban(null)} title={viewIban?.name || ''}>
        {viewIban && (
          <View style={styles.viewContent}>
            {[
              { label: 'İsim', value: viewIban.name, field: 'name' },
              viewIban.bank ? { label: 'Banka', value: viewIban.bank, field: 'bank' } : null,
              { label: 'IBAN Numarası', value: viewIban.iban_number, field: 'iban', mono: true },
            ].filter(Boolean).map((item: any) => (
              <View key={item.field} style={[styles.viewRow, { backgroundColor: isDark ? 'rgba(24,24,27,0.5)' : 'rgba(249,250,251,0.8)', borderColor: isDark ? 'rgba(63,63,70,0.3)' : 'rgba(229,231,235,0.5)' }]}>
                <View style={styles.viewTextWrap}>
                  <Text style={[styles.viewRowLabel, { color: colors.textMuted }]}>{item.label}</Text>
                  <Text style={[styles.viewRowValue, { color: colors.text, fontFamily: item.mono ? 'Courier' : undefined }]}>{item.value}</Text>
                </View>
                <TouchableOpacity onPress={() => copyText(item.value, item.field)} style={[styles.copyBtn, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]} activeOpacity={0.7}>
                  <Ionicons name={copied === item.field ? 'checkmark' : 'copy-outline'} size={18} color={copied === item.field ? '#22c55e' : colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity onPress={() => setViewIban(null)} style={[styles.closeBtn, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
              <Text style={[styles.mBtnTxt, { color: colors.accentText }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        )}
      </GenericModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 20, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800' },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTxt: { fontSize: 16 },
  emptyBtn: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  ibanName: { fontSize: 15, fontWeight: '600' },
  ibanBank: { fontSize: 12, marginTop: 2 },
  errBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, marginBottom: 16 },
  errTxt: { color: '#ef4444', fontSize: 13 },
  mField: { marginBottom: 16 },
  mLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  mInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  mBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  mBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  mBtnTxt: { fontSize: 15, fontWeight: '700' },
  viewContent: { gap: 10 },
  viewRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  viewTextWrap: { flex: 1 },
  viewRowLabel: { fontSize: 11, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  viewRowValue: { fontSize: 15 },
  copyBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
});
