/**
 * 主题系统
 * 支持多种主题切换，包括图片背景和纯色主题
 */

export interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  bg: string;
  cardBg: string;
  cardBgTransparent: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  shadow: string;
  shadowHover: string;
  bgImage?: string; // 背景图片路径
  bgOverlay?: string; // 背景图上的遮罩颜色
  gameBg: string;
  gameSurface: string;
  gameBorder: string;
}

// 默认主题（图片背景 - 阿尼亚）
export const defaultAnimeTheme: ThemeConfig = {
  id: 'anime-pink',
  name: '阿尼亚',
  primary: '#ec6b9e',
  primaryLight: '#f08bb5',
  primaryDark: '#d14d82',
  bg: '#fff0f5',
  cardBg: '#ffffff',
  cardBgTransparent: 'rgba(255, 255, 255, 0.88)',
  text: '#3d1a2a',
  textSecondary: '#8b5a6b',
  textTertiary: '#bfa0aa',
  border: '#f5d5e0',
  shadow: '0 2px 12px rgba(236, 107, 158, 0.08)',
  shadowHover: '0 8px 30px rgba(236, 107, 158, 0.15)',
  bgImage: '/themes/default-anime.jpg',
  bgOverlay: 'rgba(255, 240, 245, 0.75)',
  gameBg: '#fff5f8',
  gameSurface: '#ffffff',
  gameBorder: '#f0c8d8',
};

// 经典蓝
export const blueTheme: ThemeConfig = {
  id: 'blue',
  name: '经典蓝',
  primary: '#4f6df5',
  primaryLight: '#6b85f7',
  primaryDark: '#3b56d4',
  bg: '#f0f2f8',
  cardBg: '#ffffff',
  cardBgTransparent: 'rgba(255, 255, 255, 0.88)',
  text: '#1a1d29',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#eef0f5',
  shadow: '0 2px 12px rgba(79, 109, 245, 0.06)',
  shadowHover: '0 8px 30px rgba(79, 109, 245, 0.12)',
  gameBg: '#f8f9fc',
  gameSurface: '#ffffff',
  gameBorder: '#e5e7eb',
};

// 薄荷绿
export const greenTheme: ThemeConfig = {
  id: 'green',
  name: '薄荷绿',
  primary: '#3bb77e',
  primaryLight: '#5cc996',
  primaryDark: '#2d9a66',
  bg: '#f0f8f4',
  cardBg: '#ffffff',
  cardBgTransparent: 'rgba(255, 255, 255, 0.88)',
  text: '#1a2e22',
  textSecondary: '#5a7a6a',
  textTertiary: '#8fa8a0',
  border: '#d8ede2',
  shadow: '0 2px 12px rgba(59, 183, 126, 0.06)',
  shadowHover: '0 8px 30px rgba(59, 183, 126, 0.12)',
  gameBg: '#f5faf8',
  gameSurface: '#ffffff',
  gameBorder: '#d0e8d8',
};

// 日落橙
export const orangeTheme: ThemeConfig = {
  id: 'orange',
  name: '日落橙',
  primary: '#f59e42',
  primaryLight: '#f7b568',
  primaryDark: '#e08830',
  bg: '#fdf6ed',
  cardBg: '#ffffff',
  cardBgTransparent: 'rgba(255, 255, 255, 0.88)',
  text: '#2d1f0f',
  textSecondary: '#8b7150',
  textTertiary: '#bfa380',
  border: '#f5e0c8',
  shadow: '0 2px 12px rgba(245, 158, 66, 0.06)',
  shadowHover: '0 8px 30px rgba(245, 158, 66, 0.12)',
  gameBg: '#fef9f2',
  gameSurface: '#ffffff',
  gameBorder: '#f0dcc8',
};

// 星空紫
export const purpleTheme: ThemeConfig = {
  id: 'purple',
  name: '星空紫',
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#7c3aed',
  bg: '#f5f0ff',
  cardBg: '#ffffff',
  cardBgTransparent: 'rgba(255, 255, 255, 0.88)',
  text: '#2a1d4a',
  textSecondary: '#7a6a9a',
  textTertiary: '#a898c0',
  border: '#e8dff5',
  shadow: '0 2px 12px rgba(139, 92, 246, 0.06)',
  shadowHover: '0 8px 30px rgba(139, 92, 246, 0.12)',
  gameBg: '#faf7ff',
  gameSurface: '#ffffff',
  gameBorder: '#e0d5f0',
};

// 暗夜黑
export const darkTheme: ThemeConfig = {
  id: 'dark',
  name: '暗夜黑',
  primary: '#60a5fa',
  primaryLight: '#93c5fd',
  primaryDark: '#3b82f6',
  bg: '#1a1b26',
  cardBg: '#252636',
  cardBgTransparent: 'rgba(37, 38, 54, 0.92)',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  border: '#3a3b4f',
  shadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
  shadowHover: '0 8px 30px rgba(0, 0, 0, 0.4)',
  gameBg: '#1e2030',
  gameSurface: '#2a2b3d',
  gameBorder: '#3a3b50',
};

// 所有可用主题
export const allThemes: ThemeConfig[] = [
  defaultAnimeTheme,
  blueTheme,
  greenTheme,
  orangeTheme,
  purpleTheme,
  darkTheme,
];

// 按 ID 查找主题
export function getThemeById(id: string): ThemeConfig {
  return allThemes.find((t) => t.id === id) || defaultAnimeTheme;
}

// 应用主题到 CSS 变量
export function applyTheme(theme: ThemeConfig): void {
  const root = document.documentElement;
  root.style.setProperty('--qg-primary', theme.primary);
  root.style.setProperty('--qg-primary-light', theme.primaryLight);
  root.style.setProperty('--qg-primary-dark', theme.primaryDark);
  root.style.setProperty('--qg-bg', theme.bg);
  root.style.setProperty('--qg-card-bg', theme.cardBg);
  root.style.setProperty('--qg-card-bg-transparent', theme.cardBgTransparent);
  root.style.setProperty('--qg-text', theme.text);
  root.style.setProperty('--qg-text-secondary', theme.textSecondary);
  root.style.setProperty('--qg-text-tertiary', theme.textTertiary);
  root.style.setProperty('--qg-border', theme.border);
  root.style.setProperty('--qg-shadow', theme.shadow);
  root.style.setProperty('--qg-shadow-hover', theme.shadowHover);
  root.style.setProperty('--qg-game-bg', theme.gameBg);
  root.style.setProperty('--qg-game-surface', theme.gameSurface);
  root.style.setProperty('--qg-game-border', theme.gameBorder);

  // 背景图片处理
  if (theme.bgImage) {
    root.style.setProperty('--qg-bg-image', `url("${theme.bgImage}")`);
    root.style.setProperty('--qg-bg-overlay', theme.bgOverlay || 'transparent');
    document.body.classList.add('has-bg-image');
  } else {
    root.style.setProperty('--qg-bg-image', 'none');
    root.style.setProperty('--qg-bg-overlay', 'transparent');
    document.body.classList.remove('has-bg-image');
  }

  // 保存到 localStorage
  try {
    localStorage.setItem('qinggu-theme', theme.id);
  } catch {
    // ignore
  }
}

// 加载保存的主题
export function loadSavedTheme(): ThemeConfig {
  try {
    const saved = localStorage.getItem('qinggu-theme');
    if (saved) {
      return getThemeById(saved);
    }
  } catch {
    // ignore
  }
  return defaultAnimeTheme;
}
