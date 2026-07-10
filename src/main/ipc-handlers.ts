/**
 * IPC 通信处理
 * 注册主进程与渲染进程之间的通信通道
 * 渲染进程通过 window.electronAPI 调用这些方法
 */
import { ipcMain, dialog } from 'electron';
import {
  getCategories,
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  addRecord,
  updateRecord,
  deleteRecord,
  getRecords,
  getMonthlyStats,
  getMonthlyTrend,
  getRecordById,
  getDbPath,
} from './database';
import fs from 'fs';
import path from 'path';

export function registerIpcHandlers(): void {
  // ============ 分类 ============

  ipcMain.handle('get-categories', () => {
    return getCategories();
  });

  ipcMain.handle('get-all-categories', () => {
    return getAllCategories();
  });

  ipcMain.handle('add-category', (_event, params) => {
    return addCategory(params);
  });

  ipcMain.handle('update-category', (_event, id: number, params) => {
    return updateCategory(id, params);
  });

  ipcMain.handle('delete-category', (_event, id: number) => {
    return deleteCategory(id);
  });

  ipcMain.handle('add-sub-category', (_event, params) => {
    return addSubCategory(params);
  });

  ipcMain.handle('update-sub-category', (_event, id: number, name: string) => {
    return updateSubCategory(id, name);
  });

  ipcMain.handle('delete-sub-category', (_event, id: number) => {
    return deleteSubCategory(id);
  });

  // ============ 记账记录 CRUD ============

  ipcMain.handle('add-record', (_event, params) => {
    return addRecord(params);
  });

  ipcMain.handle('update-record', (_event, params) => {
    updateRecord(params);
    return true;
  });

  ipcMain.handle('delete-record', (_event, id: number) => {
    deleteRecord(id);
    return true;
  });

  ipcMain.handle('get-records', (_event, params) => {
    return getRecords(params);
  });

  ipcMain.handle('get-record-by-id', (_event, id: number) => {
    return getRecordById(id);
  });

  // ============ 统计 ============

  ipcMain.handle('get-monthly-stats', (_event, year: number, month: number) => {
    return getMonthlyStats(year, month);
  });

  ipcMain.handle('get-monthly-trend', (_event, months?: number) => {
    return getMonthlyTrend(months || 6);
  });

  // ============ 数据导入导出 ============

  ipcMain.handle('export-csv', async (_event, csvContent: string) => {
    const result = await dialog.showSaveDialog({
      title: '导出账单数据',
      defaultPath: `青孤记账_导出_${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [
        { name: 'CSV 文件', extensions: ['csv'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });

    if (!result.canceled && result.filePath) {
      // 写入 BOM 以确保 Excel 正确识别中文
      fs.writeFileSync(result.filePath, '﻿' + csvContent, 'utf-8');
      return { success: true, path: result.filePath };
    }
    return { success: false };
  });

  ipcMain.handle('backup-database', async () => {
    const result = await dialog.showSaveDialog({
      title: '备份数据库',
      defaultPath: `青孤记账_备份_${new Date().toISOString().slice(0, 10)}.db`,
      filters: [
        { name: '数据库文件', extensions: ['db'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });

    if (!result.canceled && result.filePath) {
      fs.copyFileSync(getDbPath(), result.filePath);
      return { success: true, path: result.filePath };
    }
    return { success: false };
  });

  ipcMain.handle('restore-database', async () => {
    const result = await dialog.showOpenDialog({
      title: '恢复数据库（请选择备份文件）',
      filters: [
        { name: '数据库文件', extensions: ['db'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const sourcePath = result.filePaths[0];
      // 验证是否为有效的 SQLite 文件
      const buffer = fs.readFileSync(sourcePath);
      const header = buffer.toString('utf-8', 0, 16);
      if (!header.startsWith('SQLite format 3')) {
        return { success: false, error: '所选文件不是有效的数据库备份文件' };
      }
      fs.copyFileSync(sourcePath, getDbPath());
      return { success: true, message: '数据恢复成功，请重启应用以生效' };
    }
    return { success: false };
  });
}
