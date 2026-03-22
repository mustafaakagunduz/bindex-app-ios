import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, SafeAreaView, TextInput, ActionSheetIOS, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import {
  getUserCategories, addCategory, updateCategory, deleteCategory,
  subscribeToCategories, unsubscribe,
} from '../../src/lib/database';
import GenericModal from '../../src/components/GenericModal';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#a855f7', '#ec4899', '#14b8a6',
];

export default function PaymentMethodsScreen() {
  const { user } = useAuth();
  const { isDark, colors } = useTheme();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(COLORS[0]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const sub = subscribeToCategories(user.id, load);
    return () => unsubscribe(sub);
  }, [user?.id]);

  const load = async () => {
    setLoading(true);
    const { data } = await getUserCategories(user!.id);
    setCategories(data || []);
    setLoading(false);
  };

  const openModal = (cat?: any) => {
    setEditingCat(cat || null);
    setCatName(cat?.name || '');
    setCatColor(cat?.color || COLORS[0]);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingCat(null); setFormError(''); };

  const handleSave = async () => {
    setFormError('');
    if (!catName.trim()) { setFormError('İsim gerekli'); return; }
    const isDup = categories.some(c => c.id !== editingCat?.id && c.name.toLowerCase() === catName.trim().toLowerCase());
    if (isDup) { setFormError('Bu isim zaten mevcut'); return; }

    setSaving(true);
    if (editingCat) {
      await updateCategory(editingCat.id, { name: catName.trim(), color: catColor });
    } else {
      await addCategory(user!.id, catName.trim(), catColor);
    }
    setSaving(false);
    closeModal();
    load();
  };

  const handleLongPress = (cat: any) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['İptal', 'Düzenle', 'Sil'], cancelButtonIndex: 0, destructiveButtonIndex: 2, title: cat.name },
        (idx) => {
          if (idx === 1) openModal(cat);
          if (idx === 2) confirmDelete(cat);
        }
      );
    } else {
      Alert.alert(cat.name, '', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Düzenle', onPress: () => openModal(cat) },
        { text: 'Sil', style: 'destructive', onPress: () => confirmDelete(cat) },
      ]);
    }
  };

  const confirmDelete = (cat: any) => {
    Alert.alert('Emin misiniz?', `"${cat.name}" silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteCategory(cat.id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Ödeme Yöntemleri</Text>
        <TouchableOpacity onPress={() => openModal()} style={[styles.addBtn, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
          <Ionicons name="add" size={24} color={colors.accentText} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      ) : categories.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>Henüz ödeme yöntemi yok</Text>
          <TouchableOpacity onPress={() => openModal()} style={[styles.emptyBtn, { borderColor: colors.accent }]} activeOpacity={0.7}>
            <Ionicons name="add" size={28} color={colors.accent} />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => openModal(cat)}
              onLongPress={() => handleLongPress(cat)}
              style={[styles.row, { backgroundColor: isDark ? 'rgba(24,24,27,0.5)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(63,63,70,0.3)' : 'rgba(229,231,235,0.5)' }]}
              activeOpacity={0.7}
            >
              <View style={[styles.colorBar, { backgroundColor: cat.color }]} />
              <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
              {cat.is_default && <Text style={[styles.defaultBadge, { color: colors.textMuted }]}>Varsayılan</Text>}
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <GenericModal isOpen={modalOpen} onClose={closeModal} title={editingCat ? 'Düzenle' : 'Yeni Ödeme Yöntemi'}>
        {formError ? <View style={styles.errBox}><Text style={styles.errTxt}>{formError}</Text></View> : null}

        <View style={styles.mField}>
          <Text style={[styles.mLabel, { color: colors.textMuted }]}>İsim</Text>
          <TextInput
            style={[styles.mInput, { backgroundColor: isDark ? '#27272a' : '#f9fafb', borderColor: colors.border, color: colors.text }]}
            value={catName}
            onChangeText={setCatName}
            placeholder="örn. Nakit"
            placeholderTextColor={isDark ? '#52525b' : '#9ca3af'}
            autoFocus
          />
        </View>

        <View style={styles.mField}>
          <Text style={[styles.mLabel, { color: colors.textMuted }]}>Renk</Text>
          <View style={styles.colorGrid}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setCatColor(c)}
                style={[styles.colorDot, { backgroundColor: c }, catColor === c && styles.colorDotSelected]}
                activeOpacity={0.8}
              />
            ))}
          </View>
        </View>

        <View style={styles.mBtns}>
          <TouchableOpacity onPress={closeModal} style={[styles.mBtn, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]} activeOpacity={0.7}>
            <Text style={[styles.mBtnTxt, { color: colors.textMuted }]}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.mBtn, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color={colors.accentText} size="small" /> : <Text style={[styles.mBtnTxt, { color: colors.accentText }]}>{editingCat ? 'Güncelle' : 'Ekle'}</Text>}
          </TouchableOpacity>
        </View>
      </GenericModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '800' },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTxt: { fontSize: 16 },
  emptyBtn: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingVertical: 14, paddingRight: 14, overflow: 'hidden', gap: 12 },
  colorBar: { width: 5, alignSelf: 'stretch' },
  catName: { flex: 1, fontSize: 16, fontWeight: '500' },
  defaultBadge: { fontSize: 11 },
  errBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, marginBottom: 16 },
  errTxt: { color: '#ef4444', fontSize: 13 },
  mField: { marginBottom: 16 },
  mLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  mInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: { width: 40, height: 40, borderRadius: 20 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  mBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  mBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  mBtnTxt: { fontSize: 15, fontWeight: '700' },
});
