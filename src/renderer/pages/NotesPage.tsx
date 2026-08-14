/**
 * 备忘录 — 彩色便签
 * 数据保存在 localStorage，支持置顶与搜索
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Form, Input, message, Empty, Popconfirm, Input as SearchInput } from 'antd';
import { IconNote, IconPlusCircle, IconTrash, IconEdit, IconSearch } from '../components/Icons';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  updatedAt: number;
}

const STORAGE_KEY = 'qinggu-notes';

const NOTE_COLORS = [
  { id: 'yellow', bg: '#fef9c3', border: '#fde047', text: '#713f12' },
  { id: 'green', bg: '#dcfce7', border: '#86efac', text: '#14532d' },
  { id: 'blue', bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
  { id: 'pink', bg: '#fce7f3', border: '#f9a8d4', text: '#831843' },
  { id: 'purple', bg: '#ede9fe', border: '#c4b5fd', text: '#4c1d95' },
  { id: 'gray', bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' },
];

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* noop */ }
  return [];
}

function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch { /* noop */ }
}

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[2].id);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = kw
      ? notes.filter((n) => n.title.toLowerCase().includes(kw) || n.content.toLowerCase().includes(kw))
      : notes;
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, keyword]);

  const openAdd = () => {
    setEditing(null);
    setSelectedColor(NOTE_COLORS[2].id);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (n: Note) => {
    setEditing(n);
    setSelectedColor(n.color);
    form.setFieldsValue({ title: n.title, content: n.content });
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload: Note = {
        id: editing?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: (values.title || '').trim(),
        content: (values.content || '').trim(),
        color: selectedColor,
        pinned: editing?.pinned ?? false,
        updatedAt: Date.now(),
      };
      const next = editing
        ? notes.map((n) => (n.id === editing.id ? payload : n))
        : [payload, ...notes];
      setNotes(next);
      saveNotes(next);
      setModalVisible(false);
      message.success(editing ? '便签已更新' : '便签已添加');
    } catch { /* 校验失败 */ }
  };

  const handleDelete = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    saveNotes(next);
    message.success('已删除');
  };

  const handleTogglePin = (n: Note) => {
    const next = notes.map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x));
    setNotes(next);
    saveNotes(next);
  };

  return (
    <div className="page-card">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconNote size={22} /> 备忘录
      </div>
      <p className="page-sub">随手记下灵感、待办和小事，彩色便签随心贴</p>

      <div className="notes-toolbar">
        <SearchInput
          prefix={<IconSearch size={14} />}
          placeholder="搜索便签…"
          allowClear
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <Button type="primary" icon={<IconPlusCircle size={16} />} onClick={openAdd}>
          新便签
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Empty description={keyword ? '没有匹配的便签' : '还没有便签，点击上方按钮记下第一条吧'} />
      ) : (
        <div className="notes-grid">
          {filtered.map((n) => {
            const colorMeta = NOTE_COLORS.find((c) => c.id === n.color) || NOTE_COLORS[5];
            return (
              <div
                key={n.id}
                className={`note-card ${n.pinned ? 'is-pinned' : ''}`}
                style={{
                  background: colorMeta.bg,
                  borderColor: colorMeta.border,
                  color: colorMeta.text,
                  '--nc': colorMeta.border,
                } as React.CSSProperties}
              >
                <div className="note-card-head">
                  <span className="note-pin" title={n.pinned ? '取消置顶' : '置顶'} onClick={() => handleTogglePin(n)}>
                    {n.pinned ? '📌' : '📍'}
                  </span>
                  <span className="note-actions">
                    <Button type="text" size="small" icon={<IconEdit size={14} />} onClick={() => openEdit(n)} />
                    <Popconfirm title="确定删除这条便签？" onConfirm={() => handleDelete(n.id)} okText="确定" cancelText="取消">
                      <Button type="text" size="small" danger icon={<IconTrash size={14} />} />
                    </Popconfirm>
                  </span>
                </div>
                {n.title && <div className="note-card-title">{n.title}</div>}
                <div className="note-card-content">{n.content || '（空白便签）'}</div>
                <div className="note-card-time">
                  {new Date(n.updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={editing ? '编辑便签' : '新便签'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="标题（可选）" name="title" rules={[{ max: 50, message: '最多 50 个字' }]}>
            <Input placeholder="例如：周末要买的东西" maxLength={50} />
          </Form.Item>
          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '写点什么吧' }, { max: 1000, message: '最多 1000 个字' }]}
          >
            <Input.TextArea placeholder="记下此刻的想法…" rows={5} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item label="颜色">
            <div className="note-color-row">
              {NOTE_COLORS.map((c) => (
                <div
                  key={c.id}
                  className={`note-color ${selectedColor === c.id ? 'active' : ''}`}
                  style={{ background: c.bg, borderColor: c.border }}
                  onClick={() => setSelectedColor(c.id)}
                />
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotesPage;
