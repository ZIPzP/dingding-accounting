/**
 * 记账 — 账单列表
 * 展示所有记账记录，支持按月份、类型（支出/收入）、分类筛选
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Card,
  DatePicker,
  Select,
  Button,
  Popconfirm,
  Empty,
  Spin,
  Row,
  Col,
  Tag,
  Space,
  Segmented,
} from 'antd';
import { IconPlusCircle, IconEdit, IconDelete, IconSearch } from '../components/Icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Option } = Select;

type TypeFilter = 'all' | 'expense' | 'income';

const BillList: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
  const [monthSummary, setMonthSummary] = useState<MonthlyStats | null>(null);

  // 筛选条件
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 30;

  // 加载分类
  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  // 加载数据
  const loadRecords = useCallback(() => {
    setLoading(true);
    const year = selectedMonth.year();
    const month = selectedMonth.month() + 1;

    api
      .getRecords({
        year,
        month,
        category_id: selectedCategory || undefined,
        type: selectedType === 'all' ? undefined : selectedType,
        page,
        pageSize,
      })
      .then((res) => {
        setRecords(res.records);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));

    // 月度摘要
    api.getMonthlyStats(year, month).then(setMonthSummary).catch(() => undefined);
  }, [selectedMonth, selectedCategory, selectedType, page]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // 删除记录
  const handleDelete = async (id: number) => {
    await api.deleteRecord(id);
    loadRecords();
  };

  // 切换月份
  const handleMonthChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedMonth(date);
      setPage(1);
    }
  };

  const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="page-card">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconSearch size={20} /> 记账
      </div>

      {/* 筛选栏 + 月度摘要 */}
      <Card size="small" className="bill-filter-card" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              allowClear={false}
              format="YYYY年M月"
            />
          </Col>
          <Col>
            <Segmented
              value={selectedType}
              onChange={(val) => {
                setSelectedType(val as TypeFilter);
                setPage(1);
              }}
              options={[
                { label: '全部', value: 'all' },
                { label: '💸 支出', value: 'expense' },
                { label: '💰 收入', value: 'income' },
              ]}
            />
          </Col>
          <Col>
            <Select
              placeholder="全部分类"
              allowClear
              style={{ width: 140 }}
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                setPage(1);
              }}
            >
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col flex="auto" />
          <Col>
            <Button type="primary" icon={<IconPlusCircle size={16} />} onClick={() => navigate('/add')}>
              记一笔
            </Button>
          </Col>
        </Row>

        {/* 月度摘要 */}
        {monthSummary && (
          <div className="bill-summary">
            <div className="bill-summary-item">
              <span className="bill-summary-label">本月支出</span>
              <span className="bill-summary-value bill-summary-expense">¥{fmt(monthSummary.total)}</span>
            </div>
            <div className="bill-summary-item">
              <span className="bill-summary-label">本月收入</span>
              <span className="bill-summary-value bill-summary-income">¥{fmt(monthSummary.incomeTotal)}</span>
            </div>
            <div className="bill-summary-item">
              <span className="bill-summary-label">结余</span>
              <span className={`bill-summary-value ${monthSummary.balance >= 0 ? 'bill-summary-income' : 'bill-summary-expense'}`}>
                {monthSummary.balance >= 0 ? '+' : ''}¥{fmt(monthSummary.balance)}
              </span>
            </div>
            <div className="bill-summary-item">
              <span className="bill-summary-label">笔数</span>
              <span className="bill-summary-value">{monthSummary.count + monthSummary.incomeCount} 笔</span>
            </div>
          </div>
        )}
      </Card>

      {/* 账单列表 */}
      <Spin spinning={loading}>
        {records.length === 0 ? (
          <Empty description="暂无记账记录，点击右上角「记一笔」开始吧" />
        ) : (
          <div>
            {records.map((record) => {
              const isIncome = record.type === 'income';
              return (
                <div key={record.id} className="record-item">
                  <div className="record-icon">{record.category_icon}</div>
                  <div className="record-info">
                    <div className="record-category">
                      {record.category_name}
                      {record.sub_category_name && (
                        <Tag style={{ marginLeft: 8, fontSize: 11 }} color={isIncome ? 'success' : 'processing'}>
                          {record.sub_category_name}
                        </Tag>
                      )}
                      {isIncome && (
                        <Tag style={{ marginLeft: 4, fontSize: 11 }} color="success">
                          收入
                        </Tag>
                      )}
                    </div>
                    {record.note && <div className="record-note">{record.note}</div>}
                  </div>
                  <div className="record-date">{record.record_date}</div>
                  <div
                    className={`amount ${isIncome ? 'amount-income' : ''}`}
                    style={{ marginRight: 8, minWidth: 70, textAlign: 'right' }}
                  >
                    {isIncome ? '+' : ''}{fmt(record.amount)}
                  </div>
                  <Space size="small">
                    <Button
                      type="text"
                      size="small"
                      icon={<IconEdit size={16} />}
                      onClick={() => navigate(`/edit/${record.id}`)}
                    />
                    <Popconfirm
                      title="确定删除这条记录吗？"
                      onConfirm={() => handleDelete(record.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="text" size="small" danger icon={<IconDelete size={16} />} />
                    </Popconfirm>
                  </Space>
                </div>
              );
            })}

            {/* 简单分页 */}
            {total > pageSize && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Space>
                  <Button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    上一页
                  </Button>
                  <span style={{ color: 'var(--qg-text-tertiary)' }}>
                    第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页（{total} 条）
                  </span>
                  <Button
                    disabled={page >= Math.ceil(total / pageSize)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    下一页
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Spin>
    </div>
  );
};

export default BillList;
