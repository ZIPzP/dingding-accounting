/**
 * 年度账单报告 — 仪式感数据故事
 * 汇总全年收支，生成可复制的年度总结文案
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, message, Spin, Empty } from 'antd';
import { IconReport, IconLeft, IconRight, IconBook } from '../components/Icons';
import { api } from '../services/api';

interface ReportData {
  totalExpense: number;
  totalIncome: number;
  count: number;
  days: number;
  maxExpense: { amount: number; category: string; icon: string; date: string } | null;
  topCategory: { name: string; icon: string; total: number } | null;
  topMonth: { month: number; total: number } | null;
  monthTotals: { month: number; total: number; income: number }[];
}

/** 根据最烧钱分类生成年度称号 */
function taglineFor(data: ReportData | null): { title: string; emoji: string; desc: string } {
  if (!data || data.count === 0) {
    return { title: '极简主义者', emoji: '🍃', desc: '这一年还没留下账单痕迹，从今天开始记录生活吧' };
  }
  const map: Record<string, { title: string; emoji: string }> = {
    food: { title: '干饭达人', emoji: '🍜' },
    transport: { title: '在路上的人', emoji: '🚗' },
    shopping: { title: '购物车战士', emoji: '🛒' },
    housing: { title: '安居乐业', emoji: '🏠' },
    entertainment: { title: '快乐至上', emoji: '🎮' },
    health: { title: '养生大师', emoji: '💊' },
    education: { title: '终身学习者', emoji: '📚' },
    social: { title: '人情暖流', emoji: '🎁' },
    salary: { title: '搞钱小能手', emoji: '💰' },
  };
  const cat = data.topCategory;
  const base = cat ? map[catCodeOf(cat.name)] : undefined;
  return {
    title: base?.title ?? '生活的记录者',
    emoji: base?.emoji ?? '📓',
    desc: `这一年你记了 ${data.count} 笔账，最烧钱的是「${cat?.name ?? '未知'}」`,
  };
}

/** 通过分类名反查代码（用于称号映射） */
function catCodeOf(name: string): string {
  const map: Record<string, string> = {
    餐饮饮食: 'food', 交通出行: 'transport', 购物消费: 'shopping',
    住房居住: 'housing', 娱乐休闲: 'entertainment', 医疗健康: 'health',
    教育学习: 'education', 人情往来: 'social',
  };
  return map[name] ?? 'other';
}

