/**
 * 倒数日 — 记录重要日子，显示剩余天数
 * 数据保存在 localStorage
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Form, Input, DatePicker, message, Empty, Popconfirm } from 'antd';
import { IconHourglass, IconPlusCircle, IconEdit, IconTrash } from '../components/Icons';
import { achEmit } from '../services/achievements';
import dayjs from 'dayjs';

interface CountdownEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  color: string;
}

const STORAGE_KEY = 'qinggu-countdowns';
const COLORS = ['#06b6d4', '#4f6df5', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e'];

function loadEvents(): CountdownEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* noop */ }
  return [];
}

function saveEvents(events: CountdownEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch { /* noop */ }
}

/** 距离目标日的天数（正数=还有，负数=已过，0=今天） */
function daysUntil(date: string): number {
  const target = dayjs(date).startOf('day');
  const today = dayjs().startOf('day');
  return target.diff(today, 'day');
}

const CountdownPage: React.FC = () => {
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<CountdownEvent | null>(null);
  const [form] = Form.useForm();
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  useEffect(() => {
    setEvents(loadEvents());
  }, []);

  const sorted = useMemo(() => {
    const now = dayjs().startOf('day');
    return [...events].sort((a, b) => {
      const da = dayjs(a.date).startOf('day').diff(now, 'day');
      const db = dayjs(b.date).startOf('day').diff(now, 'day');
      // 未到的按日期升序，已过的按日期降序（最近的最前）
      if (da >= 0 && db >= 0) return da - db;
      if (da < 0 && db < 0) return db - da;
      return da >= 0 ? -1 : 1;
    });
  }, [events]);

  const openAdd = () => {
    setEditing(null);
    setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (e: CountdownEvent) => {
    setEditing(e);
    setSelectedColor(e.color || COLORS[0]);
    form.setFieldsValue({ title: e.title, date: dayjs(e.date) });
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload: CountdownEvent = {
        id: editing?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: values.title.trim(),
        date: values.date.format('YYYY-MM-DD'),
        color: selectedColor,
      };
      const next = editing
        ? events.map((e) => (e.id === editing.id ? payload : e))
        : [...events, payload];
      setEvents(next);
      saveEvents(next);
      setModalVisible(false);
      if (!editing) achEmit('countdown_created');
      message.success(editing ? '已更新' : '已添加');
    } catch { /* 校验失败 */ }
  };

  const handleDelete = (id: string) => {
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    saveEvents(next);
    message.success('已删除');
  };

  const fmtDate = (date: string) => {
    const d = dayjs(date);
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.day()];
    return `${d.year()}年${d.month() + 1}月${d.date()}日 · 周${week}`;
  };

  return (
    <div className="page-card">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconHourglass size={22} /> 倒数日
      </div>
      <p className="page-sub">记录重要日子，再也不怕错过纪念日、考试和发薪日</p>

      <div style={{ marginBottom: 20 }}>
        <Button type="primary" icon={<IconPlusCircle size={16} />} onClick={openAdd}>
          添加日子
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Empty description="还没有记录，点击上方按钮添加一个重要的日子吧" />
      ) : (
        <div className="countdown-grid">
          {sorted.map((e) => {
            const days = daysUntil(e.date);
            const isPast = days < 0;
            const isToday = days === 0;
            return (
              <div
                key={e.id}
                className={`countdown-card ${isPast ? 'is-past' : ''} ${isToday ? 'is-today' : ''}`}
                style={{ '--cd': e.color } as React.CSSProperties}
              >
                <div className="countdown-card-head">
                  <span className="countdown-dot" />
                  <span className="countdown-badge">{isToday ? '就是今天' : isPast ? '已经过去' : '还有'}</span>
                  <span className="countdown-actions">
                    <Button type="text" size="small" icon={<IconEdit size={14} />} onClick={() => openEdit(e)} />
                    <Popconfirm title="确定删除？" onConfirm={() => handleDelete(e.id)} okText="确定" cancelText="取消">
                      <Button type="text" size="small" danger icon={<IconTrash size={14} />} />
                    </Popconfirm>
                  </span>
                </div>
                <div className="countdown-num">
                  {isToday ? '🎉' : Math.abs(days)}
                  {!isToday && <span className="countdown-unit">{isPast ? '天前' : '天'}</span>}
                </div>
                <div className="countdown-title">{e.title}</div>
                <div className="countdown-date">{fmtDate(e.date)}</div>
                {isPast && <div className="countdown-past-tip">时光已过 {Math.abs(days)} 天，珍惜当下</div>}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={editing ? '编辑日子' : '添加日子'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="名称"
            name="title"
            rules={[{ required: true, message: '请输入名称' }, { max: 30, message: '最多 30 个字' }]}
          >
            <Input placeholder="例如：高考倒计时 / 恋爱纪念日" maxLength={30} />
          </Form.Item>
          <Form.Item
            label="目标日期"
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY年M月D日" />
          </Form.Item>
          <Form.Item label="颜色">
            <div className="countdown-color-row">
              {COLORS.map((c) => (
                <div
                  key={c}
                  className={`countdown-color ${selectedColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setSelectedColor(c)}
                />
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CountdownPage;
