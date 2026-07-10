/**
 * Preload 脚本
 * 通过 contextBridge 安全地向渲染进程暴露 API
 * 渲染进程只能调用这里暴露的方法，无法直接访问 Node.js 或 Electron
 */
import { contextBridge, ipcRenderer } from 'electron';

// 定义暴露给渲染进程的 API 类型
const electronAPI = {
  // 分类
  getCategories: () => ipcRenderer.invoke('get-categories'),

  getAllCategories: () => ipcRenderer.invoke('get-all-categories'),

  addCategory: (params: { name: string; icon: string; code: string }) =>
    ipcRenderer.invoke('add-category', params),

  updateCategory: (id: number, params: { name: string; icon: string }) =>
    ipcRenderer.invoke('update-category', id, params),

  deleteCategory: (id: number) => ipcRenderer.invoke('delete-category', id),

  addSubCategory: (params: { category_id: number; name: string }) =>
    ipcRenderer.invoke('add-sub-category', params),

  updateSubCategory: (id: number, name: string) =>
    ipcRenderer.invoke('update-sub-category', id, name),

  deleteSubCategory: (id: number) => ipcRenderer.invoke('delete-sub-category', id),

  // 记账记录
  addRecord: (params: {
    amount: number;
    record_date: string;
    category_id: number;
    sub_category_id?: number | null;
    note?: string;
  }) => ipcRenderer.invoke('add-record', params),

  updateRecord: (params: {
    id: number;
    amount: number;
    record_date: string;
    category_id: number;
    sub_category_id?: number | null;
    note?: string;
  }) => ipcRenderer.invoke('update-record', params),

  deleteRecord: (id: number) => ipcRenderer.invoke('delete-record', id),

  getRecords: (params: {
    year?: number;
    month?: number;
    category_id?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) => ipcRenderer.invoke('get-records', params),

  getRecordById: (id: number) => ipcRenderer.invoke('get-record-by-id', id),

  // 统计
  getMonthlyStats: (year: number, month: number) =>
    ipcRenderer.invoke('get-monthly-stats', year, month),

  getMonthlyTrend: (months?: number) => ipcRenderer.invoke('get-monthly-trend', months),

  // 导入导出
  exportCSV: (csvContent: string) => ipcRenderer.invoke('export-csv', csvContent),

  backupDatabase: () => ipcRenderer.invoke('backup-database'),

  restoreDatabase: () => ipcRenderer.invoke('restore-database'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明：让 TypeScript 知道 window.electronAPI 的存在
export type ElectronAPI = typeof electronAPI;
