/**
 * 心愿单 — 想要的东西,一点点攒下来
 * 数据保存在 localStorage
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, message, Empty, Popconfirm, Progress } from 'antd';
import { IconTarget, IconPlusCircle, IconEdit, IconTrash, IconWallet } from '../components/Icons';

interface WishItem {
  id: string;
  title: string;
  price: number;
  saved: number;
  note?: string;
  achieved: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'qinggu-wishlist';

function loadItems(): WishItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* noop */ }
  return [];
}

function saveItems(items: WishItem[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* noop */ }
}

const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const WishlistPage: React.FC = () => {
  const [items, setItems] = useState<WishItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<WishItem | null>(null);
  const [addAmount, setAddAmount] = useState<number | null>(null);
  const [addTarget, setAddTarget] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    setItems(loadItems());
  }, []);

  const sorted = useMemo(
    () => [...items].sort((a, b) => Number(a.achieved) - Number(b.achieved) || b.createdAt - a.createdAt),
    [items]
  );

  const totalTarget = items.filter((i) => !i.achieved).reduce((s, i) => s + i.price, 0);
  const totalSaved = items.filter((i) => !i.achieved).reduce((s, i) => s + Math.min(i.saved, i.price), 0);

  const openAdd = () => {
    setEditing(null);
    setAddAmount(null);
    setAddTarget(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (item: WishItem) => {
    setEditing(item);
    form.setFieldsValue({ title: item.title, price: item.price, note: item.note || '' });
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload: WishItem = {
        id: editing?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: values.title.trim(),
        price: values.price,
        note: (values.note || '').trim(),
        saved: editing?.saved ?? 0,
        achieved: editing?.achieved ?? false,
        createdAt: editing?.createdAt ?? Date.now(),
      };
      const next = editing
        ? items.map((i) => (i.id === editing.id ? payload : i))
        : [...items, payload];
      setItems(next);
      saveItems(next);
      setModalVisible(false);
      message.success(editing ? '已更新' : '心愿已加入');
    } catch { /* 校验失败 */ }
  };

  const handleDelete = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    saveItems(next);
    message.success('已删除');
  };

  const handleAddSaved = (item: WishItem, amount: number) => {
    const next = items.map((i) => {
      if (i.id !== item.id) return i;
      const saved = Math.min(i.price, i.saved + amount);
      return { ...i, saved, achieved: saved >= i.price };
    });
    setItems(next);
    saveItems(next);
    const updated = next.find((i) => i.id === item.id);
    if (updated?.achieved && !item.achieved) message.success(`🎉 恭喜!「${item.title}」攒够了!`);
  };

  return (
    <div className="page-card">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconTarget size={22} /> 心愿单
      </div>
      <p className="page-sub">把想要的东西记下来,一点点攒,成就感满满</p>

      <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="primary" icon={<IconPlusCircle size={16} />} onClick={openAdd}>
          许个心愿
        </Button>
        {totalTarget > 0 && (
          <span className="wish-summary">
            <IconWallet size={14} /> 待实现 {items.filter((i) => !i.achieved).length} 个 · 总目标 ¥{fmt(totalTarget)} · 已攒 ¥{fmt(totalSaved)}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <Empty description="还没有心愿,点击上方按钮许下第一个愿望吧" />
      ) : (
        <div className="wish-grid">
          {sorted.map((item) => {
            const percent = item.price > 0 ? Math.round((Math.min(item.saved, item.price) / item.price) * 100) : 0;
            return (
              <div key={item.id} className={`wish-card ${item.achieved ? 'achieved' : ''}`}>
                <div className="wish-card-head">
                  <span className="wish-emoji">{item.achieved ? '🎉' : '🎯'}</span>
                  <span className="wish-actions">
                    <Button type="text" size="small" icon={<IconEdit size={14} />} onClick={() => openEdit(item)} />
                    <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item.id)} okText="确定" cancelText="取消">
                      <Button type="text" size="small" danger icon={<IconTrash size={14} />} />
                    </Popconfirm>
                  </span>
                </div>
                <div className="wish-title">{item.title}</div>
                {item.note && <div className="wish-note">{item.note}</div>}
                <div className="wish-money">
                  <span className="wish-saved">已攒 ¥{fmt(item.saved)}</span>
                  <span className="wish-target">目标 ¥{fmt(item.price)}</span>
                </div>
                <Progress
                  percent={item.achieved ? 100 : percent}
                  status={item.achieved ? 'success' : percent >= 80 ? 'active' : 'normal'}
                  strokeColor={{ from: 'var(--qg-primary)', to: 'var(--qg-accent)' }}
                  size="small"
                />
                {!item.achieved ? (
                  <div className="wish-actions-row">
                    <span className="wish-add-label">攒一笔:</span>
                    {[10, 50, 100].map((v) => (
                      <Button key={v} size="small" onClick={() => handleAddSaved(item, v)}>
                        +{v}
                      </Button>
                    ))}
                    <InputNumber
                      size="small"
                      min={0.01}
                      max={item.price - item.saved}
                      placeholder="自定义"
                      style={{ width: 86 }}
                      value={addTarget === item.id ? addAmount : null}
                      onChange={(v) => { setAddAmount(v); setAddTarget(item.id); }}
                    />
                    <Button
                      size="small"
                      type="primary"
                      disabled={!addAmount || addTarget !== item.id}
                      onClick={() => { if (addAmount) handleAddSaved(item, addAmount); setAddAmount(null); setAddTarget(null); }}
                    >
                      存入
                    </Button>
                  </div>
                ) : (
                  <div className="wish-achieved-tip">已实现!恭喜 🎊</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={editing ? '编辑心愿' : '许个心愿'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="想要什么"
            name="title"
            rules={[{ required: true, message: '请输入心愿名称' }, { max: 40, message: '最多 40 个字' }]}
          >
            <Input placeholder="例如:Switch 游戏机 / 一次旅行" maxLength={40} />
          </Form.Item>
          <Form.Item
            label="目标金额（元）"
            name="price"
            rules={[{ required: true, message: '请输入目标金额' }, { type: 'number', min: 1, message: '至少 1 元' }]}
          >
            <InputNumber prefix="¥" placeholder="例如 2000" min={1} precision={2} style={{ width: '100%' }} size="large" />
          </Form.Item>
          <Form.Item label="备注（可选）" name="note" rules={[{ max: 80, message: '最多 80 个字' }]}>
            <Input.TextArea placeholder="为什么想要它?" rows={2} maxLength={80} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WishlistPage;
