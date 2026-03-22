import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TabsLayout() {
  const { isDark, colors } = useTheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          borderTopColor: isDark ? 'rgba(63,63,70,0.5)' : 'rgba(229,231,235,0.8)',
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: isDark ? '#52525b' : '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerShown: true,
          headerTitle: 'Bindex',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.headerBtn}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={isDark ? '#22d3ee' : '#2563eb'}
              />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: isDark ? '#09090b' : '#fafaf9',
          },
          headerTitleStyle: {
            color: isDark ? '#22d3ee' : '#2563eb',
            fontWeight: '700',
            fontSize: 18,
          },
          headerShadowVisible: false,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Bütçe',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: 'Yatırım',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payment-methods"
        options={{
          title: 'Ödeme',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ibans"
        options={{
          title: 'IBAN',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="documents-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    marginRight: 16,
    padding: 4,
  },
});
