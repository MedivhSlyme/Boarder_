import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { THEMES, ThemeName, ColorPalette } from '../constants/colors';

interface ThemeContextType {
  themeName: ThemeName;
  palette: ColorPalette;
  setTheme: (name: ThemeName, uid?: string) => void;
}

const STORAGE_KEY = 'boarder_theme';

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('base');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in THEMES) {
        setThemeName(saved as ThemeName);
      }
    }).catch(() => {});
  }, []);

  const setTheme = (name: ThemeName, uid?: string) => {
    setThemeName(name);
    AsyncStorage.setItem(STORAGE_KEY, name).catch(() => {});
    if (uid) {
      updateDoc(doc(db, 'users', uid), { theme: name }).catch(() => {});
    }
  };

  return (
    <ThemeContext.Provider value={{ themeName, palette: THEMES[themeName], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
