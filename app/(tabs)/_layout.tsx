import { useState } from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import Sidebar from '../../src/components/Sidebar';

export default function TabsLayout() {
  const { isDark, colors } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
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
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => setSidebarOpen(true)}
                style={styles.headerBtn}
              >
                <Ionicons
                  name="menu"
                  size={26}
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
              <Ionicons name="swap-vertical-outline" size={size} color={color} />
            ),
            headerShown: true,
            headerTitle: 'Gelir / Gider',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => setSidebarOpen(true)}
                style={styles.headerBtn}
              >
                <Ionicons
                  name="menu"
                  size={26}
                  color={isDark ? '#22d3ee' : '#2563eb'}
                />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: isDark ? '#09090b' : '#fafaf9',
            },
            headerTitleStyle: {
              color: colors.text,
              fontWeight: '700',
              fontSize: 18,
            },
            headerShadowVisible: false,
          }}
        />
      </Tabs>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    marginLeft: 16,
    padding: 4,
  },
});
