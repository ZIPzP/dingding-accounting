/**
 * 数据库模块
 * 使用 sql.js（SQLite 的 WebAssembly 版本）管理本地数据库
 * 数据持久化到磁盘文件，每次写操作后自动保存
 */
import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic, type SqlValue } from 'sql.js';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: SqlJsDatabase;
let SQL: SqlJsStatic;
let dbPath: string;

// ==================== 数据表结构 ====================

const CREATE_TABLES_SQL = `
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
`;

// ==================== 预置分类数据 ====================

interface CategorySeed {
  name: string;
  icon: string;
  code: string;
  subs: string[];
}

const PRESET_CATEGORIES: CategorySeed[] = [
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

// ==================== 辅助函数 ====================

/** 将 sql.js exec 结果转为对象数组 */
function rowsToObjects<T>(result: { columns: string[]; values: unknown[][] }[]): T[] {
  if (result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

/** 保存数据库到磁盘 */
function persist(): void {
  try {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error('数据库保存失败:', err);
  }
}

// ==================== 数据库初始化 ====================

export async function initDatabase(): Promise<void> {
  dbPath = path.join(app.getPath('userData'), 'accounting.db');
  console.log('数据库路径:', dbPath);

  SQL = await initSqlJs();

  // 加载已有数据库或创建新库
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('已加载现有数据库');
  } else {
    db = new SQL.Database();
    console.log('创建新数据库');
  }

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON');

  // 建表
  db.run(CREATE_TABLES_SQL);
  persist();

  // 预置分类（仅首次）
  seedCategories();

  // 确保系统兜底分类存在
  ensureSystemCategory();
}

function seedCategories(): void {
  const result = db.exec('SELECT COUNT(*) as cnt FROM categories');
  const count = result[0]?.values[0]?.[0] as number;
  if (count > 0) return;

  for (const cat of PRESET_CATEGORIES) {
    db.run('INSERT INTO categories (name, icon, code) VALUES (?, ?, ?)', [
      cat.name,
      cat.icon,
      cat.code,
    ]);
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const categoryId = idResult[0]?.values[0]?.[0] as number;

    for (const subName of cat.subs) {
      db.run('INSERT INTO sub_categories (category_id, name) VALUES (?, ?)', [
        categoryId,
        subName,
      ]);
    }
  }
  persist();
  console.log('✅ 预置分类数据已写入');
}

/** 确保系统兜底分类存在（用于存放被删除分类的旧记录） */
function ensureSystemCategory(): void {
  const existing = db.exec("SELECT id FROM categories WHERE code = '_deleted'");
  if (existing.length > 0 && existing[0].values.length > 0) return;

  db.run("INSERT INTO categories (name, icon, code) VALUES ('已删除', '🗑️', '_deleted')");
  persist();
  console.log('✅ 系统兜底分类已创建');
}

// ==================== 数据查询与操作 ====================

// 获取所有一级分类（含二级分类，排除系统分类）
export function getCategories(): CategoryWithSubs[] {
  const catResult = db.exec("SELECT * FROM categories WHERE code != '_deleted' ORDER BY id");
  const subResult = db.exec('SELECT * FROM sub_categories ORDER BY id');

  const categories = rowsToObjects<Category>(catResult);
  const subs = rowsToObjects<SubCategory>(subResult);

  return categories.map((cat) => ({
    ...cat,
    subs: subs.filter((s) => s.category_id === cat.id),
  }));
}

// 获取全部一级分类（含系统分类，供管理页使用）
export function getAllCategories(): CategoryWithSubs[] {
  const catResult = db.exec('SELECT * FROM categories ORDER BY id');
  const subResult = db.exec('SELECT * FROM sub_categories ORDER BY id');

  const categories = rowsToObjects<Category>(catResult);
  const subs = rowsToObjects<SubCategory>(subResult);

  return categories.map((cat) => ({
    ...cat,
    subs: subs.filter((s) => s.category_id === cat.id),
  }));
}

// ==================== 分类管理 ====================

// 新增一级分类
export function addCategory(params: {
  name: string;
  icon: string;
  code: string;
}): { success: true; id: number } | { success: false; error: string } {
  // 校验代码格式
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(params.code)) {
    return { success: false, error: '分类代码只能包含字母、数字和下划线，且必须以字母或下划线开头' };
  }
  try {
    db.run('INSERT INTO categories (name, icon, code) VALUES (?, ?, ?)', [
      params.name,
      params.icon,
      params.code,
    ]);
    const result = db.exec('SELECT last_insert_rowid() as id');
    persist();
    return { success: true, id: (result[0]?.values[0]?.[0] as number) || 0 };
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return { success: false, error: '分类代码已存在，请换一个' };
    }
    return { success: false, error: '添加失败，请重试' };
  }
}

