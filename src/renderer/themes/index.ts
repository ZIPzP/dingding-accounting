/**
 * 主题系统 — Design Token 体系
 * 6 套主题，每套包含 30+ 语义化 Token
 */
export interface ThemeConfig {
  id: string;
  name: string;
  /* ---- 品牌色 ---- */
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryHover: string;
  primaryActive: string;
  /* ---- 点缀色 ---- */
  accent: string;
  accentLight: string;
  /* ---- 语义色 ---- */
  success: string;
  warning: string;
  error: string;
  /* ---- 表面 ---- */
  bg: string;
  bgSecondary: string;
  cardBg: string;
  cardBgTransparent: string;
  /* ---- 文字 ---- */
  text: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  /* ---- 边框与分割线 ---- */
  border: string;
  borderLight: string;
  /* ---- 阴影 ---- */
  shadow: string;
  shadowHover: string;
  shadowLg: string;
  /* ---- 禁用态 ---- */
  disabledBg: string;
  /* ---- 背景图片（可选） ---- */
  bgImage?: string;
  bgOverlay?: string;
  /* ---- 游戏场景 ---- */
  gameBg: string;
  gameSurface: string;
  gameBorder: string;
}

/* ==============================
   🌸 默认主题：阿尼亚粉 + 薄荷绿点缀
   ============================== */
export const defaultAnimeTheme: ThemeConfig = {
  id: 'anime-pink',
  name: '阿尼亚',
  primary: '#ec6b9e',
  primaryLight: '#f08bb5',
  primaryDark: '#d14d82',
  primaryHover: '#f08bb5',
  primaryActive: '#d14d82',
  accent: '#34d399',
  accentLight: '#a7f3d0',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  bg: '#fff5f9',
  bgSecondary: '#ffeaf2',
  cardBg: '#ffffff',
  cardBgTransparent: 'rgba(255, 255, 255, 0.88)',
  text: '#3d1a2a',
  textSecondary: '#8b5a6b',
  textTertiary: '#bfa0aa',
  textDisabled: '#d4bbc4',
  border: '#f5d5e0',
  borderLight: '#fae8ef',
  shadow: '0 2px 12px rgba(236, 107, 158, 0.08)',
  shadowHover: '0 8px 24px rgba(236, 107, 158, 0.14)',
  shadowLg: '0 16px 40px rgba(236, 107, 158, 0.12)',
  disabledBg: '#fce4ec',
  bgImage: '/themes/default-anime.jpg',
  bgOverlay: 'rgba(255, 240, 245, 0.72)',
  gameBg: '#fff5f8',
  gameSurface: '#ffffff',
  gameBorder: '#f0c8d8',
};

/* ==============================
   🔵 经典蓝
   ============================== */
export const blueTheme: ThemeConfig = {
  id: 'blue',
  name: '经典蓝',
  primary: '#4f6df5',
  primaryLight: '#6b85f7',
  primaryDark: '#3b56d4',
  primaryHover: '#6b85f7',
  primaryActive: '#3b56d4',
  accent: '#06b6d4',
  accentLight: '#67e8f9',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  bg: '#f0f2f8',
  bgSecondary: '#e8ecf5',
  cardBg: '#ffffff',
  cardBgTransparent: 'rgba(255, 255, 255, 0.88)',
  text: '#1e1e2e',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textDisabled: '#c4c8d0',
  border: '#eef0f5',
  borderLight: '#f5f6f9',
  shadow: '0 2px 12px rgba(79, 109, 245, 0.06)',
  shadowHover: '0 8px 24px rgba(79, 109, 245, 0.12)',
  shadowLg: '0 16px 40px rgba(79, 109, 245, 0.10)',
  disabledBg: '#f0f2f8',
  gameBg: '#f8f9fc',
  gameSurface: '#ffffff',
  gameBorder: '#e5e7eb',
};

/* ==============================
   🟢 薄荷绿
   ============================== */
export const greenTheme: ThemeConfig = {
  id: 'green',
  name: '薄荷绿',
  primary: '#3bb77e',
  primaryLight: '#5cc996',
  primaryDark: '#2d9a66',
  primaryHover: '#5cc996',
  primaryActive: '#2d9a66',
  accent: '#34d399',
  accentLight: '#a7f3d0',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  bg: '#f0f8f4',
  bgSecondary: '#e6f4ec',
  cardBg: '#ffffff',
  cardBgTransparent: 'rgba(255, 255, 255, 0.88)',
  text: '#1e2e24',
  textSecondary: '#5a7a6a',
  textTertiary: '#8fa8a0',
  textDisabled: '#bcc8c0',
  border: '#d8ede2',
  borderLight: '#eaf5ef',
  shadow: '0 2px 12px rgba(59, 183, 126, 0.06)',
  shadowHover: '0 8px 24px rgba(59, 183, 126, 0.12)',
  shadowLg: '0 16px 40px rgba(59, 183, 126, 0.10)',
  disabledBg: '#e8f5ee',
  gameBg: '#f5faf8',
  gameSurface: '#ffffff',
  gameBorder: '#d0e8d8',
};

/* ==============================
   🟠 日落橙
   ============================== */
