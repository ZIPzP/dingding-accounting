/**
 * 首页 — 账单列表
 * 展示所有记账记录，支持按月份、分类筛选
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
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Option } = Select;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);

  // 筛选条件
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
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
        page,
        pageSize,
      })
      .then((res) => {
        setRecords(res.records);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [selectedMonth, selectedCategory, page]);

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

  // 金额格式化
  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  return (
    <div className="page-card">
      <div className="page-title">账单记录</div>

      {/* 醒目的红色警告 */}
      <div style={{
        background: '#fff2f0',
        border: '1px solid #ff4d4f',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 16,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 700,
        color: '#ff4d4f',
      }}>
        ⚠️ 谨慎网恋诈骗
      </div>

      {/* 小游戏入口 */}
      <Card
        hoverable
        size="small"
        style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #722ed1' }}
        onClick={() => navigate('/game')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🎮</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>小游戏</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>贪吃蛇等休闲小游戏，记账累了来玩玩</div>
          </div>
          <ThunderboltOutlined style={{ fontSize: 18, color: '#722ed1' }} />
        </div>
      </Card>

      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/add')}>
              记一笔
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 账单列表 */}
      <Spin spinning={loading}>
        {records.length === 0 ? (
          <Empty description="暂无记账记录，点击右上角「记一笔」开始吧" />
        ) : (
          <div>
            {records.map((record) => (
              <div key={record.id} className="record-item">
                <div className="record-icon">{record.category_icon}</div>
                <div className="record-info">
                  <div className="record-category">
                    {record.category_name}
                    {record.sub_category_name && (
                      <Tag style={{ marginLeft: 8, fontSize: 11 }} color="processing">
                        {record.sub_category_name}
                      </Tag>
                    )}
                  </div>
                  {record.note && <div className="record-note">{record.note}</div>}
                </div>
                <div className="record-date">{record.record_date}</div>
                <div className="amount" style={{ marginRight: 8, minWidth: 70, textAlign: 'right' }}>
                  {formatAmount(record.amount)}
                </div>
                <Space size="small">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/edit/${record.id}`)}
                  />
                  <Popconfirm
                    title="确定删除这条记录吗？"
                    onConfirm={() => handleDelete(record.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            ))}

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
                  <span style={{ color: '#8c8c8c' }}>
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

export default HomePage;