// 编辑一级分类
export function updateCategory(
  id: number,
  params: { name: string; icon: string }
): { success: true } | { success: false; error: string } {
  try {
    db.run('UPDATE categories SET name = ?, icon = ? WHERE id = ?', [
      params.name,
      params.icon,
      id,
    ]);
    persist();
    return { success: true };
  } catch {
    return { success: false, error: '更新失败，请重试' };
  }
}

// 删除一级分类
export function deleteCategory(id: number): {
  success: true;
  affectedRecords: number;
} | { success: false; error: string } {
  // 不允许删除系统兜底分类
  const catCheck = db.exec("SELECT code FROM categories WHERE id = ?", [id]);
  const code = catCheck[0]?.values[0]?.[0] as string;
  if (code === '_deleted') {
    return { success: false, error: '不能删除系统分类' };
  }

  // 计数受影响记录
  const countResult = db.exec('SELECT COUNT(*) as cnt FROM records WHERE category_id = ?', [id]);
  const affectedRecords = (countResult[0]?.values[0]?.[0] as number) || 0;

  // 获取兜底分类 ID
  const deletedResult = db.exec("SELECT id FROM categories WHERE code = '_deleted'");
  const deletedId = deletedResult[0]?.values[0]?.[0] as number;

  // 将已有记录迁移到兜底分类
  if (affectedRecords > 0) {
    db.run('UPDATE records SET category_id = ?, sub_category_id = NULL WHERE category_id = ?', [
      deletedId,
      id,
    ]);
  }

  // 删除子分类
  db.run('DELETE FROM sub_categories WHERE category_id = ?', [id]);

  // 删除分类本身
  db.run('DELETE FROM categories WHERE id = ?', [id]);

  persist();
  return { success: true, affectedRecords };
}

// 新增子分类
export function addSubCategory(params: {
  category_id: number;
  name: string;
}): { success: true; id: number } | { success: false; error: string } {
  // 验证父分类存在
  const catCheck = db.exec('SELECT COUNT(*) as cnt FROM categories WHERE id = ?', [
    params.category_id,
  ]);
  if ((catCheck[0]?.values[0]?.[0] as number) === 0) {
    return { success: false, error: '所属分类不存在' };
  }

  db.run('INSERT INTO sub_categories (category_id, name) VALUES (?, ?)', [
    params.category_id,
    params.name,
  ]);
  const result = db.exec('SELECT last_insert_rowid() as id');
  persist();
  return { success: true, id: (result[0]?.values[0]?.[0] as number) || 0 };
}

// 编辑子分类
export function updateSubCategory(
  id: number,
  name: string
): { success: true } | { success: false; error: string } {
  try {
    db.run('UPDATE sub_categories SET name = ? WHERE id = ?', [name, id]);
    persist();
    return { success: true };
  } catch {
    return { success: false, error: '更新失败，请重试' };
  }
}

// 删除子分类
export function deleteSubCategory(id: number): {
  success: true;
  affectedRecords: number;
} | { success: false; error: string } {
  // 计数受影响记录
  const countResult = db.exec('SELECT COUNT(*) as cnt FROM records WHERE sub_category_id = ?', [id]);
  const affectedRecords = (countResult[0]?.values[0]?.[0] as number) || 0;

  // 将已有记录的子分类置空
  if (affectedRecords > 0) {
    db.run('UPDATE records SET sub_category_id = NULL WHERE sub_category_id = ?', [id]);
  }

  db.run('DELETE FROM sub_categories WHERE id = ?', [id]);
  persist();
  return { success: true, affectedRecords };
}

// 添加记账记录
export function addRecord(params: {
  amount: number;
  record_date: string;
  category_id: number;
  sub_category_id?: number | null;
  note?: string;
}): number {
  db.run(
    `INSERT INTO records (amount, record_date, category_id, sub_category_id, note)
     VALUES (?, ?, ?, ?, ?)`,
    [
      params.amount,
      params.record_date,
      params.category_id,
      params.sub_category_id || null,
      params.note || null,
    ]
  );
  const result = db.exec('SELECT last_insert_rowid() as id');
  persist();
  return result[0]?.values[0]?.[0] as number;
}

// 更新记账记录
export function updateRecord(params: {
  id: number;
  amount: number;
  record_date: string;
  category_id: number;
  sub_category_id?: number | null;
  note?: string;
}): void {
  db.run(
    `UPDATE records
     SET amount = ?, record_date = ?, category_id = ?,
         sub_category_id = ?, note = ?,
         updated_at = datetime('now', 'localtime')
     WHERE id = ?`,
    [
      params.amount,
      params.record_date,
      params.category_id,
      params.sub_category_id || null,
      params.note || null,
      params.id,
    ]
  );
  persist();
}

// 删除记账记录
export function deleteRecord(id: number): void {
  db.run('DELETE FROM records WHERE id = ?', [id]);
  persist();
}