function prefersReducedMotion(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** 数字滚动动画 */
function useCountUp(target: number, duration = 1000): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(frameRef.current);
    if (target <= 0 || prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return value;
}

const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AnnualReport: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [expenseAnim, setExpenseAnim] = useState(0);
  const [incomeAnim, setIncomeAnim] = useState(0);
  const [countAnim, setCountAnim] = useState(0);
  const [daysAnim, setDaysAnim] = useState(0);

  const load = useCallback(async (y: number) => {
    setLoading(true);
    try {
      const [trend, list] = await Promise.all([
        api.getMonthlyTrend(12),
        api.getRecords({ year: y, pageSize: 99999 }),
      ]);
      const yearTrend = trend.filter((t) => t.year === y);
      const records = list.records;

      let totalExpense = 0;
      let totalIncome = 0;
      const byCategory = new Map<number, { name: string; icon: string; total: number }>();
      const byMonth = new Map<number, number>();
      const dateSet = new Set<string>();
      let maxExpense: ReportData['maxExpense'] = null;

      for (const r of records) {
        if (r.type === 'income') {
          totalIncome += r.amount;
        } else {
          totalExpense += r.amount;
          const cur = byCategory.get(r.category_id) ?? { name: r.category_name, icon: r.category_icon, total: 0 };
          cur.total += r.amount;
          byCategory.set(r.category_id, cur);
          const m = Number(r.record_date.slice(5, 7));
          byMonth.set(m, (byMonth.get(m) ?? 0) + r.amount);
          if (!maxExpense || r.amount > maxExpense.amount) {
            maxExpense = { amount: r.amount, category: r.category_name, icon: r.category_icon, date: r.record_date };
          }
        }
        dateSet.add(r.record_date);
      }

      const topCategory = [...byCategory.values()].sort((a, b) => b.total - a.total)[0] ?? null;
      const topMonthEntry = [...byMonth.entries()].sort((a, b) => b[1] - a[1])[0];
      const monthTotals = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        total: byMonth.get(i + 1) ?? 0,
        income: yearTrend.find((t) => t.month === i + 1)?.incomeTotal ?? 0,
      }));

      setData({
        totalExpense,
        totalIncome,
        count: records.length,
        days: dateSet.size,
        maxExpense,
        topCategory,
        topMonth: topMonthEntry ? { month: topMonthEntry[0], total: topMonthEntry[1] } : null,
        monthTotals,
      });
      setExpenseAnim(totalExpense);
      setIncomeAnim(totalIncome);
      setCountAnim(records.length);
      setDaysAnim(dateSet.size);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year);
  }, [year, load]);

  const tagline = taglineFor(data);
  const expenseDisplay = useCountUp(expenseAnim);
  const incomeDisplay = useCountUp(incomeAnim);
  const countDisplay = useCountUp(countAnim);
  const daysDisplay = useCountUp(daysAnim);
  const maxMonthTotal = useMemo(
    () => Math.max(...(data?.monthTotals.map((m) => Math.max(m.total, m.income)) ?? [1]), 1),
    [data]
  );

  const shareSummary = () => {
    if (!data) return;
    const text =
      `📊 我的 ${year} 年度账单报告(来自青孤项目)\n` +
      `🏷️ 年度称号:${tagline.emoji} ${tagline.title}\n` +
      `💸 总支出 ¥${fmt(data.totalExpense)} | 💰 总收入 ¥${fmt(data.totalIncome)}\n` +
      `📝 共记账 ${data.count} 笔,覆盖 ${data.days} 天\n` +
      (data.topCategory ? `🔥 最烧钱:「${data.topCategory.icon} ${data.topCategory.name}」¥${fmt(data.topCategory.total)}\n` : '') +
      (data.maxExpense ? `💥 最大一笔:¥${fmt(data.maxExpense.amount)}(${data.maxExpense.date} · ${data.maxExpense.category})\n` : '') +
      `🔒 数据全部保存在本地,只属于你。`;
    try {
      navigator.clipboard.writeText(text).then(
        () => message.success('年度总结已复制,快去分享吧'),
        () => message.error('复制失败,请手动截图分享')
      );
    } catch {
      message.error('复制失败,请手动截图分享');
    }
  };

  return (
    <div className="page-card report-page">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconReport size={22} /> 年度账单报告
        </span>
        <span className="report-year-switch">
          <Button type="text" icon={<IconLeft size={16} />} disabled={year <= currentYear - 3} onClick={() => setYear((y) => y - 1)} />
          <span className="report-year">{year}</span>
          <Button type="text" icon={<IconRight size={16} />} disabled={year >= currentYear} onClick={() => setYear((y) => y + 1)} />
        </span>
      </div>
      <p className="page-sub">把这一年的每一笔,变成一份有仪式感的总结</p>

      <Spin spinning={loading}>
        {!data && !loading ? (
          <Empty description="这一年还没有数据" />
        ) : data ? (
          <div className="report-body">
            {/* 封面 */}
            <div className="report-cover">
              <div className="report-cover-glow" />
              <div className="report-cover-badge">QINGGU ANNUAL · {year}</div>
              <div className="report-cover-emoji">{tagline.emoji}</div>
              <div className="report-cover-title">{tagline.title}</div>
              <div className="report-cover-desc">{tagline.desc}</div>
              {data.count === 0 && (
                <Button type="primary" style={{ marginTop: 18 }} onClick={() => (window.location.hash = '#/add')}>
                  <IconBook size={15} /> 记下第一笔
                </Button>
              )}
            </div>

            {/* 总览数字 */}
            <div className="report-stats">
              <div className="report-stat">
                <div className="report-stat-value report-c-expense">¥{fmt(expenseDisplay)}</div>
                <div className="report-stat-label">总支出</div>
              </div>
              <div className="report-stat">
                <div className="report-stat-value report-c-income">¥{fmt(incomeDisplay)}</div>
                <div className="report-stat-label">总收入</div>
              </div>
              <div className="report-stat">
                <div className="report-stat-value" style={{ color: data.totalIncome - data.totalExpense >= 0 ? 'var(--qg-success)' : 'var(--qg-error)' }}>
                  ¥{fmt(data.totalIncome - data.totalExpense)}
                </div>
                <div className="report-stat-label">年度结余</div>
              </div>
              <div className="report-stat">
                <div className="report-stat-value">{Math.round(countDisplay)}</div>
                <div className="report-stat-label">记账笔数</div>
              </div>
            </div>

            {/* 月度柱状图 */}
            <div className="report-section">
              <div className="report-section-title">月度支出轨迹</div>
              <div className="report-bars">
                {data.monthTotals.map((m) => (
                  <div className="report-bar-col" key={m.month}>
                    <div className="report-bar-track">
                      <div
                        className="report-bar report-bar-expense"
                        style={{ height: `${Math.max((m.total / maxMonthTotal) * 100, m.total > 0 ? 4 : 1)}%` }}
                        title={`${m.month}月支出 ¥${fmt(m.total)}`}
                      />
                      {m.income > 0 && (
                        <div
                          className="report-bar report-bar-income"
                          style={{ height: `${Math.max((m.income / maxMonthTotal) * 100, 4)}%` }}
                          title={`${m.month}月收入 ¥${fmt(m.income)}`}
                        />
                      )}
                    </div>
                    <span className={`report-bar-label ${m.month === data.topMonth?.month && data.topMonth.total > 0 ? 'is-top' : ''}`}>
                      {m.month}月
                    </span>
                  </div>
                ))}
              </div>
              <div className="report-legend">
                <span><i style={{ background: '#f43f5e' }} />支出</span>
                <span><i style={{ background: '#10b981' }} />收入</span>
                <span>👑 最烧钱的月份:{data.topMonth ? `${data.topMonth.month} 月 ¥${fmt(data.topMonth.total)}` : '—'}</span>
              </div>
            </div>

            {/* 年度之最 */}
            <div className="report-section">
              <div className="report-section-title">年度之最</div>
              <div className="report-bests">
                <div className="report-best">
                  <div className="report-best-emoji">💥</div>
                  <div className="report-best-title">最大一笔支出</div>
                  <div className="report-best-value">
                    {data.maxExpense ? `¥${fmt(data.maxExpense.amount)}` : '—'}
                  </div>
                  <div className="report-best-sub">
                    {data.maxExpense ? `${data.maxExpense.date} · ${data.maxExpense.icon} ${data.maxExpense.category}` : '暂无大额支出'}
                  </div>
                </div>
                <div className="report-best">
                  <div className="report-best-emoji">🔥</div>
                  <div className="report-best-title">最烧钱分类</div>
                  <div className="report-best-value">
                    {data.topCategory ? `¥${fmt(data.topCategory.total)}` : '—'}
                  </div>
                  <div className="report-best-sub">
                    {data.topCategory ? `${data.topCategory.icon} ${data.topCategory.name}` : '暂无数据'}
                  </div>
                </div>
                <div className="report-best">
                  <div className="report-best-emoji">📅</div>
                  <div className="report-best-title">记账天数</div>
                  <div className="report-best-value">{Math.round(daysDisplay)} 天</div>
                  <div className="report-best-sub">这一年,你认真记录了生活</div>
                </div>
              </div>
            </div>

            {/* 分享 */}
            <div className="report-share">
              <div className="report-share-text">
                你的数据只属于你。<br />把这年的故事分享给朋友吧。
              </div>
              <Button type="primary" size="large" onClick={shareSummary}>
                ✨ 复制年度总结
              </Button>
            </div>
          </div>
        ) : null}
      </Spin>
    </div>
  );
};

export default AnnualReport;
