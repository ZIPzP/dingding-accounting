/**
 * 主题上下文
 * 提供全局主题切换能力（含用户自定义主题）
 */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ThemeConfig,
  allThemes,
  defaultAnimeTheme,
  applyTheme,
  loadSavedTheme,
  loadCustomTheme,
} from '../themes';

interface ThemeContextValue {
  currentTheme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  allThemes: ThemeConfig[];
  refreshThemes: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: defaultAnimeTheme,
  setTheme: () => {},
  allThemes,
  refreshThemes: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(() =>
    loadSavedTheme()
  );
  const [customTheme, setCustomTheme] = useState<ThemeConfig | null>(() =>
    loadCustomTheme()
  );

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const themes = useMemo<ThemeConfig[]>(() => {
    const base = allThemes.filter((t) => t.id !== 'custom');
    return customTheme ? [...base, customTheme] : base;
  }, [customTheme]);

  const handleSetTheme = (theme: ThemeConfig) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const refreshThemes = () => {
    setCustomTheme(loadCustomTheme());
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme: handleSetTheme,
        allThemes: themes,
        refreshThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
