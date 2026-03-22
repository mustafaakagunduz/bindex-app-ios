import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { calculateMonthlyTotals, subscribeToTransactions, unsubscribe } from '../../src/lib/database';
import NeonCircle from '../../src/components/NeonCircle';

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const API_KEY = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY;

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark, colors, currency } = useTheme();

  const [rates, setRates] = useState({ USD: 34.5 });
  const [isHidden, setIsHidden] = useState(false);
  const [monthlyTotals, setMonthlyTotals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TRY&apikey=${API_KEY}`
        );
        const data = await res.json();
        const rate = parseFloat(data['Realtime Currency Exchange Rate']?.['5. Exchange Rate']);
        if (rate && !isNaN(rate)) setRates({ USD: rate });
      } catch (e) {
        console.error('Exchange rate error:', e);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    if (user?.id) loadMonthlyTotals();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const sub = subscribeToTransactions(user.id, () => loadMonthlyTotals());
    return () => unsubscribe(sub);
  }, [user?.id]);

  const loadMonthlyTotals = async () => {
    setLoading(true);
    const { data, error } = await calculateMonthlyTotals(user!.id);
    if (!error && data) setMonthlyTotals(data);
    setLoading(false);
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthData = monthlyTotals.find((m) => m.key === currentMonthKey);
  const currentMonthNet = currentMonthData?.net ?? 0;
  const pastMonths = monthlyTotals.filter((m) => m.key < currentMonthKey);

  const getConvertedNet = (net: number) => {
    if (currency === 'TRY') return net;
    if (currency === 'USD' && rates.USD) return net / rates.USD;
    return net;
  };

  const currencySymbol = currency === 'USD' ? '$' : '₺';

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <NeonCircle
          amount={getConvertedNet(currentMonthNet)}
          currencySymbol={currencySymbol}
          isHidden={isHidden}
          onToggleHidden={() => setIsHidden(!isHidden)}
          monthLabel={`${MONTH_NAMES_TR[currentMonth]} ${currentYear}`}
        />

        {pastMonths.length > 0 && (
          <View style={styles.pastMonths}>
            {pastMonths.map((m) => {
              const converted = getConvertedNet(m.net);
              const isPositive = converted >= 0;
              const formatted = Math.abs(converted).toLocaleString('tr-TR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              });

              return (
                <View
                  key={m.key}
                  style={[
                    styles.monthRow,
                    {
                      backgroundColor: isDark ? 'rgba(24,24,27,0.4)' : 'rgba(255,255,255,0.7)',
                      borderColor: isDark ? 'rgba(63,63,70,0.4)' : 'rgba(229,231,235,0.5)',
                    },
                  ]}
                >
                  <Text style={[styles.monthLabel, { color: isDark ? '#a1a1aa' : '#6b7280' }]}>
                    {MONTH_NAMES_TR[m.month]} {m.year}
                  </Text>
                  <Text style={[styles.monthAmount, { color: isPositive ? '#22c55e' : '#ef4444' }]}>
                    {isPositive ? '' : '-'}{currencySymbol}{formatted}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 32 },
  pastMonths: { marginTop: 32, paddingHorizontal: 20, gap: 8 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  monthLabel: { fontSize: 14, fontWeight: '500' },
  monthAmount: { fontSize: 14, fontWeight: '700' },
});
