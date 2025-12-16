import React, { createContext, useContext, useState, useEffect } from 'react';
import { QuestionType } from '../types/types';

type GameMode = 'all' | QuestionType;
export type Theme = 'system' | 'light' | 'dark';

interface SettingsContextType {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  mode: 'all',
  setMode: () => {},
  theme: 'system',
  setTheme: () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<GameMode>('all');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      updateThemeColor(systemTheme, metaThemeColor);
      return;
    }

    root.classList.add(theme);
    updateThemeColor(theme, metaThemeColor);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Update meta theme-color for mobile browsers/mini-programs
  const updateThemeColor = (activeTheme: 'light' | 'dark', metaTag: Element | null) => {
    // Light mode: brand-primary (#2DD4BF), Dark mode: slate-900 (#0f172a)
    const color = activeTheme === 'dark' ? '#0f172a' : '#2DD4BF';
    if (metaTag) {
      metaTag.setAttribute('content', color);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      document.head.appendChild(meta);
    }
  };

  return (
    <SettingsContext.Provider value={{ mode, setMode, theme, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
