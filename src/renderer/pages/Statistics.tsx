/**
 * 统计页面
 * 展示月度收入/支出/结余概览、预算进度、分类饼图、收支趋势
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, DatePicker, Statistic, Spin, Empty, Progress, Button, Tooltip } from 'antd';
import { IconChart, IconWallet, IconReport } from '../components/Icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { api } from '../services/api';
import { getBudget, budgetProgress, budgetStatus } from '../services/budget';
import { achEmit } from '../services/achievements';

const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [budget] = useState(() => getBudget());
  const [heatData, setHeatData] = useState<Map<string, number>>(new Map());

  /* 热力图数据:近半年全部支出 */
  useEffect(() => {
    api.getRecords({ pageSize: 99999 }).then((res) => {
      const m = new Map<string, number>();
      for (const r of res.records) {
        if (r.type === 'expense') {
          m.set(r.record_date, (m.get(r.record_date) || 0) + r.amount);
        }
      }
      setHeatData(m);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    const year = selectedMonth.year();
    const month = selectedMonth.month() + 1;

    Promise.all([
      api.getMonthlyStats(year, month),
      api.getMonthlyTrend(6),
    ])
      .then(([stats, trendData]) => {
        setMonthlyStats(stats);
        setTrend(trendData);
        // 预算守门员成就
        const b = getBudget();
        if (b.amount > 0 && stats.total > 0 && stats.total <= b.amount) {
          achEmit('budget_ok');
        }
      })
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  // 饼图配置（支出分类）
  const pieOption = monthlyStats
    ? {
        tooltip: {
          trigger: 'item' as const,
          formatter: '{b}: ¥{c} ({d}%)',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
          textStyle: { color: '#e2e8f0', fontSize: 13 },
        },
        legend: {
          orient: 'vertical' as const,
          right: 10,
          top: 'center',
          textStyle: { color: 'var(--qg-text-secondary)' },
        },
        color: ['#06b6d4', '#4f6df5', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e', '#6366f1', '#14b8a6'],
        series: [
          {
            type: 'pie',
            radius: ['42%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: 'var(--qg-card-bg)',
              borderWidth: 3,
            },
            label: { show: false },
            emphasis: {
              label: { show: true, fontSize: 16, fontWeight: 'bold', color: 'var(--qg-text)' },
              itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' },
            },
            data: monthlyStats.categoryStats
              .filter((s) => s.total > 0)
              .map((s) => ({
                value: s.total,
                name: `${s.icon} ${s.name}`,
              })),
          },
        ],
      }
    : null;

  // 趋势图：支出 + 收入 双线
  const trendOption = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      borderColor: 'rgba(148, 163, 184, 0.2)',
      textStyle: { color: '#e2e8f0', fontSize: 13 },
    },
    legend: {
      data: ['支出', '收入'],
      top: 0,
      textStyle: { color: 'var(--qg-text-secondary)' },
    },
    grid: {
      left: 50,
      right: 20,
      top: 36,
      bottom: 30,
    },
    xAxis: {
      type: 'category' as const,
      data: trend.map((t) => `${t.month}月`),
      axisLabel: { color: 'var(--qg-text-tertiary)' },
      axisLine: { lineStyle: { color: 'var(--qg-border)' } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: (v: number) => (v >= 10000 ? `${(v / 10000).toFixed(1)}万` : `${v}`),
        color: 'var(--qg-text-tertiary)',
      },
      splitLine: { lineStyle: { color: 'var(--qg-border-light)', type: 'dashed' } },
    },
    series: [
      {
        name: '支出',
        type: 'line',
        data: trend.map((t) => t.total),
        smooth: true,
        lineStyle: { color: '#f43f5e', width: 3 },
        itemStyle: { color: '#f43f5e', borderColor: 'var(--qg-card-bg)', borderWidth: 2 },
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(244, 63, 94, 0.22)' },
              { offset: 1, color: 'rgba(244, 63, 94, 0.01)' },
            ],
          },
        },
      },
      {
        name: '收入',
        type: 'line',
        data: trend.map((t) => t.incomeTotal),
        smooth: true,
        lineStyle: { color: '#10b981', width: 3 },
        itemStyle: { color: '#10b981', borderColor: 'var(--qg-card-bg)', borderWidth: 2 },
        symbolSize: 8,
      },
    ],
  };

  const progress = monthlyStats ? budgetProgress(monthlyStats.total, budget.amount) : 0;
  const status = monthlyStats ? budgetStatus(monthlyStats.total, budget.amount) : 'none';
  const statusText = { none: '未设置预算', safe: '预算充足', warn: '接近预算上限', over: '已超出预算' }[status];
  const statusColor = { none: 'var(--qg-text-tertiary)', safe: 'var(--qg-success)', warn: 'var(--qg-warning)', over: 'var(--qg-error)' }[status];

  /* 热力图:近 26 周(182 天) */
  const heatWeeks = useMemo(() => {
    const start = dayjs().subtract(25, 'week').startOf('week');
    const weeks: { date: string; amount: number }[][] = [];
    for (let w = 0; w < 26; w++) {
      const col: { date: string; amount: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = start.add(w * 7 + d, 'day');
        const ds = date.format('YYYY-MM-DD');
        col.push({ date: ds, amount: heatData.get(ds) || 0 });
      }
      weeks.push(col);
    }
    return weeks;
  }, [heatData]);

  const heatLevel = (amount: number): number => {
    if (amount <= 0) return 0;
    if (amount < 50) return 1;
    if (amount < 150) return 2;
    if (amount < 400) return 3;
    return 4;
  };

  return (
    <div className="page-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <span className="page-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconChart size={22} /> 统计分析
        </span>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(d) => d && setSelectedMonth(d)}
          allowClear={false}
          format="YYYY年M月"
        />
      </div>

      <Spin spinning={loading}>
        {/* 记账热力图（独立渲染，不依赖月度统计） */}
        <Card title="🗓️ 记账热力图 · 近半年" style={{ marginBottom: 24 }}>
          <div className="heatmap-wrap">
            <div className="heatmap-labels">
              <span>一</span><span>三</span><span>五</span><span>日</span>
            </div>
            <div className="heatmap">
              {heatWeeks.map((col, wi) => (
                <div className="heat-col" key={wi}>
                  {col.map((day) => (
                    <Tooltip
                      key={day.date}
                      title={`${day.date}${day.amount > 0 ? ` · 支出 ¥${day.amount.toFixed(2)}` : ' · 无支出'}`}
                    >
                      <span
                        className={`heat-cell l${heatLevel(day.amount)}`}
                        data-date={day.date}
                      />
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="heatmap-legend">
            <span>少</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <span key={l} className={`heat-cell l${l}`} style={{ width: 11, height: 11, borderRadius: 3 }} />
            ))}
            <span>多</span>
            <span className="heatmap-legend-note">颜色越深,当天支出越多</span>
          </div>
        </Card>

        {monthlyStats ? (
          <>
            {/* 月度概览卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card">
                  <Statistic
                    title="当月支出"
                    value={monthlyStats.total}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: 'var(--qg-error)', fontSize: 26, fontWeight: 700, fontFamily: 'var(--qg-font-num)' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card">
                  <Statistic
                    title="当月收入"
                    value={monthlyStats.incomeTotal}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: 'var(--qg-success)', fontSize: 26, fontWeight: 700, fontFamily: 'var(--qg-font-num)' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card">
                  <Statistic
                    title="当月结余"
                    value={monthlyStats.balance}
                    precision={2}
                    prefix="¥"
                    valueStyle={{
                      color: monthlyStats.balance >= 0 ? 'var(--qg-success)' : 'var(--qg-error)',
                      fontSize: 26,
                      fontWeight: 700,
                      fontFamily: 'var(--qg-font-num)',
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card">
                  <Statistic
                    title="记账笔数"
                    value={monthlyStats.count + monthlyStats.incomeCount}
                    suffix="笔"
                    valueStyle={{ color: 'var(--qg-primary)', fontSize: 26, fontWeight: 700, fontFamily: 'var(--qg-font-num)' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 预算进度 */}
            {budget.amount > 0 && (
              <Card size="small" style={{ marginBottom: 24 }} className="budget-card">
                <div className="budget-card-head">
                  <span className="budget-card-title">
                    <IconWallet size={16} /> 本月预算
                  </span>
                  <span className="budget-card-status" style={{ color: statusColor }}>
                    {statusText}
                  </span>
                </div>
                <Progress
                  percent={Math.round(progress * 100)}
                  strokeColor={{ from: 'var(--qg-primary)', to: status === 'over' ? 'var(--qg-error)' : 'var(--qg-primary-light)' }}
                  trailColor="var(--qg-border-light)"
                  status={status === 'over' ? 'exception' : status === 'warn' ? 'active' : 'normal'}
                />
                <div className="budget-card-nums">
                  <span>已用 ¥{monthlyStats.total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span>预算 ¥{budget.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </Card>
            )}

            {/* 图表区 */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={14}>
                <Card title="📊 近6个月收支趋势" style={{ height: '100%' }}>
                  <ReactECharts option={trendOption} style={{ height: 320 }} />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card title="🍩 本月支出分类占比" style={{ height: '100%' }}>
                  {pieOption && pieOption.series[0].data.length > 0 ? (
                    <ReactECharts option={pieOption} style={{ height: 320 }} />
                  ) : (
                    <Empty description="本月暂无支出" style={{ paddingTop: 80 }} />
                  )}
                </Card>
              </Col>
            </Row>

            {/* 年度报告入口 */}
            <div className="report-entry" onClick={() => navigate('/report')}>
              <div className="report-entry-icon">
                <IconReport size={26} />
              </div>
              <div className="report-entry-body">
                <div className="report-entry-title">年度账单报告</div>
                <div className="report-entry-desc">把这一年的每一笔,变成一份有仪式感的总结 ✨</div>
              </div>
              <Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); navigate('/report'); }}>
                查看报告
              </Button>
            </div>
          </>
        ) : (
          !loading && <Empty description="暂无统计数据" />
        )}
      </Spin>
    </div>
  );
};

export default Statistics;
