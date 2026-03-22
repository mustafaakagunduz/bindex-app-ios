import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'dark' | 'light';
type Currency = 'TRY' | 'USD';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  isDark: boolean;
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    accentText: string;
  };
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [currency, setCurrencyState] = useState<Currency>('TRY');

  useEffect(() => {
    const load = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedCurrency = await AsyncStorage.getItem('currency');
      if (savedTheme === 'dark' || savedTheme === 'light') setThemeState(savedTheme);
      if (savedCurrency === 'TRY' || savedCurrency === 'USD') setCurrencyState(savedCurrency);
    };
    load();
  }, []);

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    await AsyncStorage.setItem('theme', t);
  };

  const setCurrency = async (c: Currency) => {
    setCurrencyState(c);
    await AsyncStorage.setItem('currency', c);
  };

  const isDark = theme === 'dark';

  const colors = isDark
    ? {
        bg: '#09090b',
        surface: 'rgba(24,24,27,0.95)',
        surfaceAlt: 'rgba(39,39,42,0.6)',
        border: 'rgba(63,63,70,0.5)',
        text: '#ffffff',
        textMuted: '#a1a1aa',
        accent: '#22d3ee',
        accentText: '#09090b',
      }
    : {
        bg: '#fafaf9',
        surface: 'rgba(255,255,255,0.95)',
        surfaceAlt: 'rgba(255,255,255,0.7)',
        border: 'rgba(209,213,219,0.5)',
        text: '#111827',
        textMuted: '#6b7280',
        accent: '#2563eb',
        accentText: '#ffffff',
      };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currency, setCurrency, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