export const orangeTheme: ThemeConfig = {
  id: 'orange',
  name: '日落橙',
  primary: '#f59e42',
  primaryLight: '#f7b568',
  primaryDark: '#e08830',
  primaryHover: '#f7b568',
  primaryActive: '#e08830',
  accent: '#fb923c',
  accentLight: '#fed7aa',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  bg: '#fdf6ed',
  bgSecondary: '#faf0e0',
  cardBg: '#ffffff',
  cardBgTransparent: 'rgba(255, 255, 255, 0.88)',
  text: '#2d1f0f',
  textSecondary: '#8b7150',
  textTertiary: '#bfa380',
  textDisabled: '#d4c4b0',
  border: '#f5e0c8',
  borderLight: '#faefe0',
  shadow: '0 2px 12px rgba(245, 158, 66, 0.06)',
  shadowHover: '0 8px 24px rgba(245, 158, 66, 0.12)',
  shadowLg: '0 16px 40px rgba(245, 158, 66, 0.10)',
  disabledBg: '#fef3e6',
  gameBg: '#fef9f2',
  gameSurface: '#ffffff',
  gameBorder: '#f0dcc8',
};

/* ==============================
   🟣 星空紫
   ============================== */
export const purpleTheme: ThemeConfig = {
  id: 'purple',
  name: '星空紫',
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#7c3aed',
  primaryHover: '#a78bfa',
  primaryActive: '#7c3aed',
  accent: '#c084fc',
  accentLight: '#e9d5ff',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  bg: '#f5f0ff',
  bgSecondary: '#ede4ff',
  cardBg: '#ffffff',
  cardBgTransparent: 'rgba(255, 255, 255, 0.88)',
  text: '#2a1d4a',
  textSecondary: '#7a6a9a',
  textTertiary: '#a898c0',
  textDisabled: '#c8bcd8',
  border: '#e8dff5',
  borderLight: '#f2ecfa',
  shadow: '0 2px 12px rgba(139, 92, 246, 0.06)',
  shadowHover: '0 8px 24px rgba(139, 92, 246, 0.12)',
  shadowLg: '0 16px 40px rgba(139, 92, 246, 0.10)',
  disabledBg: '#f0e8ff',
  gameBg: '#faf7ff',
  gameSurface: '#ffffff',
  gameBorder: '#e0d5f0',
};

/* ==============================
   🌙 暗夜黑
   ============================== */
export const darkTheme: ThemeConfig = {
  id: 'dark',
  name: '暗夜黑',
  primary: '#60a5fa',
  primaryLight: '#93c5fd',
  primaryDark: '#3b82f6',
  primaryHover: '#93c5fd',
  primaryActive: '#3b82f6',
  accent: '#38bdf8',
  accentLight: '#7dd3fc',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  bg: '#1a1b26',
  bgSecondary: '#222336',
  cardBg: '#252636',
  cardBgTransparent: 'rgba(37, 38, 54, 0.92)',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textDisabled: '#3d4055',
  border: '#3a3b4f',
  borderLight: '#2e2f40',
  shadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
  shadowHover: '0 8px 24px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 16px 40px rgba(0, 0, 0, 0.5)',
  disabledBg: '#2e2f40',
  gameBg: '#1e2030',
  gameSurface: '#2a2b3d',
  gameBorder: '#3a3b50',
};

/* ==============================
   主题列表
   ============================== */
export const allThemes: ThemeConfig[] = [
  defaultAnimeTheme,
  blueTheme,
  greenTheme,
  orangeTheme,
  purpleTheme,
  darkTheme,
];

export function getThemeById(id: string): ThemeConfig {
  return allThemes.find((t) => t.id === id) || defaultAnimeTheme;
}

/**
 * 将主题注入 CSS 变量
 */
export function applyTheme(theme: ThemeConfig): void {
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);

  /* 品牌色 */
  set('--qg-primary', theme.primary);
  set('--qg-primary-light', theme.primaryLight);
  set('--qg-primary-dark', theme.primaryDark);
  set('--qg-primary-hover', theme.primaryHover);
  set('--qg-primary-active', theme.primaryActive);

  /* 点缀色 */
  set('--qg-accent', theme.accent);
  set('--qg-accent-light', theme.accentLight);

  /* 语义色 */
  set('--qg-success', theme.success);
  set('--qg-warning', theme.warning);
  set('--qg-error', theme.error);

  /* 表面 */
  set('--qg-bg', theme.bg);
  set('--qg-bg-secondary', theme.bgSecondary);
  set('--qg-card-bg', theme.cardBg);
  set('--qg-card-bg-transparent', theme.cardBgTransparent);

  /* 文字 */
  set('--qg-text', theme.text);
  set('--qg-text-secondary', theme.textSecondary);
  set('--qg-text-tertiary', theme.textTertiary);
  set('--qg-text-disabled', theme.textDisabled);

  /* 边框 */
  set('--qg-border', theme.border);
  set('--qg-border-light', theme.borderLight);

  /* 阴影 */
  set('--qg-shadow', theme.shadow);
  set('--qg-shadow-hover', theme.shadowHover);
  set('--qg-shadow-lg', theme.shadowLg);

  /* 禁用态 */
  set('--qg-disabled-bg', theme.disabledBg);

  /* 游戏场景 */
  set('--qg-game-bg', theme.gameBg);
  set('--qg-game-surface', theme.gameSurface);
  set('--qg-game-border', theme.gameBorder);

  /* 背景图片 */
  if (theme.bgImage) {
    set('--qg-bg-image', `url("${theme.bgImage}")`);
    set('--qg-bg-overlay', theme.bgOverlay || 'transparent');
    document.body.classList.add('has-bg-image');
  } else {
    set('--qg-bg-image', 'none');
    set('--qg-bg-overlay', 'transparent');
    document.body.classList.remove('has-bg-image');
  }

  try { localStorage.setItem('qinggu-theme', theme.id); } catch { /* noop */ }
}

export function loadSavedTheme(): ThemeConfig {
  try {
    const saved = localStorage.getItem('qinggu-theme');
    if (saved) return getThemeById(saved);
  } catch { /* noop */ }
  return defaultAnimeTheme;
}
