/**
 * 跨平台数据服务
 * Electron 环境：通过 IPC 调用主进程 SQLite
 * 浏览器环境：使用 sql.js (WASM) + IndexedDB 持久化
 */
import { isElectron, getElectronAPI } from './env';

// ==================== 统一 API 接口 ====================

export const api = {
  getCategories: (): Promise<CategoryWithSubs[]> => {
    if (isElectron()) return getElectronAPI().getCategories();
    return getWebDB().then((db) => db.getCategories());
  },

  addRecord: (params: RecordParams): Promise<number> => {
    if (isElectron()) return getElectronAPI().addRecord(params);
    return getWebDB().then((db) => db.addRecord(params));
  },

  updateRecord: (params: RecordUpdateParams): Promise<boolean> => {
    if (isElectron()) return getElectronAPI().updateRecord(params);
    return getWebDB().then((db) => db.updateRecord(params));
  },

  deleteRecord: (id: number): Promise<boolean> => {
    if (isElectron()) return getElectronAPI().deleteRecord(id);
    return getWebDB().then((db) => db.deleteRecord(id));
  },

  getRecords: (params: QueryParams): Promise<{ records: RecordItem[]; total: number }> => {
    if (isElectron()) return getElectronAPI().getRecords(params);
    return getWebDB().then((db) => db.getRecords(params));
  },

  getRecordById: (id: number): Promise<RecordItem | undefined> => {
    if (isElectron()) return getElectronAPI().getRecordById(id);
    return getWebDB().then((db) => db.getRecordById(id));
  },

  // 分类管理
  getAllCategories: (): Promise<CategoryWithSubs[]> => {
    if (isElectron()) return getElectronAPI().getAllCategories();
    return getWebDB().then((db) => db.getAllCategories());
  },

  addCategory: (params: { name: string; icon: string; code: string }): Promise<any> => {
    if (isElectron()) return getElectronAPI().addCategory(params);
    return getWebDB().then((db) => db.addCategory(params));
  },

  updateCategory: (id: number, params: { name: string; icon: string }): Promise<any> => {
    if (isElectron()) return getElectronAPI().updateCategory(id, params);
    return getWebDB().then((db) => db.updateCategory(id, params));
  },

  deleteCategory: (id: number): Promise<any> => {
    if (isElectron()) return getElectronAPI().deleteCategory(id);
    return getWebDB().then((db) => db.deleteCategory(id));
  },

  addSubCategory: (params: { category_id: number; name: string }): Promise<any> => {
    if (isElectron()) return getElectronAPI().addSubCategory(params);
    return getWebDB().then((db) => db.addSubCategory(params));
  },

  updateSubCategory: (id: number, name: string): Promise<any> => {
    if (isElectron()) return getElectronAPI().updateSubCategory(id, name);
    return getWebDB().then((db) => db.updateSubCategory(id, name));
  },

  deleteSubCategory: (id: number): Promise<any> => {
    if (isElectron()) return getElectronAPI().deleteSubCategory(id);
    return getWebDB().then((db) => db.deleteSubCategory(id));
  },

  getMonthlyStats: (year: number, month: number): Promise<MonthlyStats> => {
    if (isElectron()) return getElectronAPI().getMonthlyStats(year, month);
    return getWebDB().then((db) => db.getMonthlyStats(year, month));
  },

  getMonthlyTrend: (months?: number): Promise<TrendItem[]> => {
    if (isElectron()) return getElectronAPI().getMonthlyTrend(months);
    return getWebDB().then((db) => db.getMonthlyTrend(months));
  },

  exportCSV: (csvContent: string): Promise<{ success: boolean; path?: string }> => {
    if (isElectron()) return getElectronAPI().exportCSV(csvContent);
    // 浏览器：触发下载
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `青孤记账_导出_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return Promise.resolve({ success: true });
  },

  backupDatabase: (): Promise<{ success: boolean; path?: string }> => {
    if (isElectron()) return getElectronAPI().backupDatabase();
    // 浏览器：下载数据库文件
    return getWebDB().then(async (db) => {
      const data = db.exportDatabase();
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `青孤记账_备份_${new Date().toISOString().slice(0, 10)}.db`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    });
  },

  restoreDatabase: (): Promise<{ success: boolean; error?: string; message?: string }> => {
    if (isElectron()) return getElectronAPI().restoreDatabase();
    // 浏览器：上传数据库文件
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.db';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve({ success: false, error: '未选择文件' });
          return;
        }
        try {
          const buffer = new Uint8Array(await file.arrayBuffer());
          // 验证 SQLite 文件头
          const header = new TextDecoder().decode(buffer.slice(0, 16));
          if (!header.startsWith('SQLite format 3')) {
            resolve({ success: false, error: '所选文件不是有效的数据库备份文件' });
            return;
          }
          const db = await getWebDB();
          db.importDatabase(buffer);
          resolve({ success: true, message: '数据恢复成功，请刷新页面以生效' });
        } catch {
          resolve({ success: false, error: '恢复失败，文件格式不正确' });
        }
      };
      input.click();
    });
  },
};

// ==================== 浏览器端 sql.js + IndexedDB ====================

let webDBInstance: WebDatabase | null = null;
let dbInitPromise: Promise<WebDatabase> | null = null;

async function getWebDB(): Promise<WebDatabase> {
  if (webDBInstance) return webDBInstance;
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = WebDatabase.create();
  webDBInstance = await dbInitPromise;
  return webDBInstance;
}

class WebDatabase {
  private db: any; // sql.js Database
  private SQL: any; // sql.js module

  static async create(): Promise<WebDatabase> {
    const wdb = new WebDatabase();
    const initSqlJs = (await import('sql.js')).default;

    // 多种方式加载 WASM：先试本地，失败则用 CDN
    let SQL: any = null;
    const wasmSources = [
      // 方式1：Vite 静态资源路径（生产构建）
      () => import('sql.js/dist/sql-wasm.wasm?url').then(m => m.default),
      // 方式2：CDN（兜底）
      () => Promise.resolve('https://sql.js.org/dist/sql-wasm.wasm'),
    ];

    let wasmUrl = '';
    for (const source of wasmSources) {
      try {
        wasmUrl = await source();
        SQL = await initSqlJs({ locateFile: () => wasmUrl });
        console.log('sql.js WASM 加载成功:', wasmUrl);
        break;
      } catch (e) {
        console.warn('WASM 源失败:', e);
      }
    }

    if (!SQL) {
      throw new Error('数据库引擎加载失败，请检查网络连接后刷新页面');
    }

    wdb.SQL = SQL;

    // 尝试从 IndexedDB 加载已有数据库
    let saved: Uint8Array | null = null;
    try {
      saved = await wdb.loadFromIndexedDB();
    } catch (e) {
      console.warn('IndexedDB 读取失败，将创建新数据库:', e);
    }

    if (saved) {
      wdb.db = new wdb.SQL.Database(saved);
      console.log('从 IndexedDB 加载已有数据库');
    } else {
      wdb.db = new wdb.SQL.Database();
      wdb.initTables();
      wdb.seedCategories();
      wdb.ensureSystemCategory();
      try {
        await wdb.saveToIndexedDB();
      } catch (e) {
        console.warn('IndexedDB 保存失败（数据仅存在于内存中）:', e);
      }
    }

    return wdb;
  }

  // ========= IndexedDB 持久化 =========

  private idbOpen(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('qinggu-accounting', 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('database');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    try {
      const idb = await this.idbOpen();
      return new Promise((resolve) => {
        const tx = idb.transaction('database', 'readonly');
        const req = tx.objectStore('database').get('db');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  private async saveToIndexedDB(): Promise<void> {
    try {
      const data = this.db.export();
      const idb = await this.idbOpen();
      return new Promise((resolve) => {
        const tx = idb.transaction('database', 'readwrite');
        tx.objectStore('database').put(data, 'db');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // 静默失败
    }
  }

  exportDatabase(): Uint8Array {
    return this.db.export();
  }

  importDatabase(data: Uint8Array): void {
    this.db.close();
    this.db = new this.SQL.Database(data);
    this.saveToIndexedDB();
  }

  // ========= 数据库初始化 =========

  private initTables(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS sub_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        record_date TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        sub_category_id INTEGER,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id)
      );
      CREATE INDEX IF NOT EXISTS idx_records_date ON records(record_date);
      CREATE INDEX IF NOT EXISTS idx_records_category ON records(category_id);
    `);
    this.db.run('PRAGMA foreign_keys = ON');
  }

  private seedCategories(): void {
    const result = this.db.exec('SELECT COUNT(*) as cnt FROM categories');
    const count = result[0]?.values[0]?.[0] as number;
    if (count > 0) return;

    const categories = [
      { name: '餐饮饮食', icon: '🍜', code: 'food', subs: ['日常三餐', '外卖', '零食饮料', '聚餐应酬'] },
      { name: '交通出行', icon: '🚗', code: 'transport', subs: ['公共交通', '出租车/网约车', '加油充电', '停车费', '长途出行'] },
      { name: '购物消费', icon: '🛒', code: 'shopping', subs: ['日用百货', '服饰鞋包', '数码产品', '家居用品'] },
      { name: '住房居住', icon: '🏠', code: 'housing', subs: ['房租', '水电燃气', '物业费', '维修装修'] },
      { name: '娱乐休闲', icon: '🎮', code: 'entertainment', subs: ['电影演出', '游戏充值', '运动健身', '旅游度假'] },
      { name: '医疗健康', icon: '💊', code: 'health', subs: ['看病买药', '体检保健', '美容护肤'] },
      { name: '教育学习', icon: '📚', code: 'education', subs: ['培训课程', '书籍资料', '文具用品'] },
      { name: '人情往来', icon: '🎁', code: 'social', subs: ['红包礼金', '孝敬长辈', '慈善捐款'] },
      { name: '其他支出', icon: '📦', code: 'other', subs: ['快递物流', '宠物用品', '其他'] },
    ];

    for (const cat of categories) {
      this.db.run('INSERT INTO categories (name, icon, code) VALUES (?, ?, ?)', [cat.name, cat.icon, cat.code]);
      const idResult = this.db.exec('SELECT last_insert_rowid() as id');
      const categoryId = idResult[0]?.values[0]?.[0] as number;
      for (const sub of cat.subs) {
        this.db.run('INSERT INTO sub_categories (category_id, name) VALUES (?, ?)', [categoryId, sub]);
      }
    }
    this.saveToIndexedDB();
  }

  private ensureSystemCategory(): void {
    const existing = this.db.exec("SELECT id FROM categories WHERE code = '_deleted'");
    if (existing.length > 0 && existing[0].values.length > 0) return;
    this.db.run("INSERT INTO categories (name, icon, code) VALUES ('已删除', '🗑️', '_deleted')");
    this.saveToIndexedDB();
  }

  // ========= 数据操作 =========

  private rowsToObjects<T>(result: { columns: string[]; values: unknown[][] }[]): T[] {
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj as T;
    });
  }

  getCategories(): CategoryWithSubs[] {
    const cats = this.rowsToObjects<Category>(this.db.exec("SELECT * FROM categories WHERE code != '_deleted' ORDER BY id"));
    const subs = this.rowsToObjects<SubCategory>(this.db.exec('SELECT * FROM sub_categories ORDER BY id'));
    return cats.map((c) => ({ ...c, subs: subs.filter((s) => s.category_id === c.id) }));
  }

  getAllCategories(): CategoryWithSubs[] {
    const cats = this.rowsToObjects<Category>(this.db.exec('SELECT * FROM categories ORDER BY id'));
    const subs = this.rowsToObjects<SubCategory>(this.db.exec('SELECT * FROM sub_categories ORDER BY id'));
    return cats.map((c) => ({ ...c, subs: subs.filter((s) => s.category_id === c.id) }));
  }

  addRecord(params: RecordParams): number {
    this.db.run('INSERT INTO records (amount, record_date, category_id, sub_category_id, note) VALUES (?, ?, ?, ?, ?)',
      [params.amount, params.record_date, params.category_id, params.sub_category_id || null, params.note || null]);
    const r = this.db.exec('SELECT last_insert_rowid() as id');
    this.saveToIndexedDB();
    return r[0]?.values[0]?.[0] as number;
  }

  updateRecord(params: RecordUpdateParams): boolean {
    this.db.run(
      `UPDATE records SET amount=?, record_date=?, category_id=?, sub_category_id=?, note=?, updated_at=datetime('now','localtime') WHERE id=?`,
      [params.amount, params.record_date, params.category_id, params.sub_category_id || null, params.note || null, params.id]
    );
    this.saveToIndexedDB();
    return true;
  }

  deleteRecord(id: number): boolean {
    this.db.run('DELETE FROM records WHERE id = ?', [id]);
    this.saveToIndexedDB();
    return true;
  }

  getRecords(params: QueryParams): { records: RecordItem[]; total: number } {
    const conds: string[] = [];
    const vals: any[] = [];
    if (params.year) { conds.push("strftime('%Y', record_date)=?"); vals.push(String(params.year)); }
    if (params.month) { conds.push("strftime('%m', record_date)=?"); vals.push(String(params.month).padStart(2, '0')); }
    if (params.category_id) { conds.push('r.category_id=?'); vals.push(params.category_id); }
    if (params.keyword) { conds.push('r.note LIKE ?'); vals.push(`%${params.keyword}%`); }

    const where = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : '';
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const offset = (page - 1) * pageSize;

    const countR = this.db.exec(`SELECT COUNT(*) as total FROM records r ${where}`, vals);
    const total = (countR[0]?.values[0]?.[0] as number) || 0;

    const dataR = this.db.exec(
      `SELECT r.*, c.name as category_name, c.icon as category_icon, c.code as category_code, s.name as sub_category_name
       FROM records r
       LEFT JOIN categories c ON r.category_id=c.id
       LEFT JOIN sub_categories s ON r.sub_category_id=s.id
       ${where} ORDER BY r.record_date DESC, r.id DESC LIMIT ? OFFSET ?`,
      [...vals, pageSize, offset]
    );
    return { records: this.rowsToObjects<RecordItem>(dataR), total };
  }

  getRecordById(id: number): RecordItem | undefined {
    const r = this.db.exec(
      `SELECT r.*, c.name as category_name, c.icon as category_icon, c.code as category_code, s.name as sub_category_name
       FROM records r
       LEFT JOIN categories c ON r.category_id=c.id
       LEFT JOIN sub_categories s ON r.sub_category_id=s.id
       WHERE r.id=?`, [id]
    );
    return this.rowsToObjects<RecordItem>(r)[0];
  }

  // ========= 分类管理 =========

  addCategory(params: { name: string; icon: string; code: string }): { success: true; id: number } | { success: false; error: string } {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(params.code)) {
      return { success: false, error: '分类代码只能包含字母、数字和下划线，且必须以字母或下划线开头' };
    }
    try {
      this.db.run('INSERT INTO categories (name, icon, code) VALUES (?, ?, ?)', [params.name, params.icon, params.code]);
      const r = this.db.exec('SELECT last_insert_rowid() as id');
      this.saveToIndexedDB();
      return { success: true, id: (r[0]?.values[0]?.[0] as number) || 0 };
    } catch (e: any) {
      if (e.message?.includes('UNIQUE')) return { success: false, error: '分类代码已存在，请换一个' };
      return { success: false, error: '添加失败，请重试' };
    }
  }

  updateCategory(id: number, params: { name: string; icon: string }): { success: true } | { success: false; error: string } {
    try {
      this.db.run('UPDATE categories SET name = ?, icon = ? WHERE id = ?', [params.name, params.icon, id]);
      this.saveToIndexedDB();
      return { success: true };
    } catch { return { success: false, error: '更新失败，请重试' }; }
  }

  deleteCategory(id: number): { success: true; affectedRecords: number } | { success: false; error: string } {
    const catCheck = this.db.exec("SELECT code FROM categories WHERE id = ?", [id]);
    const code = catCheck[0]?.values[0]?.[0] as string;
    if (code === '_deleted') return { success: false, error: '不能删除系统分类' };

    const countR = this.db.exec('SELECT COUNT(*) as cnt FROM records WHERE category_id = ?', [id]);
    const affectedRecords = (countR[0]?.values[0]?.[0] as number) || 0;

    const deletedR = this.db.exec("SELECT id FROM categories WHERE code = '_deleted'");
    const deletedId = deletedR[0]?.values[0]?.[0] as number;

    if (affectedRecords > 0) {
      this.db.run('UPDATE records SET category_id = ?, sub_category_id = NULL WHERE category_id = ?', [deletedId, id]);
    }
    this.db.run('DELETE FROM sub_categories WHERE category_id = ?', [id]);
    this.db.run('DELETE FROM categories WHERE id = ?', [id]);
    this.saveToIndexedDB();
    return { success: true, affectedRecords };
  }

  addSubCategory(params: { category_id: number; name: string }): { success: true; id: number } | { success: false; error: string } {
    const catCheck = this.db.exec('SELECT COUNT(*) as cnt FROM categories WHERE id = ?', [params.category_id]);
    if ((catCheck[0]?.values[0]?.[0] as number) === 0) return { success: false, error: '所属分类不存在' };

    this.db.run('INSERT INTO sub_categories (category_id, name) VALUES (?, ?)', [params.category_id, params.name]);
    const r = this.db.exec('SELECT last_insert_rowid() as id');
    this.saveToIndexedDB();
    return { success: true, id: (r[0]?.values[0]?.[0] as number) || 0 };
  }

  updateSubCategory(id: number, name: string): { success: true } | { success: false; error: string } {
    try {
      this.db.run('UPDATE sub_categories SET name = ? WHERE id = ?', [name, id]);
      this.saveToIndexedDB();
      return { success: true };
    } catch { return { success: false, error: '更新失败，请重试' }; }
  }

  deleteSubCategory(id: number): { success: true; affectedRecords: number } | { success: false; error: string } {
    const countR = this.db.exec('SELECT COUNT(*) as cnt FROM records WHERE sub_category_id = ?', [id]);
    const affectedRecords = (countR[0]?.values[0]?.[0] as number) || 0;
    if (affectedRecords > 0) {
      this.db.run('UPDATE records SET sub_category_id = NULL WHERE sub_category_id = ?', [id]);
    }
    this.db.run('DELETE FROM sub_categories WHERE id = ?', [id]);
    this.saveToIndexedDB();
    return { success: true, affectedRecords };
  }

  getMonthlyStats(year: number, month: number): MonthlyStats {
    const m = String(month).padStart(2, '0');
    const tr = this.db.exec(
      `SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM records
       WHERE strftime('%Y',record_date)=? AND strftime('%m',record_date)=?`,
      [String(year), m]
    );
    const total = (tr[0]?.values[0]?.[0] as number) || 0;
    const count = (tr[0]?.values[0]?.[1] as number) || 0;

    const cr = this.db.exec(
      `SELECT c.id, c.name, c.icon, c.code, COALESCE(SUM(r.amount),0) as total
       FROM categories c
       LEFT JOIN records r ON c.id=r.category_id AND strftime('%Y',r.record_date)=? AND strftime('%m',r.record_date)=?
       GROUP BY c.id ORDER BY total DESC`,
      [String(year), m]
    );
    const daysInMonth = new Date(year, month, 0).getDate();
    return { total, count, dailyAvg: count > 0 ? total / daysInMonth : 0, categoryStats: this.rowsToObjects<CategoryStat>(cr) };
  }

  getMonthlyTrend(months: number = 6): TrendItem[] {
    const result: TrendItem[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mr = this.db.exec(
        `SELECT COALESCE(SUM(amount),0) as total FROM records WHERE strftime('%Y',record_date)=? AND strftime('%m',record_date)=?`,
        [String(y), String(m).padStart(2, '0')]
      );
      result.push({ year: y, month: m, label: `${y}年${m}月`, total: (mr[0]?.values[0]?.[0] as number) || 0 });
    }
    return result;
  }
}
