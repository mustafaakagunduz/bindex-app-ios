import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, TouchableWithoutFeedback, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SIDEBAR_WIDTH = 270;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  isDark: boolean;
  colors: any;
}

const NavItem = ({ icon, label, onPress, isDark, colors }: NavItemProps) => (
  <TouchableOpacity onPress={onPress} style={styles.navItem} activeOpacity={0.7}>
    <Ionicons name={icon as any} size={20} color={colors.textMuted} />
    <Text style={[styles.navLabel, { color: colors.text }]}>{label}</Text>
  </TouchableOpacity>
);

interface CollapsibleProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  colors: any;
  children: React.ReactNode;
}

const Collapsible = ({ title, isOpen, onToggle, isDark, colors, children }: CollapsibleProps) => (
  <View style={styles.collapsible}>
    <TouchableOpacity onPress={onToggle} style={styles.collapsibleHeader} activeOpacity={0.7}>
      <Text style={[styles.collapsibleTitle, { color: colors.textMuted }]}>{title}</Text>
      <Ionicons
        name={isOpen ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={colors.textMuted}
      />
    </TouchableOpacity>
    {isOpen && <View style={styles.collapsibleContent}>{children}</View>}
  </View>
);

interface OptionItemProps {
  label: string;
  active: boolean;
  onPress: () => void;
  isDark: boolean;
  colors: any;
  icon?: string;
}

const OptionItem = ({ label, active, onPress, isDark, colors, icon }: OptionItemProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      styles.optionItem,
      active && { backgroundColor: colors.accent, borderRadius: 8 },
    ]}
  >
    {icon && (
      <Ionicons
        name={icon as any}
        size={16}
        color={active ? (isDark ? '#09090b' : '#fff') : colors.textMuted}
      />
    )}
    <Text style={[
      styles.optionLabel,
      { color: active ? (isDark ? '#09090b' : '#fff') : colors.text },
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark, setTheme, currency, setCurrency, colors } = useTheme();

  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0.5, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -SIDEBAR_WIDTH, duration: 240, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }
  }, [isOpen]);

  const navigate = (path: string) => {
    onClose();
    setTimeout(() => router.push(path as any), 50);
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
          onClose();
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!visible) return null;

  const bgColors = isDark
    ? ['rgba(6,182,212,0.07)', 'rgba(59,130,246,0.05)']
    : ['rgba(59,130,246,0.05)', 'rgba(99,102,241,0.04)'];

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
            backgroundColor: isDark ? '#09090b' : '#fafaf9',
            borderRightColor: isDark ? 'rgba(63,63,70,0.5)' : 'rgba(229,231,235,0.8)',
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.drawerHeader, { borderBottomColor: isDark ? '#3f3f46' : '#e5e7eb' }]}>
          <Text style={[styles.drawerTitle, { color: colors.text }]}>Menü</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
          {/* User */}
          {user && (
            <View style={[styles.userRow, { borderBottomColor: isDark ? '#27272a' : '#f3f4f6' }]}>
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={[styles.avatarTxt, { color: colors.accentText }]}>
                  {user.email?.[0]?.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          )}

          {/* Navigation */}
          <View style={styles.navSection}>
            <NavItem icon="home-outline" label="Ana Sayfa" onPress={() => navigate('/(tabs)')} isDark={isDark} colors={colors} />
            <NavItem icon="swap-vertical-outline" label="Gelir / Gider" onPress={() => navigate('/(tabs)/budget')} isDark={isDark} colors={colors} />
            <NavItem icon="trending-up-outline" label="Yatırımlar" onPress={() => navigate('/investments')} isDark={isDark} colors={colors} />
            <NavItem icon="card-outline" label="Ödeme Yöntemleri" onPress={() => navigate('/payment-methods')} isDark={isDark} colors={colors} />
            <NavItem icon="documents-outline" label="IBAN Bilgileri" onPress={() => navigate('/ibans')} isDark={isDark} colors={colors} />
            <NavItem icon="settings-outline" label="Ayarlar" onPress={() => navigate('/settings')} isDark={isDark} colors={colors} />
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]} />

          {/* Language */}
          <Collapsible title="Dil" isOpen={langOpen} onToggle={() => setLangOpen(!langOpen)} isDark={isDark} colors={colors}>
            <OptionItem label="Türkçe" active={true} onPress={() => {}} isDark={isDark} colors={colors} />
            <OptionItem label="English" active={false} onPress={() => {}} isDark={isDark} colors={colors} />
          </Collapsible>

          {/* Currency */}
          <Collapsible title="Para Birimi" isOpen={currOpen} onToggle={() => setCurrOpen(!currOpen)} isDark={isDark} colors={colors}>
            <OptionItem label="Türk Lirası (₺)" active={currency === 'TRY'} onPress={() => setCurrency('TRY')} isDark={isDark} colors={colors} />
            <OptionItem label="Amerikan Doları ($)" active={currency === 'USD'} onPress={() => setCurrency('USD')} isDark={isDark} colors={colors} />
          </Collapsible>

          {/* Theme */}
          <Collapsible title="Tema" isOpen={themeOpen} onToggle={() => setThemeOpen(!themeOpen)} isDark={isDark} colors={colors}>
            <OptionItem label="Karanlık Mod" active={isDark} onPress={() => setTheme('dark')} isDark={isDark} colors={colors} icon="moon-outline" />
            <OptionItem label="Aydınlık Mod" active={!isDark} onPress={() => setTheme('light')} isDark={isDark} colors={colors} icon="sunny-outline" />
          </Collapsible>
        </ScrollView>

        {/* Logout */}
        <View style={[styles.logoutArea, { borderTopColor: isDark ? '#3f3f46' : '#e5e7eb' }]}>
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.25)' }]} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    zIndex: 100,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  drawerTitle: { fontSize: 20, fontWeight: '700' },
  drawerBody: { flex: 1 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontSize: 15, fontWeight: '700' },
  userEmail: { fontSize: 13, flex: 1 },
  navSection: { paddingVertical: 8, paddingHorizontal: 8 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 10,
  },
  navLabel: { fontSize: 15, fontWeight: '500' },
  divider: { height: 1, marginVertical: 8 },
  collapsible: { paddingHorizontal: 8 },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  collapsibleTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  collapsibleContent: { paddingBottom: 4 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  optionLabel: { fontSize: 14 },
  logoutArea: { padding: 16, borderTopWidth: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
