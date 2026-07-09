/**
 * Electron 主进程入口
 * 负责：创建窗口、加载页面、应用生命周期管理
 */
import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { initDatabase, closeDatabase } from './database';
import { registerIpcHandlers } from './ipc-handlers';

// 判断是否为开发模式
const isDev = process.env.NODE_ENV === 'development';
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '青孤记账',
    icon: path.join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,   // 隔离渲染进程上下文（安全）
      nodeIntegration: false,   // 禁止渲染进程直接使用 Node.js
      sandbox: false,           // 为 preload 保留 Node 能力
    },
    // Windows 下的任务栏图标
    ...(process.platform === 'win32' ? {
      icon: path.join(__dirname, '../../resources/icon.png'),
    } : {}),
  });

  // 外部链接在默认浏览器中打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 加载页面
  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用就绪
app.whenReady().then(async () => {
  // 初始化数据库
  await initDatabase();

  // 注册 IPC 通信处理
  registerIpcHandlers();

  // 创建窗口
  createWindow();

  // macOS：点击 Dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前关闭数据库
app.on('before-quit', () => {
  closeDatabase();
});
