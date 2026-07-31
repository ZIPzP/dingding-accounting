/**
 * 主题上下文
 * 提供全局主题切换能力
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ThemeConfig,
  allThemes,
  defaultAnimeTheme,
  applyTheme,
  loadSavedTheme,
} from '../themes';

interface ThemeContextValue {
  currentTheme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  allThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: defaultAnimeTheme,
  setTheme: () => {},
  allThemes,
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

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleSetTheme = (theme: ThemeConfig) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme: handleSetTheme,
        allThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
