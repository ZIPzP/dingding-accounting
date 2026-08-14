/**
 * 成就系统 — 全站统一的徽章收集
 * 数据保存在 localStorage，事件驱动解锁，解锁时弹出专属提示
 */

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  target: number;
  group: '记账' | '工具' | '游戏';
  event: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  /* ---- 记账 ---- */
  { id: 'first_expense', name: '第一笔开销', icon: '💸', desc: '记下第一笔支出', target: 1, group: '记账', event: 'record_expense' },
  { id: 'first_income', name: '第一桶金', icon: '💰', desc: '记下第一笔收入', target: 1, group: '记账', event: 'record_income' },
  { id: 'records_10', name: '记账新人', icon: '📒', desc: '累计记账 10 笔', target: 10, group: '记账', event: 'record_total' },
  { id: 'records_50', name: '记账达人', icon: '📚', desc: '累计记账 50 笔', target: 50, group: '记账', event: 'record_total' },
  { id: 'records_100', name: '账本大师', icon: '🏆', desc: '累计记账 100 笔', target: 100, group: '记账', event: 'record_total' },
  { id: 'big_spend', name: '大手笔', icon: '💎', desc: '单笔支出 ≥ 1000 元', target: 1, group: '记账', event: 'big_spend' },
  { id: 'budget_ok', name: '预算守门员', icon: '🛡️', desc: '本月支出控制在预算内', target: 1, group: '记账', event: 'budget_ok' },
  /* ---- 工具 ---- */
  { id: 'pomodoro_1', name: '开始专注', icon: '🍅', desc: '完成第一个番茄钟', target: 1, group: '工具', event: 'pomodoro_total' },
  { id: 'pomodoro_10', name: '专注大师', icon: '🎯', desc: '累计完成 10 个番茄钟', target: 10, group: '工具', event: 'pomodoro_total' },
  { id: 'habit_7', name: '习惯养成', icon: '🔥', desc: '任一习惯连续打卡 7 天', target: 1, group: '工具', event: 'habit_streak7' },
  { id: 'habit_21', name: '习惯达人', icon: '🌋', desc: '任一习惯连续打卡 21 天', target: 1, group: '工具', event: 'habit_streak21' },
  { id: 'wish_created', name: '心愿启程', icon: '🎯', desc: '许下第一个心愿', target: 1, group: '工具', event: 'wish_created' },
  { id: 'wish_done', name: '梦想成真', icon: '🎉', desc: '实现一个心愿', target: 1, group: '工具', event: 'wish_done' },
  { id: 'countdown_1', name: '时光记录者', icon: '⏳', desc: '添加第一个倒数日', target: 1, group: '工具', event: 'countdown_created' },
  { id: 'noise_1', name: '静心时刻', icon: '🌧️', desc: '用过一次白噪音', target: 1, group: '工具', event: 'noise_played' },
  /* ---- 游戏 ---- */
  { id: 'game_stack10', name: '叠塔新手', icon: '🧊', desc: '叠叠高达到 10 层', target: 1, group: '游戏', event: 'game_stack10' },
  { id: 'game_2048_512', name: '数字猎手', icon: '🔢', desc: '2048 合成 512 方块', target: 1, group: '游戏', event: 'game_2048_512' },
  { id: 'game_snake_100', name: '贪吃好手', icon: '🐍', desc: '贪吃蛇单局 100 分', target: 1, group: '游戏', event: 'game_snake_100' },
];

interface AchievementState {
  counts: Record<string, number>;
  unlocked: Record<string, string>; // id -> 解锁日期
}

const KEY = 'qinggu-achievements';

function load(): AchievementState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          counts: parsed.counts || {},
          unlocked: parsed.unlocked || {},
        };
      }
    }
  } catch { /* noop */ }
  return { counts: {}, unlocked: {} };
}

let state: AchievementState | null = null;

function getState(): AchievementState {
  if (!state) state = load();
  return state;
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(getState()));
  } catch { /* noop */ }
}

/** 弹窗提示 */
function showToast(def: AchievementDef): void {
  try {
    const toast = document.createElement('div');
    toast.className = 'achieve-toast';
    toast.innerHTML = `
      <span class="achieve-toast-icon">${def.icon}</span>
      <span class="achieve-toast-body">
        <b>成就解锁!</b>
        <i>${def.name} · ${def.desc}</i>
      </span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 30);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
    try {
      if ('vibrate' in navigator) navigator.vibrate(40);
    } catch { /* noop */ }
  } catch { /* noop */ }
}

function checkAndUnlock(): void {
  const s = getState();
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  for (const def of ACHIEVEMENTS) {
    if (s.unlocked[def.id]) continue;
    if ((s.counts[def.event] || 0) >= def.target) {
      s.unlocked[def.id] = today;
      changed = true;
      showToast(def);
    }
  }
  if (changed) persist();
}

/** 触发成就事件（计数累加） */
export function achEmit(event: string, n = 1): void {
  const s = getState();
  s.counts[event] = (s.counts[event] || 0) + n;
  persist();
  checkAndUnlock();
}

/** 直接设置事件计数为 max(当前, 值)，用于启动时从已有数据初始化 */
export function achSetMax(event: string, value: number): void {
  const s = getState();
  s.counts[event] = Math.max(s.counts[event] || 0, value);
  persist();
  checkAndUnlock();
}

/** 读取成就状态（成就页展示用） */
export function achGetState(): AchievementState {
  return getState();
}

export function achUnlockedCount(): number {
  return Object.keys(getState().unlocked).length;
}

/** 刷新（从外部存储重读） */
export function achRefresh(): void {
  state = load();
}
