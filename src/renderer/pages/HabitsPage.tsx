/**
 * 习惯打卡 — 每天一点点,养成好习惯
 * 数据保存在 localStorage
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Form, Input, message, Empty, Popconfirm } from 'antd';
import { IconCheckCircle, IconPlusCircle, IconEdit, IconTrash, IconFire } from '../components/Icons';
import dayjs from 'dayjs';

interface Habit {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
  completions: Record<string, true>; // 'YYYY-MM-DD' -> true
}

const STORAGE_KEY = 'qinggu-habits';
const HABIT_ICONS = ['📚', '🏃', '💧', '🧘', '✍️', '🎸', '💊', '🥗', '😴', '📵', '🧹', '🌅'];

function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* noop */ }
  return [];
}

function saveHabits(habits: Habit[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(habits)); } catch { /* noop */ }
}

const todayStr = () => dayjs().format('YYYY-MM-DD');

/** 连续打卡天数（以今天或昨天为终点） */
function calcStreak(completions: Record<string, true>): number {
  let streak = 0;
  let cursor = dayjs();
  if (!completions[cursor.format('YYYY-MM-DD')]) {
    cursor = cursor.subtract(1, 'day'); // 今天还没打,从昨天算起
  }
  while (completions[cursor.format('YYYY-MM-DD')]) {
    streak++;
    cursor = cursor.subtract(1, 'day');
  }
  return streak;
}

/** 最近 7 天的完成情况 [true/false...]（索引 0 = 6 天前） */
function last7Days(completions: Record<string, true>): boolean[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
    return !!completions[d];
  });
}

const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [form] = Form.useForm();
  const [selectedIcon, setSelectedIcon] = useState(HABIT_ICONS[0]);

  useEffect(() => {
    setHabits(loadHabits());
  }, []);

  const today = todayStr();
  const totalToday = habits.filter((h) => h.completions[today]).length;

  const openAdd = () => {
    setEditing(null);
    setSelectedIcon(HABIT_ICONS[Math.floor(Math.random() * HABIT_ICONS.length)]);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (h: Habit) => {
    setEditing(h);
    setSelectedIcon(h.icon);
    form.setFieldsValue({ name: h.name });
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload: Habit = {
        id: editing?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: values.name.trim(),
        icon: selectedIcon,
        createdAt: editing?.createdAt ?? today,
        completions: editing?.completions ?? {},
      };
      const next = editing
        ? habits.map((h) => (h.id === editing.id ? payload : h))
        : [...habits, payload];
      setHabits(next);
      saveHabits(next);
      setModalVisible(false);
      message.success(editing ? '已更新' : '新习惯已创建,开始打卡吧');
    } catch { /* 校验失败 */ }
  };

  const handleDelete = (id: string) => {
    const next = habits.filter((h) => h.id !== id);
    setHabits(next);
    saveHabits(next);
    message.success('已删除');
  };

  const toggleToday = (habit: Habit) => {
    const done = !!habit.completions[today];
    const completions = { ...habit.completions };
    if (done) {
      delete completions[today];
    } else {
      completions[today] = true;
      const streak = calcStreak(completions);
      if (streak >= 7) message.success(`🔥 已连续打卡 ${streak} 天,太强了!`);
      else message.success('打卡成功,继续保持!');
    }
    const next = habits.map((h) => (h.id === habit.id ? { ...h, completions } : h));
    setHabits(next);
    saveHabits(next);
  };

  const weekLabels = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('dd').replace('周', '')),
    []
  );

  return (
    <div className="page-card">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconCheckCircle size={22} /> 习惯打卡
      </div>
      <p className="page-sub">每天一点点,坚持看得见</p>

      <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="primary" icon={<IconPlusCircle size={16} />} onClick={openAdd}>
          新习惯
        </Button>
        <span className="habit-summary">
          {totalToday > 0 ? `今日已完成 ${totalToday}/${habits.length} 项,继续保持!` : '今天还没有打卡,从第一项开始吧'}
        </span>
      </div>

      {habits.length === 0 ? (
        <Empty description="还没有习惯,点击上方按钮创建第一个吧(读书、运动、喝水…)" />
      ) : (
        <div className="habit-list">
          {habits.map((h) => {
            const done = !!h.completions[today];
            const streak = calcStreak(h.completions);
            const week = last7Days(h.completions);
            return (
              <div key={h.id} className={`habit-item ${done ? 'done' : ''}`}>
                <button
                  className={`habit-check ${done ? 'checked' : ''}`}
                  onClick={() => toggleToday(h)}
                  aria-label={done ? '取消打卡' : '打卡'}
                >
                  {done ? '✓' : ''}
                </button>
                <div className="habit-main">
                  <div className="habit-name">
                    <span className="habit-icon">{h.icon}</span>
                    {h.name}
                  </div>
                  <div className="habit-week">
                    {week.map((w, i) => (
                      <span key={i} className={`habit-dot ${w ? 'on' : ''}`} title={weekLabels[i]} />
                    ))}
                  </div>
                </div>
                <div className="habit-streak" title="连续打卡天数">
                  {streak > 0 ? (
                    <>
                      <IconFire size={16} />
                      {streak} 天
                    </>
                  ) : (
                    <span className="habit-streak-empty">待开始</span>
                  )}
                </div>
                <span className="habit-actions">
                  <Button type="text" size="small" icon={<IconEdit size={14} />} onClick={() => openEdit(h)} />
                  <Popconfirm title="确定删除这个习惯？" onConfirm={() => handleDelete(h.id)} okText="确定" cancelText="取消">
                    <Button type="text" size="small" danger icon={<IconTrash size={14} />} />
                  </Popconfirm>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={editing ? '编辑习惯' : '新习惯'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="习惯名称"
            name="name"
            rules={[{ required: true, message: '请输入习惯名称' }, { max: 20, message: '最多 20 个字' }]}
          >
            <Input placeholder="例如:每天读书 30 分钟" maxLength={20} />
          </Form.Item>
          <Form.Item label="图标">
            <div className="habit-icon-row">
              {HABIT_ICONS.map((ic) => (
                <div
                  key={ic}
                  className={`habit-icon-option ${selectedIcon === ic ? 'active' : ''}`}
                  onClick={() => setSelectedIcon(ic)}
                >
                  {ic}
                </div>
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HabitsPage;
