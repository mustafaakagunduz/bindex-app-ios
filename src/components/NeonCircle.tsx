import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface NeonCircleProps {
  amount: number;
  currencySymbol: string;
  isHidden: boolean;
  onToggleHidden: () => void;
  monthLabel: string;
}

const NeonCircle: React.FC<NeonCircleProps> = ({
  amount,
  currencySymbol,
  isHidden,
  onToggleHidden,
  monthLabel,
}) => {
  const { isDark } = useTheme();
  const isPositive = amount >= 0;

  const formattedAmount = Math.abs(amount).toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const displayAmount = isHidden
    ? '••••••'
    : `${isPositive ? '' : '-'}${currencySymbol}${formattedAmount}`;

  const circleColor = isPositive
    ? isDark
      ? 'rgba(34,211,238,0.15)'
      : 'rgba(37,99,235,0.12)'
    : isDark
    ? 'rgba(239,68,68,0.15)'
    : 'rgba(239,68,68,0.12)';

  const borderColor = isPositive
    ? isDark
      ? 'rgba(34,211,238,0.5)'
      : 'rgba(37,99,235,0.4)'
    : isDark
    ? 'rgba(239,68,68,0.5)'
    : 'rgba(239,68,68,0.4)';

  const glowColor = isPositive
    ? isDark
      ? ['rgba(34,211,238,0.2)', 'transparent']
      : ['rgba(37,99,235,0.15)', 'transparent']
    : ['rgba(239,68,68,0.2)', 'transparent'];

  const amountColor = isPositive
    ? isDark
      ? '#22d3ee'
      : '#2563eb'
    : '#ef4444';

  return (
    <View style={styles.container}>
      {/* Outer glow */}
      <LinearGradient
        colors={glowColor as any}
        style={styles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Circle */}
      <TouchableOpacity
        onPress={onToggleHidden}
        activeOpacity={0.8}
        style={[styles.circle, { backgroundColor: circleColor, borderColor }]}
      >
        <Text style={[styles.label, { color: isDark ? '#a1a1aa' : '#6b7280' }]}>
          {monthLabel}
        </Text>
        <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1} adjustsFontSizeToFit>
          {displayAmount}
        </Text>
        <Text style={[styles.hint, { color: isDark ? 'rgba(161,161,170,0.5)' : 'rgba(107,114,128,0.5)' }]}>
          {isHidden ? 'göster' : 'gizle'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 40,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -20,
  },
  circle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    marginTop: 8,
    letterSpacing: 0.5,
  },
});

export default NeonCircle;
