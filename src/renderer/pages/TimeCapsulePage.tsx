/**
 * 时间胶囊 — 写信给未来的自己
 * 锁定到指定日期，开封时有仪式感
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Form, Input, DatePicker, message, Empty, Popconfirm, Typography } from 'antd';
import { IconHourglass, IconPlusCircle, IconTrash, IconEdit } from '../components/Icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Capsule {
  id: string;
  title: string;
  content: string;
  openDate: string;   // YYYY-MM-DD
  color: string;
  createdAt: string;
  opened: boolean;
}

const STORAGE_KEY = 'qinggu-capsules';
const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#4f6df5'];

function loadCapsules(): Capsule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* noop */ }
  return [];
}

function saveCapsules(list: Capsule[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* noop */ }
}

const TimeCapsulePage: React.FC = () => {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Capsule | null>(null);
  const [opening, setOpening] = useState<Capsule | null>(null);
  const [celebrated, setCelebrated] = useState(false);
  const [form] = Form.useForm();
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  useEffect(() => {
    setCapsules(loadCapsules());
  }, []);

  /* 到期自动开封庆祝 */
  useEffect(() => {
    if (celebrated) return;
    const today = dayjs().format('YYYY-MM-DD');
    const due = capsules.filter((c) => !c.opened && c.openDate <= today);
    if (due.length > 0) {
      setCelebrated(true);
      Modal.info({
        title: '🎉 时间到了!',
        content: `你有 ${due.length} 封信已经可以开启,去看看吧!`,
        okText: '太好了',
      });
    }
  }, [capsules, celebrated]);

  const sorted = useMemo(
    () => [...capsules].sort((a, b) => {
      const aDue = !a.opened && a.openDate <= dayjs().format('YYYY-MM-DD');
      const bDue = !b.opened && b.openDate <= dayjs().format('YYYY-MM-DD');
      if (aDue !== bDue) return aDue ? -1 : 1;
      if (a.opened !== b.opened) return a.opened ? 1 : -1;
      return a.openDate.localeCompare(b.openDate);
    }),
    [capsules]
  );

  const openAdd = () => {
    setEditing(null);
    setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (c: Capsule) => {
    setEditing(c);
    setSelectedColor(c.color);
    form.setFieldsValue({ title: c.title, content: c.content, openDate: dayjs(c.openDate) });
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload: Capsule = {
        id: editing?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: values.title.trim(),
        content: values.content.trim(),
        openDate: values.openDate.format('YYYY-MM-DD'),
        color: selectedColor,
        createdAt: editing?.createdAt ?? dayjs().format('YYYY-MM-DD'),
        opened: editing?.opened ?? false,
      };
      const next = editing
        ? capsules.map((c) => (c.id === editing.id ? payload : c))
        : [...capsules, payload];
      setCapsules(next);
      saveCapsules(next);
      setModalVisible(false);
      message.success(editing ? '已更新' : '信封已封存,等待未来的你开启');
    } catch { /* 校验失败 */ }
  };

  const handleDelete = (id: string) => {
    const next = capsules.filter((c) => c.id !== id);
    setCapsules(next);
    saveCapsules(next);
  };

  const handleOpen = (c: Capsule) => {
    setOpening(c);
  };

  const confirmOpen = () => {
    if (!opening) return;
    const next = capsules.map((c) => (c.id === opening.id ? { ...c, opened: true } : c));
    setCapsules(next);
    saveCapsules(next);
    setOpening(null);
    message.success('💌 你收到一封来自过去的信');
  };

  const daysLeft = (date: string) => {
    const diff = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
    if (diff <= 0) return '已可开启';
    if (diff === 1) return '明天开启';
    return `还有 ${diff} 天`;
  };

  return (
    <div className="page-card">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconHourglass size={22} /> 时间胶囊
      </div>
      <p className="page-sub">把此刻的心情写下来,寄给未来的自己</p>

      <div style={{ marginBottom: 20 }}>
        <Button type="primary" icon={<IconPlusCircle size={16} />} onClick={openAdd}>
          写一封信
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Empty description="还没有时间胶囊,写一封给一年后的自己吧" />
      ) : (
        <div className="capsule-grid">
          {sorted.map((c) => {
            const canOpen = !c.opened && c.openDate <= dayjs().format('YYYY-MM-DD');
            return (
              <div
                key={c.id}
                className={`capsule-card ${c.opened ? 'opened' : 'locked'} ${canOpen ? 'due' : ''}`}
                style={{ '--cc': c.color } as React.CSSProperties}
              >
                <div className="capsule-card-head">
                  <span className="capsule-badge">
                    {c.opened ? '💌 已开启' : canOpen ? '🎉 待开启' : `🔒 ${daysLeft(c.openDate)}`}
                  </span>
                  <span className="capsule-actions">
                    {!c.opened && (
                      <Button type="text" size="small" icon={<IconEdit size={14} />} onClick={() => openEdit(c)} />
                    )}
                    <Popconfirm title="确定销毁这封信？" onConfirm={() => handleDelete(c.id)} okText="确定" cancelText="取消">
                      <Button type="text" size="small" danger icon={<IconTrash size={14} />} />
                    </Popconfirm>
                  </span>
                </div>
                <div className="capsule-title">{c.title}</div>
                <div className={`capsule-content ${c.opened ? '' : 'blurred'}`}>
                  {c.opened ? c.content : c.content.slice(0, 30) + '……'}
                </div>
                <div className="capsule-meta">
                  <span>写于 {c.createdAt}</span>
                  <span>寄往 {c.openDate}</span>
                </div>
                {canOpen && (
                  <Button type="primary" block onClick={() => handleOpen(c)}>
                    开启这封信 ✨
                  </Button>
                )}
                {c.opened && <div className="capsule-stamp">已寄达</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* 写信弹窗 */}
      <Modal
        title={editing ? '编辑这封信' : '写信给未来'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="封存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '给这封信起个名字' }, { max: 30, message: '最多 30 个字' }]}
          >
            <Input placeholder="例如:写给一年后的我" maxLength={30} />
          </Form.Item>
          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '写点什么吧' }, { max: 2000, message: '最多 2000 个字' }]}
          >
            <Input.TextArea placeholder="此刻的你,想对未来的自己说什么?" rows={6} maxLength={2000} showCount />
          </Form.Item>
          <Form.Item
            label="开启日期"
            name="openDate"
            rules={[{ required: true, message: '请选择开启日期' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY年M月D日" />
          </Form.Item>
          <Form.Item label="信封颜色">
            <div className="capsule-color-row">
              {COLORS.map((col) => (
                <div
                  key={col}
                  className={`capsule-color ${selectedColor === col ? 'active' : ''}`}
                  style={{ background: col }}
                  onClick={() => setSelectedColor(col)}
                />
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 开封弹窗 */}
      <Modal
        title="💌 开启时间胶囊"
        open={!!opening}
        onOk={confirmOpen}
        onCancel={() => setOpening(null)}
        okText="开启"
        cancelText="再等等"
      >
        {opening && (
          <div style={{ marginTop: 8 }}>
            <Text>
              这封信来自 <strong>{opening.createdAt}</strong>,现在开启它吗?
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TimeCapsulePage;
