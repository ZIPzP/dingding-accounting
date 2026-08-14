/**
 * 青狐伙伴 — 应用吉祥物虚拟宠物
 * 使用应用赚「狐粮」，喂食让它成长进化（幼狐 → 青狐 → 星狐）
 * 状态保存在 localStorage，事件通过全局总线自动投喂
 */

export interface FoxState {
  food: number;      // 狐粮
  mood: number;      // 心情 0-100
  fedCount: number;  // 累计喂食次数
  level: number;     // 1-10
  lastSeen: number;  // 最后时间戳
  bornAt: number;
}

const KEY = 'qinggu-fox';
const MOOD_DECAY_PER_HOUR = 6;

function defaultState(): FoxState {
  return { food: 20, mood: 85, fedCount: 0, level: 1, lastSeen: Date.now(), bornAt: Date.now() };
}

let state: FoxState | null = null;

function getState(): FoxState {
  if (!state) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.food === 'number') {
          const next: FoxState = { ...defaultState(), ...parsed };
          state = next;
          return next;
        }
      }
    } catch { /* noop */ }
    state = defaultState();
  }
  return state;
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(getState()));
  } catch { /* noop */ }
}

/** 心情随时间衰减 */
function applyDecay(): FoxState {
  const s = getState();
  const now = Date.now();
  const hours = Math.max(0, (now - s.lastSeen) / 3600000);
  if (hours >= 1) {
    s.mood = Math.max(0, Math.round(s.mood - hours * MOOD_DECAY_PER_HOUR));
    s.lastSeen = now;
    persist();
  }
  return s;
}

/* 事件 → 狐粮映射 */
const EVENT_FOOD: Record<string, number> = {
  record_expense: 1,
  record_income: 1,
  pomodoro_total: 2,
  habit_streak7: 3,
  habit_streak21: 8,
  wish_created: 1,
  wish_done: 5,
  countdown_created: 1,
  noise_played: 1,
  game_stack10: 3,
  game_2048_512: 3,
  game_snake_100: 3,
  budget_ok: 4,
};

/** 喂食（-n 狐粮，+心情，累计喂食升级） */
export function foxFeed(n = 10): { ok: boolean; msg: string } {
  const s = applyDecay();
  if (s.food < n) {
    return { ok: false, msg: '狐粮不够啦，去记账/打卡/玩游戏赚狐粮吧！' };
  }
  s.food -= n;
  s.mood = Math.min(100, s.mood + 14);
  s.fedCount += 1;
  s.level = Math.min(10, 1 + Math.floor(s.fedCount / 6));
  s.lastSeen = Date.now();
  persist();
  return { ok: true, msg: '吧唧吧唧…好吃！' };
}

/** 摸摸头 */
export function foxPet(): void {
  const s = applyDecay();
  s.mood = Math.min(100, s.mood + 4);
  s.lastSeen = Date.now();
  persist();
}

export function getFoxState(): FoxState {
  return applyDecay();
}

/** 等级称号 */
export function foxLevelName(level: number): string {
  if (level >= 10) return '星狐';
  if (level >= 7) return '星灵狐';
  if (level >= 4) return '青狐';
  return '幼狐';
}

/** 随机口头禅（按心情选择） */
export function foxQuip(): string {
  const s = applyDecay();
  if (s.food <= 0 && s.mood < 30) return '好饿…去记一笔账给我赚点狐粮吧 🥺';
  if (s.food <= 0) return '狐粮见底啦，去玩一局游戏就有吃的了~';
  if (s.mood < 40) return '陪我玩一会儿嘛…摸摸头也行！';
  const quips = [
    '今天也要好好生活哦！',
    '记账让我很安心，你呢？',
    '专注的人最帅了！',
    '无聊的时候，来找我玩呀~',
    '把心愿写下来，就会实现哦！',
    '你今天的账本真好看！',
    '记得喝水、记得休息~',
    '白噪音助眠，亲测有效！',
    '坚持打卡的人，运气不会差！',
    '你的年度报告一定很精彩！',
  ];
  return quips[Math.floor(Math.random() * quips.length)];
}

/* 全局事件监听：应用内任何成就事件自动投喂狐粮（模块加载即生效） */
(function register() {
  try {
    window.addEventListener('qinggu-ach-event', ((e: Event) => {
      const detail = (e as CustomEvent<{ event: string; n: number }>).detail;
      if (!detail) return;
      const food = EVENT_FOOD[detail.event];
      if (food) {
        const s = getState();
        s.food += food * detail.n;
        s.mood = Math.min(100, s.mood + 2);
        s.lastSeen = Date.now();
        persist();
      }
    }) as EventListener);
  } catch { /* noop */ }
})();