// 查询账单列表（支持筛选）
export function getRecords(params: {
  year?: number;
  month?: number;
  category_id?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): { records: RecordItem[]; total: number } {
  const conditions: string[] = [];
  const values: SqlValue[] = [];

  if (params.year) {
    conditions.push("strftime('%Y', record_date) = ?");
    values.push(String(params.year));
  }
  if (params.month) {
    conditions.push("strftime('%m', record_date) = ?");
    values.push(String(params.month).padStart(2, '0'));
  }
  if (params.category_id) {
    conditions.push('r.category_id = ?');
    values.push(params.category_id);
  }
  if (params.keyword) {
    conditions.push('r.note LIKE ?');
    values.push(`%${params.keyword}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  // 总数
  const countSql = `SELECT COUNT(*) as total FROM records r ${where}`;
  const countResult = db.exec(countSql, values);
  const total = (countResult[0]?.values[0]?.[0] as number) || 0;

  // 数据
  const dataSql = `
    SELECT r.*, c.name as category_name, c.icon as category_icon, c.code as category_code,
           s.name as sub_category_name
    FROM records r
    LEFT JOIN categories c ON r.category_id = c.id
    LEFT JOIN sub_categories s ON r.sub_category_id = s.id
    ${where}
    ORDER BY r.record_date DESC, r.id DESC
    LIMIT ? OFFSET ?
  `;

  const dataResult = db.exec(dataSql, [...values, pageSize, offset]);
  const records = rowsToObjects<RecordItem>(dataResult);

  return { records, total };
}

// 获取单条记录
export function getRecordById(id: number): RecordItem | undefined {
  const sql = `
    SELECT r.*, c.name as category_name, c.icon as category_icon, c.code as category_code,
           s.name as sub_category_name
    FROM records r
    LEFT JOIN categories c ON r.category_id = c.id
    LEFT JOIN sub_categories s ON r.sub_category_id = s.id
    WHERE r.id = ?
  `;
  const result = db.exec(sql, [id]);
  const rows = rowsToObjects<RecordItem>(result);
  return rows[0];
}

// 月度统计
export function getMonthlyStats(year: number, month: number): MonthlyStats {
  const monthStr = String(month).padStart(2, '0');

  // 当月总支出
  const totalResult = db.exec(
    `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
     FROM records
     WHERE strftime('%Y', record_date) = ? AND strftime('%m', record_date) = ?`,
    [String(year), monthStr]
  );
  const totalRow = totalResult[0]?.values[0] || [0, 0];
  const totalAmount = totalRow[0] as number;
  const totalCount = totalRow[1] as number;

  // 分类统计
  const catResult = db.exec(
    `SELECT c.id, c.name, c.icon, c.code, COALESCE(SUM(r.amount), 0) as total
     FROM categories c
     LEFT JOIN records r ON c.id = r.category_id
       AND strftime('%Y', r.record_date) = ?
       AND strftime('%m', r.record_date) = ?
     GROUP BY c.id
     ORDER BY total DESC`,
    [String(year), monthStr]
  );
  const categoryStats = rowsToObjects<CategoryStat>(catResult);

  // 当月天数
  const daysInMonth = new Date(year, month, 0).getDate();

  return {
    total: totalAmount,
    count: totalCount,
    dailyAvg: totalCount > 0 ? totalAmount / daysInMonth : 0,
    categoryStats,
  };
}

// 近 N 个月趋势
export function getMonthlyTrend(months: number = 6): TrendItem[] {
  const result: TrendItem[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthStr = String(month).padStart(2, '0');

    const trendResult = db.exec(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM records
       WHERE strftime('%Y', record_date) = ? AND strftime('%m', record_date) = ?`,
      [String(year), monthStr]
    );
    const total = (trendResult[0]?.values[0]?.[0] as number) || 0;

    result.push({
      year,
      month,
      label: `${year}年${month}月`,
      total,
    });
  }

  return result;
}

// 获取数据库文件路径（用于备份）
export function getDbPath(): string {
  return dbPath;
}

// 关闭数据库（应用退出时调用）
export function closeDatabase(): void {
  if (db) {
    persist();
    db.close();
  }
}

// ==================== 类型定义 ====================

export interface Category {
  id: number;
  name: string;
  icon: string;
  code: string;
}

export interface SubCategory {
  id: number;
  category_id: number;
  name: string;
}

export interface CategoryWithSubs extends Category {
  subs: SubCategory[];
}

export interface RecordItem {
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

export interface CategoryStat {
  id: number;
  name: string;
  icon: string;
  code: string;
  total: number;
}

export interface MonthlyStats {
  total: number;
  count: number;
  dailyAvg: number;
  categoryStats: CategoryStat[];
}

export interface TrendItem {
  year: number;
  month: number;
  label: string;
  total: number;
}
