/**
 * 首页 — 2026 版落地页
 * 极光 Hero + 真实数据条 + 近 6 月趋势 + 预算进度
 * + 游戏 Bento 网格 + 生活工具 + 特性条 + 页脚
 * 全部视觉由 CSS 变量驱动，随主题切换自动适配
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconSnake, IconTetris, Icon2048,
  IconMine, IconBreakout, IconWhackAMole, IconTicTacToe,
  IconBook, IconRight, IconZap, IconLogo,
  IconPlusCircle, IconHourglass, IconTimer, IconNote, IconTools,
} from '../components/Icons';
import { api } from '../services/api';
import { getBudget, budgetProgress, budgetStatus } from '../services/budget';

interface GameItem {
  key: string;
  name: string;
  icon: React.FC<{ size?: number; className?: string }>;
  desc: string;
  route: string;
  color: string;
  tag: string;
}

const games: GameItem[] = [
  { key: 'snake', name: '贪吃蛇', icon: IconSnake, desc: '经典贪吃蛇，排行榜 + 多彩皮肤', route: '/game/snake', color: '#34d399', tag: '怀旧经典' },
  { key: 'tetris', name: '俄罗斯方块', icon: IconTetris, desc: '七种方块，挑战高分', route: '/game/tetris', color: '#38bdf8', tag: '消除益智' },
  { key: '2048', name: '2048', icon: Icon2048, desc: '滑动合并数字', route: '/game/2048', color: '#fbbf24', tag: '数字策略' },
  { key: 'minesweeper', name: '扫雷', icon: IconMine, desc: '推理排雷，初/中/高级', route: '/game/minesweeper', color: '#fb923c', tag: '逻辑推理' },
  { key: 'breakout', name: '打砖块', icon: IconBreakout, desc: '弹球清砖，关卡推进', route: '/game/breakout', color: '#f472b6', tag: '动作反应' },
  { key: 'whackamole', name: '打地鼠', icon: IconWhackAMole, desc: '30 秒限时，眼疾手快', route: '/game/whackamole', color: '#f87171', tag: '限时挑战' },
  { key: 'tictactoe', name: '井字棋', icon: IconTicTacToe, desc: '人机对战，三子连珠', route: '/game/tictactoe', color: '#a78bfa', tag: '策略对战' },
];

const toolCards = [
  { key: 'bookkeeping', name: '收支记账', icon: IconBook, desc: '分类统计 · 预算管理 · 数据导出', route: '/bills', color: '#06b6d4' },
  { key: 'countdown', name: '倒数日', icon: IconHourglass, desc: '重要日子，一天不落', route: '/tools/countdown', color: '#ec4899' },
  { key: 'pomodoro', name: '番茄钟', icon: IconTimer, desc: '专注 25 分钟，效率翻倍', route: '/tools/pomodoro', color: '#f59e0b' },
  { key: 'notes', name: '备忘录', icon: IconNote, desc: '灵感与待办，随手记录', route: '/tools/notes', color: '#10b981' },
];

const features = [
  { title: '随时解闷', desc: '无聊时刻，打开就能玩' },
  { title: '数据安全', desc: '本地存储，绝不上传' },
  { title: '完全离线', desc: '不依赖任何外部服务' },
  { title: '开源免费', desc: '代码开源，永久免费' },
];

/** 尊重系统的"减弱动态效果"设置 */
function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** 数字滚动动画 Hook */
function useCountUp(target: number | null, duration = 900): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(frameRef.current);
    if (target === null || target <= 0 || prefersReducedMotion()) {
      setValue(target ?? 0);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(target * eased);
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

/** 滚动渐显动画 */
function useReveal(): void {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('revealed'));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/** 卡片聚光灯跟随鼠标 */
function spotlight(e: React.MouseEvent<HTMLElement>): void {
  if (prefersReducedMotion()) return;
  const card = (e.target as HTMLElement).closest<HTMLElement>('[data-spotlight]');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  card.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

function formatMoney(v: number): string {
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 迷你趋势图（纯 SVG，无图表库依赖） */
const Sparkline: React.FC<{ data: TrendItem[] }> = ({ data }) => {
  const w = 360;
  const h = 100;
  const pad = 10;

  /* 数据为空时显示占位（避免访问不存在的点导致崩溃） */
  if (!data || data.length === 0) {
    return (
      <div className="sparkline-empty">
        <svg viewBox={`0 0 ${w} ${h}`} className="sparkline" preserveAspectRatio="none" aria-hidden>
          <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="var(--qg-border)" strokeWidth="2" strokeDasharray="6 6" />
        </svg>
        <span>记几笔账，这里就会画出收支曲线 📈</span>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => Math.max(d.total, d.incomeTotal)), 1);
  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(data.length - 1, 1);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const expensePts = data.map((d, i) => [x(i), y(d.total)] as const);
  const incomePts = data.map((d, i) => [x(i), y(d.incomeTotal)] as const);
  const first = expensePts[0] ?? [pad, h - pad];
  const last = expensePts[expensePts.length - 1] ?? first;
  const areaPath = `M ${first[0]},${first[1]} ${expensePts
    .map(([px, py]) => `L ${px},${py}`)
    .join(' ')} L ${last[0]},${h - pad} L ${first[0]},${h - pad} Z`;
  const expenseLine = expensePts.map(([px, py]) => `${px},${py}`).join(' ');
  const incomeLine = incomePts.map(([px, py]) => `${px},${py}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sparkline" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="spark-expense" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark-expense)" />
      <polyline points={expenseLine} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={incomeLine} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {expensePts.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r="3" fill="var(--qg-card-bg)" stroke="#f43f5e" strokeWidth="2" />
      ))}
    </svg>
  );
};

interface LiveStats {
  monthTotal: number;
  monthIncome: number;
  balance: number;
  totalRecords: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const budget = getBudget();
  const loadedRef = useRef(false);

  useReveal();

  const loadData = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        const now = new Date();
        const [monthly, trendData, list] = await Promise.all([
          api.getMonthlyStats(now.getFullYear(), now.getMonth() + 1),
          api.getMonthlyTrend(6),
          api.getRecords({ page: 1, pageSize: 1 }),
        ]);
        setLiveStats({
          monthTotal: monthly.total,
          monthIncome: monthly.incomeTotal,
          balance: monthly.balance,
          totalRecords: list.total,
        });
        setTrend(trendData);
      } catch {
        /* 数据库未就绪时保持占位显示 */
      }
    })();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monthTotalAnim = useCountUp(liveStats?.monthTotal ?? null);
  const monthIncomeAnim = useCountUp(liveStats?.monthIncome ?? null);
  const totalRecordsAnim = useCountUp(liveStats?.totalRecords ?? null);

  const stats = [
    { label: '本月支出', value: liveStats ? `¥${formatMoney(monthTotalAnim)}` : '—', cls: 'landing-stat-expense' },
    { label: '本月收入', value: liveStats ? `¥${formatMoney(monthIncomeAnim)}` : '—', cls: 'landing-stat-income' },
    { label: '本月结余', value: liveStats ? `${liveStats.balance >= 0 ? '+' : ''}¥${formatMoney(liveStats.balance)}` : '—', cls: liveStats && liveStats.balance >= 0 ? 'landing-stat-income' : 'landing-stat-expense' },
    { label: '累计账单', value: liveStats ? `${Math.round(totalRecordsAnim)} 笔` : '—', cls: '' },
  ];

  const budgetProg = liveStats ? budgetProgress(liveStats.monthTotal, budget.amount) : 0;
  const budgetState = liveStats ? budgetStatus(liveStats.monthTotal, budget.amount) : 'none';

  return (
    <div className="landing" onMouseMove={spotlight}>
      {/* ======== Hero 区域（极光动效） ======== */}
      <section className="landing-hero reveal">
        <div className="aurora">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
        </div>
        <div className="landing-dots" />
        <div className="landing-hero-inner">
          <div className="landing-badge">
            <IconZap size={13} />
            BOREDOM BUSTER · 2026
          </div>
          <h1 className="landing-title">
            无聊<span className="landing-title-grad">救星</span>
          </h1>
          <div className="landing-subtitle">你的离线时光伙伴</div>
          <p className="landing-desc">
            7 款经典小游戏 + 收支记账 + 生活工具，
            把无聊时光变成快乐时光。数据全部保存在本地，断网也能玩，用着更安心。
          </p>
          <div className="landing-ctas">
            <button className="landing-btn landing-btn-primary" onClick={() => navigate('/game')}>
              立即体验
              <IconRight size={16} />
            </button>
            <button className="landing-btn landing-btn-ghost" onClick={() => navigate('/tools')}>
              <IconTools size={16} />
              生活工具
            </button>
          </div>
        </div>
      </section>

      {/* ======== 数据条（真实账本数据 + 趋势图） ======== */}
      <section className="landing-stats reveal">
        {stats.map((s) => (
          <div className="landing-stat" key={s.label}>
            <div className={`landing-stat-value ${s.cls}`}>{s.value}</div>
            <div className="landing-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="landing-trend reveal" data-spotlight>
        <div className="landing-trend-head">
          <div>
            <div className="landing-trend-title">近 6 个月收支</div>
            <div className="landing-trend-sub">红色为支出，绿色为收入</div>
          </div>
          <div className="landing-trend-legend">
            <span className="legend-item"><i className="legend-dot" style={{ background: '#f43f5e' }} />支出</span>
            <span className="legend-item"><i className="legend-dot" style={{ background: '#10b981' }} />收入</span>
          </div>
        </div>
        <div className="landing-trend-chart">
          <Sparkline data={trend} />
          <div className="landing-trend-labels">
            {trend.map((t, i) => (
              <span key={i} className={i === trend.length - 1 ? 'current' : ''}>{t.month}月</span>
            ))}
          </div>
        </div>
        {budget.amount > 0 && liveStats && (
          <div className="landing-budget">
            <div className="landing-budget-head">
              <span>本月预算</span>
              <span className={`landing-budget-state state-${budgetState}`}>
                {{ none: '未设置', safe: '预算充足', warn: '接近上限', over: '已超支' }[budgetState]}
              </span>
            </div>
            <div className="landing-budget-bar">
              <div
                className={`landing-budget-fill fill-${budgetState}`}
                style={{ width: `${Math.round(budgetProg * 100)}%` }}
              />
            </div>
            <div className="landing-budget-nums">
              <span>已用 ¥{formatMoney(liveStats.monthTotal)}</span>
              <span>预算 ¥{formatMoney(budget.amount)}</span>
            </div>
          </div>
        )}
      </section>

      {/* ======== 生活工具 ======== */}
      <section className="landing-section reveal">
        <div className="landing-section-head">
          <h2 className="landing-section-title">生活工具</h2>
          <p className="landing-section-sub">记账、倒数日、番茄钟、备忘录 —— 离线可用，数据本地保存</p>
        </div>
        <div className="landing-tools">
          {toolCards.map((t) => {
            const TIcon = t.icon;
            return (
              <div
                key={t.key}
                className="landing-card landing-tool-card"
                style={{ '--gc': t.color } as React.CSSProperties}
                onClick={() => navigate(t.route)}
                data-spotlight
              >
                <div className="landing-card-top">
                  <span className="landing-card-icon" style={{ color: t.color }}>
                    <TIcon size={26} />
                  </span>
                </div>
                <div className="landing-card-name">{t.name}</div>
                <div className="landing-card-desc">{t.desc}</div>
                <IconRight size={16} className="landing-card-arrow" />
              </div>
            );
          })}
        </div>
      </section>

      {/* ======== 游戏区域（Bento 网格） ======== */}
      <section className="landing-section reveal">
        <div className="landing-section-head">
          <h2 className="landing-section-title">经典小游戏</h2>
          <p className="landing-section-sub">经典怀旧，即开即玩，所有进度自动保存</p>
        </div>

        <div className="landing-games">
          {(() => {
            const g0 = games[0];
            const G0 = g0.icon;
            const g1 = games[1];
            const G1 = g1.icon;
            return (
              <>
                <div className="landing-card landing-card-lg" style={{ '--gc': g0.color } as React.CSSProperties} onClick={() => navigate(g0.route)} data-spotlight>
                  <div className="landing-card-top">
                    <span className="landing-card-icon" style={{ color: g0.color }}>
                      <G0 size={26} />
                    </span>
                    <span className="landing-card-tag">{g0.tag}</span>
                  </div>
                  <div className="landing-card-name">{g0.name}</div>
                  <div className="landing-card-desc">{g0.desc}</div>
                  <IconRight size={16} className="landing-card-arrow" />
                </div>
                <div className="landing-card landing-card-lg" style={{ '--gc': g1.color } as React.CSSProperties} onClick={() => navigate(g1.route)} data-spotlight>
                  <div className="landing-card-top">
                    <span className="landing-card-icon" style={{ color: g1.color }}>
                      <G1 size={26} />
                    </span>
                    <span className="landing-card-tag">{g1.tag}</span>
                  </div>
                  <div className="landing-card-name">{g1.name}</div>
                  <div className="landing-card-desc">{g1.desc}</div>
                  <IconRight size={16} className="landing-card-arrow" />
                </div>
              </>
            );
          })()}

          {games.slice(2, 6).map((g) => {
            const GI = g.icon;
            return (
              <div key={g.key} className="landing-card landing-card-sm" style={{ '--gc': g.color } as React.CSSProperties} onClick={() => navigate(g.route)} data-spotlight>
                <span className="landing-card-icon" style={{ color: g.color }}>
                  <GI size={24} />
                </span>
                <div className="landing-card-sm-body">
                  <div className="landing-card-name">{g.name}</div>
                  <div className="landing-card-desc">{g.desc}</div>
                </div>
                <IconRight size={14} className="landing-card-arrow" />
              </div>
            );
          })}

          {(() => {
            const g6 = games[6];
            const G6 = g6.icon;
            return (
              <div className="landing-card landing-card-wide" style={{ '--gc': g6.color } as React.CSSProperties} onClick={() => navigate(g6.route)} data-spotlight>
                <span className="landing-card-icon" style={{ color: g6.color }}>
                  <G6 size={24} />
                </span>
                <div className="landing-card-sm-body">
                  <div className="landing-card-name">{g6.name}</div>
                  <div className="landing-card-desc">{g6.desc}</div>
                </div>
                <span className="landing-card-tag">{g6.tag}</span>
                <IconRight size={14} className="landing-card-arrow" />
              </div>
            );
          })()}
        </div>
      </section>

      {/* ======== 快捷记账 CTA ======== */}
      <section className="landing-section reveal">
        <div className="landing-accounting">
          <div className="landing-acc-card" onClick={() => navigate('/add')} data-spotlight>
            <div className="landing-acc-icon">
              <IconPlusCircle size={30} />
            </div>
            <div className="landing-acc-title">记一笔，只要 3 秒</div>
            <p className="landing-acc-desc">
              支出、收入都能记，九大分类体系，
              支持自定义分类与月度预算。
            </p>
            <button className="landing-btn landing-btn-primary">
              开始记账
              <IconRight size={16} />
            </button>
          </div>

          <div className="landing-acc-list">
            {[
              { title: '收支统计', desc: '饼图 + 趋势图，一目了然', route: '/stats' },
              { title: '账单明细', desc: '按月筛选，搜索备注', route: '/bills' },
              { title: '数据备份', desc: 'CSV 导出 + 数据库备份', route: '/settings' },
            ].map((f) => (
              <div className="landing-acc-feature" key={f.title} onClick={() => navigate(f.route)} data-spotlight>
                <div className="landing-acc-feature-icon">
                  <IconZap size={18} />
                </div>
                <div className="landing-acc-feature-body">
                  <div className="landing-acc-feature-name">{f.title}</div>
                  <div className="landing-acc-feature-desc">{f.desc}</div>
                </div>
                <IconRight size={14} className="landing-card-arrow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 特性条 ======== */}
      <section className="landing-features reveal">
        {features.map((f) => (
          <div className="landing-feature" key={f.title}>
            <div className="landing-feature-title">{f.title}</div>
            <div className="landing-feature-desc">{f.desc}</div>
          </div>
        ))}
      </section>

      {/* ======== 页脚 ======== */}
      <footer className="landing-footer">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            <IconLogo size={20} />
            青孤 · 无聊救星
          </div>
          <div className="landing-footer-links">
            <span onClick={() => navigate('/settings')}>设置</span>
            <span onClick={() => navigate('/tools')}>工具</span>
            <span onClick={() => navigate('/game')}>游戏</span>
            <span onClick={() => navigate('/stats')}>统计</span>
          </div>
        </div>
        <div className="landing-footer-copy">2026 青孤项目 · 无聊时刻，有青孤相伴</div>
      </footer>
    </div>
  );
};

export default HomePage;
