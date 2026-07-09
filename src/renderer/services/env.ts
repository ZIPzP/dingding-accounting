/**
 * 环境检测
 * 判断当前运行环境是 Electron 桌面端还是普通浏览器
 */

export function isElectron(): boolean {
  // Electron 的 preload 脚本会向 window 注入 electronAPI
  return !!(window as any).electronAPI;
}

export function getElectronAPI(): ElectronAPI {
  return (window as any).electronAPI;
}
