/**
 * 游戏主题桥接脚本
 * 嵌入到每个游戏 HTML 中，接收父页面传递的主题颜色
 */
(function() {
  'use strict';

  // 默认颜色
  const DEFAULT = {
    primary: '#ec6b9e',
    primaryLight: '#f08bb5',
    primaryDark: '#d14d82',
    bg: '#fff0f5',
    cardBg: '#ffffff',
    text: '#3d1a2a',
    textSecondary: '#8b5a6b',
    textTertiary: '#bfa0aa',
    border: '#f5d5e0',
    gameBg: '#fff5f8',
    gameSurface: '#ffffff',
    gameBorder: '#f0c8d8',
  };

  let currentTheme = { ...DEFAULT };

  // 应用 CSS 变量到 document
  function applyThemeVars(theme) {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-light', theme.primaryLight);
    root.style.setProperty('--theme-primary-dark', theme.primaryDark);
    root.style.setProperty('--theme-bg', theme.bg);
    root.style.setProperty('--theme-card-bg', theme.cardBg);
    root.style.setProperty('--theme-text', theme.text);
    root.style.setProperty('--theme-text-secondary', theme.textSecondary);
    root.style.setProperty('--theme-text-tertiary', theme.textTertiary);
    root.style.setProperty('--theme-border', theme.border);
    root.style.setProperty('--theme-game-bg', theme.gameBg);
    root.style.setProperty('--theme-game-surface', theme.gameSurface);
    root.style.setProperty('--theme-game-border', theme.gameBorder);
  }

  // 应用颜色到游戏元素
  function applyGameColors(theme) {
    // 更新 body 背景
    document.body.style.background = theme.gameBg;

    // 查找常见元素并应用颜色
    const style = document.createElement('style');
    style.id = 'theme-override';
    style.textContent = `
      /* 主题覆盖 - 自动注入 */
      .game-wrapper { background: ${theme.gameBg} !important; }
      canvas { border-color: ${theme.gameBorder} !important; background: ${theme.gameSurface} !important; }
      .grid-container { border-color: ${theme.gameBorder} !important; background: ${theme.gameSurface} !important; }
      .grid-bg .bg-cell { background: ${theme.border} !important; }
      .info-bar, .status-bar { color: ${theme.text} !important; background: ${theme.gameSurface} !important; border-color: ${theme.gameBorder} !important; }
      .title { color: ${theme.primary} !important; }
      .overlay { background: rgba(0,0,0,0.65) !important; }
      .overlay .title { color: ${theme.primary} !important; }
      .overlay .subtitle { color: ${theme.text} !important; }
      .btn-start, .btn-ov, .btn-green { background: ${theme.primary} !important; }
      .btn-start:active, .btn-ov:active { background: ${theme.primaryDark} !important; }
      .btn-reset, .btn-ov-red { background: ${theme.primaryDark} !important; }
      .btn-rs { background: ${theme.gameSurface} !important; color: ${theme.text} !important; border-color: ${theme.gameBorder} !important; }
      .dpad .btn-dir { background: ${theme.gameSurface} !important; color: ${theme.textSecondary} !important; border-color: ${theme.gameBorder} !important; }
      .dpad .btn-dir:active, .dpad .btn-dir.pressed { background: ${theme.border} !important; color: ${theme.text} !important; }
      .action-btns .btn-act { background: ${theme.gameSurface} !important; color: ${theme.text} !important; border-color: ${theme.gameBorder} !important; }
      .action-btns .btn-primary { background: ${theme.primary} !important; color: #fff !important; }
      .action-btns .btn-danger { background: ${theme.primaryDark} !important; color: #fff !important; }
      .side-panel { background: ${theme.gameSurface} !important; }
      .side-panel .label { color: ${theme.textSecondary} !important; }
      .side-hint { color: ${theme.textSecondary} !important; }
      .side-hint kbd { color: ${theme.primary} !important; }
      .mode-btn { background: ${theme.gameSurface} !important; color: ${theme.textSecondary} !important; border-color: ${theme.gameBorder} !important; }
      .mode-btn.active { border-color: ${theme.primary} !important; color: ${theme.primary} !important; background: ${theme.bg} !important; }
      .cell { background: ${theme.gameSurface} !important; border-color: ${theme.gameBorder} !important; }
      .cell.revealed { background: ${theme.border} !important; }
      .cell:hover { background: ${theme.bg} !important; }
      .smiley-btn { background: ${theme.gameSurface} !important; border-color: ${theme.gameBorder} !important; }
      .score-box .value { color: ${theme.text} !important; }
      .score-box .value.best { color: ${theme.primary} !important; }
      .lb-panel { background: ${theme.gameSurface} !important; border-color: ${theme.gameBorder} !important; }
      .lb-full { background: ${theme.gameBg} !important; }
      .name-entry input { background: ${theme.gameSurface} !important; border-color: ${theme.gameBorder} !important; color: ${theme.text} !important; }
      .btn-start-opt { background: ${theme.gameSurface} !important; color: ${theme.text} !important; }
      .touch-controls { background: transparent !important; }
      .grid-wrap { background: ${theme.gameSurface} !important; border-color: ${theme.gameBorder} !important; }
      .controls .btn { background: ${theme.gameSurface} !important; color: ${theme.text} !important; border-color: ${theme.gameBorder} !important; }
      .help-text { color: ${theme.textTertiary} !important; }
      .action-hint { color: ${theme.textTertiary} !important; }
    `;

    // 移除旧的主题覆盖
    const old = document.getElementById('theme-override');
    if (old) old.remove();
    document.head.appendChild(style);
  }

  // 监听父页面消息
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'theme-update') {
      const theme = e.data.theme;
      if (theme) {
        currentTheme = { ...DEFAULT, ...theme };
        applyThemeVars(currentTheme);
        applyGameColors(currentTheme);
      }
    }
  });

  // 向父页面请求主题
  function requestTheme() {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'request-theme' }, '*');
    }
  }

  // DOM 加载完成后请求主题
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', requestTheme);
  } else {
    requestTheme();
  }

  // 也延迟请求一次（确保父页面已加载）
  setTimeout(requestTheme, 100);
  setTimeout(requestTheme, 500);
})();
