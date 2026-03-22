import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, SafeAreaView, ActionSheetIOS, Alert, Platform,
  TextInput, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import {
  getUserTransactions, getUserCategories, addTransaction,
  updateTransaction, deleteTransaction,
  subscribeToTransactions, unsubscribe,
} from '../../src/lib/database';
import GenericModal from '../../src/components/GenericModal';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

// ─── Native-style dropdown (uses Modal) ──────────────────────────────────────
function Picker({ value, onChange, options, placeholder }: any) {
  const { isDark, colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o: any) => o.value === value);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.pickerBtn, { backgroundColor: isDark ? '#27272a' : '#f3f4f6', borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickerTxt, { color: selected ? colors.text : colors.textMuted }]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[styles.pickerSheet, { backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#3f3f46' : '#e5e7eb' }]}>
            {options.map((opt: any) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { onChange(opt.value); setOpen(false); }}
                style={[styles.pickerOption, opt.value === value && { backgroundColor: isDark ? 'rgba(34,211,238,0.1)' : 'rgba(37,99,235,0.08)' }]}
              >
                {opt.color && <View style={[styles.dot, { backgroundColor: opt.color }]} />}
                <Text style={[styles.pickerOptionTxt, { color: opt.value === value ? colors.accent : colors.text }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Main Budget Screen ───────────────────────────────────────────────────────
export default function BudgetScreen() {
  const { user } = useAuth();
  const { isDark, colors } = useTheme();

  const [tab, setTab] = useState<'income' | 'all' | 'expense'>('all');
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Month nav
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formExpenseType, setFormExpenseType] = useState('necessary');
  const [formDate, setFormDate] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Grouping
  const [groupBy, setGroupBy] = useState<'default' | 'paymentMethod' | 'expenseType'>('default');

  // ─── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.id) { loadAll(); }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const sub = subscribeToTransactions(user.id, loadAll);
    return () => unsubscribe(sub);
  }, [user?.id]);

  const loadAll = async () => {
    setLoading(true);
    const [txRes, catRes] = await Promise.all([
      getUserTransactions(user!.id),
      getUserCategories(user!.id),
    ]);
    if (!txRes.error && txRes.data) {
      setIncomes(txRes.data.filter((t: any) => t.type === 'income'));
      setExpenses(txRes.data.filter((t: any) => t.type === 'expense'));
    }
    if (!catRes.error && catRes.data) setCategories(catRes.data);
    setLoading(false);
  };

  // ─── Filtered data ─────────────────────────────────────────────────────────
  const toLocal = (ts: string) => new Date(new Date(ts).getTime() + 3 * 60 * 60000);

  const filteredIncomes = useMemo(() =>
    incomes.filter(t => { const d = toLocal(t.timestamp); return d.getUTCFullYear() === selYear && d.getUTCMonth() === selMonth; }),
    [incomes, selMonth, selYear]);

  const filteredExpenses = useMemo(() =>
    expenses.filter(t => { const d = toLocal(t.timestamp); return d.getUTCFullYear() === selYear && d.getUTCMonth() === selMonth; }),
    [expenses, selMonth, selYear]);

  const allEntries = useMemo(() =>
    [...filteredIncomes, ...filteredExpenses].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [filteredIncomes, filteredExpenses]);

  const displayEntries = tab === 'income' ? filteredIncomes : tab === 'expense' ? filteredExpenses : allEntries;

  const netAmount = useMemo(() => {
    const inc = filteredIncomes.reduce((s, t) => s + parseFloat(t.amount), 0);
    const exp = filteredExpenses.reduce((s, t) => s + parseFloat(t.amount), 0);
    if (tab === 'income') return inc;
    if (tab === 'expense') return exp;
    return inc - exp;
  }, [filteredIncomes, filteredExpenses, tab]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const todayStr = () => {
    const d = new Date(new Date().getTime() + 3 * 60 * 60000);
    return d.toISOString().slice(0, 10);
  };

  const tsFromDate = (dateStr: string) =>
    new Date(new Date(dateStr + 'T09:00:00.000Z').getTime() + 3 * 60 * 60 * 1000).toISOString();

  const dateFromTs = (ts: string) => {
    const d = toLocal(ts);
    return d.toISOString().slice(0, 10);
  };

  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getCatColor = (name: string) => categories.find((c: any) => c.name === name)?.color || '#6b7280';

  // ─── Month navigation ──────────────────────────────────────────────────────
  const prevMonth = () => { if (selMonth === 0) { setSelMonth(11); setSelYear(y => y - 1); } else setSelMonth(m => m - 1); };
  const nextMonth = () => { if (selMonth === 11) { setSelMonth(0); setSelYear(y => y + 1); } else setSelMonth(m => m + 1); };

  // ─── Modal open/close ──────────────────────────────────────────────────────
  const openModal = (type: 'income' | 'expense', entry?: any) => {
    setModalType(type);
    setEditingEntry(entry || null);
    if (entry) {
      setFormTitle(entry.title);
      setFormAmount(entry.amount.toString());
      setFormCategory(entry.category || '');
      setFormExpenseType(entry.expense_type || 'necessary');
      setFormDate(dateFromTs(entry.timestamp));
    } else {
      setFormTitle('');
      setFormAmount('');
      setFormCategory(type === 'expense' && categories.length > 0 ? categories[0].name : '');
      setFormExpenseType('necessary');
      setFormDate(todayStr());
    }
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
    setFormError('');
  };

  // ─── Save transaction ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError('');
    if (!formTitle.trim() || !formAmount.trim()) { setFormError('Tüm alanları doldurun'); return; }
    if (modalType === 'expense' && !formCategory) { setFormError('Ödeme yöntemi seçin'); return; }
    const amount = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) { setFormError('Geçerli bir miktar girin'); return; }

    setSaving(true);
    if (editingEntry) {
      await updateTransaction(editingEntry.id, {
        title: formTitle.trim(), amount,
        category: modalType === 'expense' ? formCategory : null,
        expense_type: modalType === 'expense' ? formExpenseType : null,
        timestamp: tsFromDate(formDate),
      });
    } else {
      await addTransaction(user!.id, modalType, formTitle.trim(), amount,
        modalType === 'expense' ? formCategory : null,
        modalType === 'expense' ? formExpenseType : null,
        tsFromDate(formDate));
    }
    setSaving(false);
    closeModal();
    loadAll();
  };

  // ─── Long press action ─────────────────────────────────────────────────────
  const handleLongPress = (entry: any) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['İptal', 'Düzenle', 'Sil'], cancelButtonIndex: 0, destructiveButtonIndex: 2, title: entry.title },
        (idx) => {
          if (idx === 1) openModal(entry.type, entry);
          if (idx === 2) confirmDelete(entry);
        }
      );
    } else {
      Alert.alert(entry.title, '', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Düzenle', onPress: () => openModal(entry.type, entry) },
        { text: 'Sil', style: 'destructive', onPress: () => confirmDelete(entry) },
      ]);
    }
  };

  const confirmDelete = (entry: any) => {
    Alert.alert('Emin misiniz?', `"${entry.title}" silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteTransaction(entry.id); loadAll(); } },
    ]);
  };

  // ─── Group by date ─────────────────────────────────────────────────────────
  const groupByDate = (entries: any[]) => {
    const map: Record<string, any[]> = {};
    entries.forEach(e => {
      const key = toLocal(e.timestamp).toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return Object.keys(map).sort((a, b) => b.localeCompare(a)).map(key => ({
      key,
      label: key.split('-').reverse().join('.'),
      entries: map[key],
      isFuture: key > todayStr(),
    }));
  };

  // ─── Group by payment method (expense only) ────────────────────────────────
  const groupByPayMethod = (entries: any[]) => {
    const map: Record<string, any[]> = {};
    entries.forEach(e => {
      const cat = e.category || 'Diğer';
      if (!map[cat]) map[cat] = [];
      map[cat].push(e);
    });
    return Object.keys(map).map(cat => ({
      cat,
      total: map[cat].reduce((s, e) => s + parseFloat(e.amount), 0),
      color: getCatColor(cat),
      entries: map[cat],
    }));
  };

  // ─── Group by expense type ────────────────────────────────────────────────
  const groupByExpType = (entries: any[]) => {
    const map: Record<string, any[]> = { necessary: [], optional: [] };
    entries.forEach(e => { (map[e.expense_type || 'necessary']).push(e); });
    return [
      { type: 'necessary', label: 'Zorunlu', color: '#3b82f6', entries: map.necessary },
      { type: 'optional', label: 'Keyfi', color: '#ec4899', entries: map.optional },
    ].filter(g => g.entries.length > 0);
  };

  // ─── Entry Row ─────────────────────────────────────────────────────────────
  const EntryRow = ({ entry }: { entry: any }) => {
    const isIncome = entry.type === 'income';
    const barColor = isIncome ? '#22c55e' : (entry.expense_type === 'optional' ? '#ec4899' : '#3b82f6');

    return (
      <TouchableOpacity
        onLongPress={() => handleLongPress(entry)}
        activeOpacity={0.7}
        style={[styles.entryRow, { backgroundColor: isDark ? 'rgba(24,24,27,0.5)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(63,63,70,0.3)' : 'rgba(229,231,235,0.5)' }]}
      >
        <View style={[styles.entryBar, { backgroundColor: barColor }]} />
        <View style={styles.entryContent}>
          <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={1}>{entry.title}</Text>
          {entry.category && <Text style={[styles.entryCat, { color: colors.textMuted }]}>{entry.category}</Text>}
        </View>
        <Text style={[styles.entryAmount, { color: isIncome ? '#22c55e' : '#ef4444' }]}>
          {isIncome ? '+' : '-'}{fmt(parseFloat(entry.amount))} ₺
        </Text>
      </TouchableOpacity>
    );
  };

  // ─── Render entries (default = by date) ───────────────────────────────────
  const renderDefault = (entries: any[]) => {
    const groups = groupByDate(entries);
    if (groups.length === 0) return null;
    return groups.map(g => (
      <View key={g.key} style={styles.dateGroup}>
        <Text style={[styles.dateLabel, { color: colors.textMuted }]}>
          {g.label}{g.isFuture ? '  ·  Gelecek Tarihli' : ''}
        </Text>
        {g.entries.map(e => <EntryRow key={e.id} entry={e} />)}
      </View>
    ));
  };

  // ─── Render grouped by payment method ────────────────────────────────────
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const toggleCat = (cat: string) => setExpandedCats(prev => {
    const s = new Set(prev);
    s.has(cat) ? s.delete(cat) : s.add(cat);
    return s;
  });

  const renderByPayMethod = (entries: any[]) =>
    groupByPayMethod(entries).map(g => (
      <View key={g.cat} style={[styles.groupCard, { backgroundColor: isDark ? 'rgba(24,24,27,0.4)' : 'rgba(255,255,255,0.6)', borderColor: isDark ? 'rgba(63,63,70,0.3)' : 'rgba(229,231,235,0.5)' }]}>
        <TouchableOpacity onPress={() => toggleCat(g.cat)} style={styles.groupHeader} activeOpacity={0.7}>
          <View style={[styles.dot, { backgroundColor: g.color }]} />
          <Text style={[styles.groupTitle, { color: colors.text }]}>{g.cat}</Text>
          <Text style={[styles.groupTotal, { color: '#ef4444' }]}>{fmt(g.total)} ₺</Text>
          <Ionicons name={expandedCats.has(g.cat) ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </TouchableOpacity>
        {expandedCats.has(g.cat) && g.entries.map((e: any) => <EntryRow key={e.id} entry={e} />)}
      </View>
    ));

  const renderByExpType = (entries: any[]) =>
    groupByExpType(entries).map(g => (
      <View key={g.type} style={[styles.groupCard, { backgroundColor: isDark ? 'rgba(24,24,27,0.4)' : 'rgba(255,255,255,0.6)', borderColor: isDark ? 'rgba(63,63,70,0.3)' : 'rgba(229,231,235,0.5)' }]}>
        <TouchableOpacity onPress={() => toggleCat(g.type)} style={styles.groupHeader} activeOpacity={0.7}>
          <View style={[styles.dot, { backgroundColor: g.color }]} />
          <Text style={[styles.groupTitle, { color: colors.text }]}>{g.label}</Text>
          <Text style={[styles.groupTotal, { color: '#ef4444' }]}>{fmt(g.entries.reduce((s, e) => s + parseFloat(e.amount), 0))} ₺</Text>
          <Ionicons name={expandedCats.has(g.type) ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </TouchableOpacity>
        {expandedCats.has(g.type) && g.entries.map((e: any) => <EntryRow key={e.id} entry={e} />)}
      </View>
    ));

  const isExpenseTab = tab === 'expense';
  const isPositive = netAmount >= 0;

  const catOptions = categories.map((c: any) => ({ value: c.name, label: c.name, color: c.color }));

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>

      {/* Month Nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.text }]}>{MONTHS[selMonth]} {selYear}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-forward" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]}>
        {(['income', 'all', 'expense'] as const).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && { backgroundColor: isDark ? '#09090b' : '#fff', borderRadius: 8 }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabTxt, { color: tab === t ? colors.accent : colors.textMuted, fontWeight: tab === t ? '700' : '500' }]}>
              {t === 'income' ? 'Gelir' : t === 'all' ? 'Tümü' : 'Gider'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Add buttons */}
          <View style={styles.addRow}>
            {(tab === 'income' || tab === 'all') && (
              <TouchableOpacity onPress={() => openModal('income')} style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)', borderColor: isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.25)' }]} activeOpacity={0.7}>
                <Ionicons name="add" size={18} color="#22c55e" />
                <Text style={[styles.addBtnTxt, { color: '#22c55e' }]}>Gelir Ekle</Text>
              </TouchableOpacity>
            )}
            {(tab === 'expense' || tab === 'all') && (
              <TouchableOpacity onPress={() => openModal('expense')} style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)', borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.25)' }]} activeOpacity={0.7}>
                <Ionicons name="remove" size={18} color="#ef4444" />
                <Text style={[styles.addBtnTxt, { color: '#ef4444' }]}>Gider Ekle</Text>
              </TouchableOpacity>
            )}
            {isExpenseTab && (
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    ActionSheetIOS.showActionSheetWithOptions(
                      { options: ['İptal', 'Varsayılan', 'Ödeme Yöntemine Göre', 'Zorunluluğa Göre'], cancelButtonIndex: 0 },
                      (idx) => { if (idx === 1) setGroupBy('default'); if (idx === 2) setGroupBy('paymentMethod'); if (idx === 3) setGroupBy('expenseType'); }
                    );
                  }
                }}
                style={[styles.groupBtn, { backgroundColor: isDark ? 'rgba(63,63,70,0.4)' : 'rgba(229,231,235,0.6)', borderColor: isDark ? 'rgba(63,63,70,0.4)' : 'rgba(209,213,219,0.5)' }]}
                activeOpacity={0.7}
              >
                <Ionicons name="layers-outline" size={18} color={groupBy !== 'default' ? colors.accent : colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Net total */}
          {displayEntries.length > 0 && (
            <View style={[styles.totalCard, { backgroundColor: isDark ? 'rgba(24,24,27,0.4)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(63,63,70,0.3)' : 'rgba(229,231,235,0.5)' }]}>
              <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Toplam</Text>
              <Text style={[styles.totalAmount, { color: tab === 'income' ? '#22c55e' : tab === 'expense' ? '#ef4444' : (isPositive ? '#22c55e' : '#ef4444') }]}>
                {fmt(Math.abs(netAmount))} ₺
              </Text>
            </View>
          )}

          {/* Empty state */}
          {displayEntries.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name={tab === 'income' ? 'arrow-up-circle-outline' : tab === 'expense' ? 'arrow-down-circle-outline' : 'wallet-outline'} size={52} color={colors.textMuted} />
              <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>Kayıt yok</Text>
            </View>
          )}

          {/* Entry list */}
          {isExpenseTab && groupBy === 'paymentMethod' ? renderByPayMethod(filteredExpenses)
            : isExpenseTab && groupBy === 'expenseType' ? renderByExpType(filteredExpenses)
            : renderDefault(displayEntries)}

        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <GenericModal isOpen={modalOpen} onClose={closeModal} title={editingEntry ? 'Düzenle' : modalType === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}>
        {formError ? <View style={styles.errBox}><Text style={styles.errTxt}>{formError}</Text></View> : null}

        <View style={styles.mField}>
          <Text style={[styles.mLabel, { color: colors.textMuted }]}>Başlık</Text>
          <TextInput style={[styles.mInput, { backgroundColor: isDark ? '#27272a' : '#f9fafb', borderColor: colors.border, color: colors.text }]} value={formTitle} onChangeText={setFormTitle} placeholder="örn. Market alışverişi" placeholderTextColor={isDark ? '#52525b' : '#9ca3af'} />
        </View>

        <View style={styles.mField}>
          <Text style={[styles.mLabel, { color: colors.textMuted }]}>Miktar (₺)</Text>
          <TextInput style={[styles.mInput, { backgroundColor: isDark ? '#27272a' : '#f9fafb', borderColor: colors.border, color: colors.text }]} value={formAmount} onChangeText={setFormAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={isDark ? '#52525b' : '#9ca3af'} />
        </View>

        <View style={styles.mField}>
          <Text style={[styles.mLabel, { color: colors.textMuted }]}>Tarih (YYYY-AA-GG)</Text>
          <TextInput style={[styles.mInput, { backgroundColor: isDark ? '#27272a' : '#f9fafb', borderColor: colors.border, color: colors.text }]} value={formDate} onChangeText={setFormDate} placeholder="2025-01-15" placeholderTextColor={isDark ? '#52525b' : '#9ca3af'} keyboardType="numbers-and-punctuation" maxLength={10} />
        </View>

        {modalType === 'expense' && (
          <>
            <View style={styles.mField}>
              <Text style={[styles.mLabel, { color: colors.textMuted }]}>Ödeme Yöntemi</Text>
              <Picker value={formCategory} onChange={setFormCategory} options={catOptions} placeholder="Seçin..." />
            </View>
            <View style={styles.mField}>
              <Text style={[styles.mLabel, { color: colors.textMuted }]}>Harcama Türü</Text>
              <Picker
                value={formExpenseType}
                onChange={setFormExpenseType}
                options={[{ value: 'necessary', label: 'Zorunlu' }, { value: 'optional', label: 'Keyfi' }]}
                placeholder=""
              />
            </View>
          </>
        )}

        <View style={styles.mBtns}>
          <TouchableOpacity onPress={closeModal} style={[styles.mBtn, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]} activeOpacity={0.7}>
            <Text style={[styles.mBtnTxt, { color: colors.textMuted }]}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.mBtn, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color={colors.accentText} size="small" /> : <Text style={[styles.mBtnTxt, { color: colors.accentText }]}>{editingEntry ? 'Güncelle' : 'Ekle'}</Text>}
          </TouchableOpacity>
        </View>
      </GenericModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  monthTitle: { fontSize: 16, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 10, padding: 3, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  tabTxt: { fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  addBtnTxt: { fontSize: 13, fontWeight: '600' },
  groupBtn: { paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  totalCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  totalLabel: { fontSize: 13, fontWeight: '500' },
  totalAmount: { fontSize: 22, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 15 },
  dateGroup: { marginBottom: 16 },
  dateLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginLeft: 2 },
  entryRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, marginBottom: 6, overflow: 'hidden', paddingRight: 12 },
  entryBar: { width: 4, alignSelf: 'stretch' },
  entryContent: { flex: 1, paddingVertical: 12, paddingLeft: 12 },
  entryTitle: { fontSize: 14, fontWeight: '500' },
  entryCat: { fontSize: 11, marginTop: 2 },
  entryAmount: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  groupCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  groupTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  groupTotal: { fontSize: 14, fontWeight: '700', marginRight: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  // Picker
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  pickerTxt: { fontSize: 14, flex: 1 },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
  pickerSheet: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  pickerOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, gap: 10 },
  pickerOptionTxt: { fontSize: 15 },
  // Modal form
  errBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, marginBottom: 16 },
  errTxt: { color: '#ef4444', fontSize: 13 },
  mField: { marginBottom: 16 },
  mLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  mInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  mBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  mBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  mBtnTxt: { fontSize: 15, fontWeight: '700' },
});
