import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function InvestmentsScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.center}>
        <Ionicons name="trending-up-outline" size={64} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>Yatırımlar</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Yakında geliyor...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 16 },
});
