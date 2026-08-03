/**
 * 青孤项目 · 游戏主题桥接
 * 嵌入到每个游戏 HTML 中，接收父页面传递的主题
 * 支持：postMessage 通信 / URL 参数 / 浅深双主题
 */
(function() {
  'use strict';

  /* ====== Light Theme (阿尼亚粉 — 默认) ====== */
  const LIGHT = {
    primary: '#ec6b9e',
    primaryLight: '#f08bb5',
    primaryDark: '#d14d82',
    accent: '#34d399',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    bg: '#fff5f8',
    bgSecondary: '#ffeaf2',
    surface: '#ffffff',
    border: '#f0c8d8',
    borderLight: '#fae8ef',
    text: '#3d1a2a',
    textSecondary: '#8b5a6b',
    textTertiary: '#bfa0aa',
    textDisabled: '#d4bbc4',
    overlay: 'rgba(255, 245, 250, 0.92)',
    shadow: '0 2px 12px rgba(236, 107, 158, 0.08)',
    shadowHover: '0 8px 24px rgba(236, 107, 158, 0.14)',
    canvasBg: '#fdf2f8',
    canvasGrid: '#f0e0ea',
    canvasBorder: '#e8d0de',
    btnHover: '#f08bb5',
  };

  /* ====== Dark Theme (暗夜黑) ====== */
  const DARK = {
    primary: '#60a5fa',
    primaryLight: '#93c5fd',
    primaryDark: '#3b82f6',
    accent: '#38bdf8',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    bg: '#1a1b26',
    bgSecondary: '#222336',
    surface: '#252636',
    border: '#3a3b50',
    borderLight: '#2e2f40',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    textDisabled: '#3d4055',
    overlay: 'rgba(26, 27, 38, 0.94)',
    shadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
    shadowHover: '0 8px 24px rgba(0, 0, 0, 0.4)',
    canvasBg: '#1e2030',
    canvasGrid: '#2e3040',
    canvasBorder: '#3a3b50',
    btnHover: '#3b82f6',
  };

  let currentThemeId = 'light';

  function getTheme() { return currentThemeId === 'dark' ? DARK : LIGHT; }

  /* ====== Apply CSS variables to :root ====== */
  function applyCSS(theme) {
    const root = document.documentElement;
    root.style.setProperty('--g-primary', theme.primary);
    root.style.setProperty('--g-primary-light', theme.primaryLight);
    root.style.setProperty('--g-primary-dark', theme.primaryDark);
    root.style.setProperty('--g-accent', theme.accent);
    root.style.setProperty('--g-success', theme.success);
    root.style.setProperty('--g-warning', theme.warning);
    root.style.setProperty('--g-error', theme.error);
    root.style.setProperty('--g-bg', theme.bg);
    root.style.setProperty('--g-bg-secondary', theme.bgSecondary);
    root.style.setProperty('--g-surface', theme.surface);
    root.style.setProperty('--g-border', theme.border);
    root.style.setProperty('--g-border-light', theme.borderLight);
    root.style.setProperty('--g-text', theme.text);
    root.style.setProperty('--g-text-secondary', theme.textSecondary);
    root.style.setProperty('--g-text-tertiary', theme.textTertiary);
    root.style.setProperty('--g-text-disabled', theme.textDisabled);
    root.style.setProperty('--g-overlay', theme.overlay);
    root.style.setProperty('--g-shadow', theme.shadow);
    root.style.setProperty('--g-shadow-hover', theme.shadowHover);
    root.style.setProperty('--g-canvas-bg', theme.canvasBg);
    root.style.setProperty('--g-canvas-grid', theme.canvasGrid);
    root.style.setProperty('--g-canvas-border', theme.canvasBorder);
    root.style.setProperty('--g-btn-hover', theme.btnHover);

    // data-theme 属性供 CSS 选择器使用
    document.documentElement.setAttribute('data-theme', currentThemeId);
  }

  /* ====== Set theme ====== */
  function setTheme(id) {
    if (id !== 'light' && id !== 'dark') id = 'light';
    currentThemeId = id;
    applyCSS(getTheme());
    try { localStorage.setItem('qinggu-game-theme', id); } catch(e) { /* noop */ }
    // 通知父窗口主题已切换
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'game-theme-changed', theme: id }, '*');
    }
  }

  /* ====== Toggle theme ====== */
  function toggleTheme() {
    setTheme(currentThemeId === 'dark' ? 'light' : 'dark');
  }

  // 暴露到 window 供游戏内按钮调用
  window.toggleGameTheme = toggleTheme;
  window.getGameTheme = function() { return currentThemeId; };

  /* ====== Listen for parent messages ====== */
  window.addEventListener('message', function(e) {
    if (!e.data) return;

    if (e.data.type === 'theme-update') {
      // 父窗口发送具体主题数据
      const t = e.data.theme || {};
      const isDark = t.bg && (
        parseInt(t.bg.slice(1,3), 16) + parseInt(t.bg.slice(3,5), 16) + parseInt(t.bg.slice(5,7), 16) < 384
      );
      setTheme(isDark ? 'dark' : 'light');
    }

    if (e.data.type === 'set-theme' && e.data.themeId) {
      setTheme(e.data.themeId === 'dark' ? 'dark' : 'light');
    }
  });

  /* ====== Read URL parameter (?theme=dark) ====== */
  function readURLTheme() {
    try {
      var p = new URLSearchParams(window.location.search);
      var t = p.get('theme');
      if (t === 'dark' || t === 'light') return t;
    } catch(e) {}
    return null;
  }

  /* ====== Init ====== */
  function init() {
    // Priority: URL > localStorage > default (light)
    var urlT = readURLTheme();
    var savedT;
    try { savedT = localStorage.getItem('qinggu-game-theme'); } catch(e) {}
    var t = urlT || savedT || 'light';
    setTheme(t);

    // Request theme from parent
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'request-theme' }, '*');
    }

    // Retry after a short delay (parent might not be ready)
    setTimeout(function() {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'request-theme' }, '*');
      }
    }, 300);
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
