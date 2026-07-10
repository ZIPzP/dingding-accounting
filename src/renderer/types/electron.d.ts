/**
 * 为 window.electronAPI 提供 TypeScript 类型声明
 */

interface RecordParams {
  amount: number;
  record_date: string;
  category_id: number;
  sub_category_id?: number | null;
  note?: string;
}

interface RecordUpdateParams extends RecordParams {
  id: number;
}

interface QueryParams {
  year?: number;
  month?: number;
  category_id?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  code: string;
}

interface SubCategory {
  id: number;
  category_id: number;
  name: string;
}

interface CategoryWithSubs extends Category {
  subs: SubCategory[];
}

interface RecordItem {
  id: number;
  amount: number;
  record_date: string;
  category_id: number;
  sub_category_id: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_icon: string;
  category_code: string;
  sub_category_name: string | null;
}

interface CategoryStat {
  id: number;
  name: string;
  icon: string;
  code: string;
  total: number;
}

interface MonthlyStats {
  total: number;
  count: number;
  dailyAvg: number;
  categoryStats: CategoryStat[];
}

interface TrendItem {
  year: number;
  month: number;
  label: string;
  total: number;
}

interface ElectronAPI {
  getCategories: () => Promise<CategoryWithSubs[]>;
  getAllCategories: () => Promise<CategoryWithSubs[]>;
  addCategory: (params: { name: string; icon: string; code: string }) =>
    Promise<{ success: true; id: number } | { success: false; error: string }>;
  updateCategory: (id: number, params: { name: string; icon: string }) =>
    Promise<{ success: true } | { success: false; error: string }>;
  deleteCategory: (id: number) =>
    Promise<{ success: true; affectedRecords: number } | { success: false; error: string }>;
  addSubCategory: (params: { category_id: number; name: string }) =>
    Promise<{ success: true; id: number } | { success: false; error: string }>;
  updateSubCategory: (id: number, name: string) =>
    Promise<{ success: true } | { success: false; error: string }>;
  deleteSubCategory: (id: number) =>
    Promise<{ success: true; affectedRecords: number } | { success: false; error: string }>;
  addRecord: (params: RecordParams) => Promise<number>;
  updateRecord: (params: RecordUpdateParams) => Promise<boolean>;
  deleteRecord: (id: number) => Promise<boolean>;
  getRecords: (params: QueryParams) => Promise<{ records: RecordItem[]; total: number }>;
  getRecordById: (id: number) => Promise<RecordItem | undefined>;
  getMonthlyStats: (year: number, month: number) => Promise<MonthlyStats>;
  getMonthlyTrend: (months?: number) => Promise<TrendItem[]>;
  exportCSV: (csvContent: string) => Promise<{ success: boolean; path?: string }>;
  backupDatabase: () => Promise<{ success: boolean; path?: string }>;
  restoreDatabase: () => Promise<{ success: boolean; error?: string; message?: string }>;
}

interface Window {
  electronAPI: ElectronAPI;
}
