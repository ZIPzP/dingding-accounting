/**
 * 月度预算服务
 * 数据保存在浏览器 localStorage（与账单数据分离，轻量配置）
 */
export interface BudgetConfig {
  /** 每月支出预算金额（元），0 或空表示未设置 */
  amount: number;
}

const KEY = 'qinggu-budget';

export function getBudget(): BudgetConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.amount === 'number' && parsed.amount >= 0) {
        return { amount: parsed.amount };
      }
    }
  } catch { /* noop */ }
  return { amount: 0 };
}

export function setBudget(amount: number): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ amount: amount || 0 }));
  } catch { /* noop */ }
}

/** 预算使用进度 0-1（未设置预算时返回 0） */
export function budgetProgress(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(1, spent / budget);
}

/** 预算状态：safe 正常 / warn 接近 / over 超支 / none 未设置 */
export function budgetStatus(spent: number, budget: number): 'none' | 'safe' | 'warn' | 'over' {
  if (budget <= 0) return 'none';
  if (spent >= budget) return 'over';
  if (spent >= budget * 0.8) return 'warn';
  return 'safe';
}
