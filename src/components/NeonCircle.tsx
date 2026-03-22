import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const BAR_COUNT = 40;
const RADIUS = 130;
const CIRCLE_SIZE = 220;

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

  // Pulse animations for bars
  const pulseAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.4))
  ).current;

  useEffect(() => {
    if (isDark) {
      const animations = pulseAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(Math.random() * 2000),
            Animated.timing(anim, {
              toValue: 1,
              duration: 800 + Math.random() * 600,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 800 + Math.random() * 600,
              useNativeDriver: true,
            }),
          ])
        )
      );
      animations.forEach(a => a.start());
      return () => animations.forEach(a => a.stop());
    } else {
      pulseAnims.forEach(a => a.setValue(0.7));
    }
  }, [isDark]);

  const barColor = isPositive
    ? isDark ? '#22d3ee' : '#3b82f6'
    : '#ef4444';

  const amountColor = isPositive
    ? isDark ? '#22d3ee' : '#2563eb'
    : '#ef4444';

  const formattedAmount = Math.abs(amount).toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const displayAmount = isHidden
    ? '*****'
    : `${isPositive ? '' : '-'}${currencySymbol}${formattedAmount}`;

  const charCount = displayAmount.length;
  const fontSize =
    charCount <= 8 ? 30 :
    charCount <= 12 ? 25 :
    charCount <= 15 ? 20 :
    charCount <= 18 ? 17 : 14;

  const containerSize = CIRCLE_SIZE + RADIUS * 2 + 30;
  const center = containerSize / 2;

  return (
    <View style={[styles.wrapper, { width: containerSize, height: containerSize }]}>
      {/* Rotating bars */}
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const angle = (i * 360) / BAR_COUNT;
        const rad = (angle * Math.PI) / 180;
        const x = center + RADIUS * Math.sin(rad) - 2;
        const y = center - RADIUS * Math.cos(rad) - 12.5;

        return (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              {
                left: x,
                top: y,
                backgroundColor: barColor,
                transform: [{ rotate: `${angle}deg` }],
                opacity: pulseAnims[i],
              },
            ]}
          />
        );
      })}

      {/* Circle */}
      <TouchableOpacity
        onPress={onToggleHidden}
        activeOpacity={0.85}
        style={[
          styles.circle,
          {
            left: center - CIRCLE_SIZE / 2,
            top: center - CIRCLE_SIZE / 2,
            backgroundColor: isPositive
              ? isDark ? 'rgba(34,211,238,0.08)' : 'rgba(37,99,235,0.07)'
              : isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.07)',
            borderColor: isPositive
              ? isDark ? 'rgba(34,211,238,0.45)' : 'rgba(37,99,235,0.35)'
              : isDark ? 'rgba(239,68,68,0.45)' : 'rgba(239,68,68,0.35)',
          },
        ]}
      >
        <Text style={[styles.monthLabel, { color: isDark ? '#a1a1aa' : '#6b7280' }]}>
          {monthLabel}
        </Text>
        <Text
          style={[styles.amount, { color: amountColor, fontSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
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
  wrapper: {
    alignSelf: 'center',
  },
  bar: {
    position: 'absolute',
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  amount: {
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
