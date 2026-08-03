/**
 * 统计页面
 * 展示月度总览、分类饼图、趋势折线图
 */
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, DatePicker, Statistic, Spin, Empty } from 'antd';
import { IconChart, IconWallet, IconCalendar, IconShopping } from '../components/Icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { api } from '../services/api';

const Statistics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);

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
      })
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  // 饼图配置
  const pieOption = monthlyStats
    ? {
        tooltip: {
          trigger: 'item' as const,
          formatter: '{b}: ¥{c} ({d}%)',
          backgroundColor: 'rgba(30, 27, 58, 0.85)',
          borderColor: 'rgba(124, 58, 237, 0.3)',
          textStyle: { color: '#fff', fontSize: 13 },
        },
        legend: {
          orient: 'vertical' as const,
          right: 10,
          top: 'center',
          textStyle: { color: '#6b7280' },
        },
        color: ['#4f6df5', '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#6366f1'],
        series: [
          {
            type: 'pie',
            radius: ['42%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 3,
            },
            label: { show: false },
            emphasis: {
              label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#1a1d29' },
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

  // 趋势图配置
  const trendOption = {
    tooltip: {
      trigger: 'axis' as const,
      formatter: '{b}<br/>支出: ¥{c}',
      backgroundColor: 'rgba(30, 27, 58, 0.85)',
      borderColor: 'rgba(124, 58, 237, 0.3)',
      textStyle: { color: '#fff', fontSize: 13 },
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 30,
    },
    xAxis: {
      type: 'category' as const,
      data: trend.map((t) => t.label.slice(0, -1)),
      axisLabel: { rotate: 30, color: '#9ca3af' },
      axisLine: { lineStyle: { color: '#eef0f5' } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: '¥{value}',
        color: '#9ca3af',
      },
      splitLine: { lineStyle: { color: '#f0f2f8', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        data: trend.map((t) => t.total),
        smooth: true,
        lineStyle: { color: '#4f6df5', width: 3 },
        itemStyle: { color: '#4f6df5', borderColor: '#fff', borderWidth: 2 },
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(79, 109, 245, 0.25)' },
              { offset: 1, color: 'rgba(79, 109, 245, 0.02)' },
            ],
          },
        },
      },
    ],
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
        {monthlyStats ? (
          <>
            {/* 月度概览卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={8}>
                <Card className="stat-card">
                  <Statistic
                    title="当月总支出"
                    value={monthlyStats.total}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: 'var(--qg-error)', fontSize: 28, fontWeight: 700 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="stat-card">
                  <Statistic
                    title="记账笔数"
                    value={monthlyStats.count}
                    suffix="笔"
                    valueStyle={{ color: 'var(--qg-primary)', fontSize: 28, fontWeight: 700 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="stat-card">
                  <Statistic
                    title="日均支出"
                    value={monthlyStats.dailyAvg}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: 'var(--qg-warning)', fontSize: 28, fontWeight: 700 }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 图表区 */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={14}>
                <Card title="📊 近6个月支出趋势" style={{ height: '100%' }}>
                  <ReactECharts option={trendOption} style={{ height: 320 }} />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card title="🍩 本月分类占比" style={{ height: '100%' }}>
                  {pieOption && pieOption.series[0].data.length > 0 ? (
                    <ReactECharts option={pieOption} style={{ height: 320 }} />
                  ) : (
                    <Empty description="本月暂无支出" style={{ paddingTop: 80 }} />
                  )}
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          !loading && <Empty description="暂无统计数据" />
        )}
      </Spin>
    </div>
  );
};

export default Statistics;
