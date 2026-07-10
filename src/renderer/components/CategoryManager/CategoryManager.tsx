/**
 * 分类管理组件
 * 展示所有一级分类和子分类，支持新增、编辑、删除
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Button, Space, Typography, Divider, Spin, Modal, message, Tag, Popconfirm } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';
import CategoryFormModal from './CategoryFormModal';
import SubCategoryFormModal from './SubCategoryFormModal';

const { Text } = Typography;

// 预置分类代码（用于删除时提示）
const PRESET_CODES = [
  'food', 'transport', 'shopping', 'housing', 'entertainment',
  'health', 'education', 'social', 'other',
];

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 弹窗状态
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryWithSubs | null>(null);

  const [subModalVisible, setSubModalVisible] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCategory | null>(null);
  const [subParentId, setSubParentId] = useState<number | null>(null);

  const loadCategories = useCallback(() => {
    setLoading(true);
    api.getAllCategories().then((cats) => {
      setCategories(cats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // ========= 一级分类操作 =========

  const handleAddCat = () => {
    setEditingCat(null);
    setCatModalVisible(true);
  };

  const handleEditCat = (cat: CategoryWithSubs) => {
    setEditingCat(cat);
    setCatModalVisible(true);
  };

  const handleCatSubmit = async (values: { name: string; icon: string; code: string }) => {
    setSubmitting(true);
    try {
      if (editingCat) {
        const result = await api.updateCategory(editingCat.id, {
          name: values.name,
          icon: values.icon,
        });
        if (result.success) {
          message.success('分类已更新');
          setCatModalVisible(false);
          loadCategories();
        } else {
          message.error(result.error || '更新失败');
        }
      } else {
        const result = await api.addCategory(values);
        if (result.success) {
          message.success('分类已添加');
          setCatModalVisible(false);
          loadCategories();
        } else {
          message.error(result.error || '添加失败');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCat = (cat: CategoryWithSubs) => {
    const isPreset = PRESET_CODES.includes(cat.code);

    Modal.confirm({
      title: `确定删除分类「${cat.icon} ${cat.name}」？`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>该操作不可撤销。</p>
          {cat.subs.length > 0 && (
            <p>该分类下的 <strong>{cat.subs.length}</strong> 个子分类也会被删除。</p>
          )}
          {isPreset && (
            <p style={{ color: '#faad14' }}>
              ⚠️ 这是预置分类，删除后如需恢复需重置数据库。
            </p>
          )}
          <p>使用此分类的已有记录将自动归类为"已删除"。</p>
        </div>
      ),
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const result = await api.deleteCategory(cat.id);
        if (result.success) {
          message.success(
            `已删除「${cat.name}」${result.affectedRecords > 0
              ? `，${result.affectedRecords} 条记录已归入"已删除"`
              : ''}`
          );
          loadCategories();
        } else {
          message.error(result.error || '删除失败');
        }
      },
    });
  };

  // ========= 子分类操作 =========

  const handleAddSub = (cat: CategoryWithSubs) => {
    setEditingSub(null);
    setSubParentId(cat.id);
    setSubModalVisible(true);
  };

  const handleEditSub = (cat: CategoryWithSubs, sub: SubCategory) => {
    setEditingSub({ ...sub, category_id: cat.id } as SubCategory);
    setSubParentId(null);
    setSubModalVisible(true);
  };

  const handleSubSubmit = async (values: { category_id: number; name: string }) => {
    setSubmitting(true);
    try {
      if (editingSub && editingSub.id) {
        const result = await api.updateSubCategory(editingSub.id, values.name);
        if (result.success) {
          message.success('子分类已更新');
          setSubModalVisible(false);
          loadCategories();
        } else {
          message.error(result.error || '更新失败');
        }
      } else {
        const result = await api.addSubCategory(values);
        if (result.success) {
          message.success('子分类已添加');
          setSubModalVisible(false);
          loadCategories();
        } else {
          message.error(result.error || '添加失败');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSub = (sub: SubCategory) => {
    Modal.confirm({
      title: `确定删除子分类「${sub.name}」？`,
      content: '使用此子分类的已有记录将清除子分类信息。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const result = await api.deleteSubCategory(sub.id);
        if (result.success) {
          message.success(
            `已删除「${sub.name}」${result.affectedRecords > 0
              ? `，${result.affectedRecords} 条记录已更新`
              : ''}`
          );
          loadCategories();
        } else {
          message.error(result.error || '删除失败');
        }
      },
    });
  };

  // 过滤掉系统分类
  const displayCategories = categories.filter((c) => c.code !== '_deleted');

  return (
    <div className="category-manager">
      <Spin spinning={loading}>
        {/* 新增一级分类按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCat}>
            新增一级分类
          </Button>
        </div>

        {/* 分类列表 */}
        {displayCategories.map((cat, idx) => (
          <React.Fragment key={cat.id}>
            {idx > 0 && <Divider style={{ margin: '8px 0' }} />}

            {/* 一级分类行 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                padding: '8px 0',
              }}
            >
              <div>
                <span style={{ fontSize: 20, marginRight: 8 }}>{cat.icon}</span>
                <Text strong style={{ fontSize: 16 }}>
                  {cat.name}
                </Text>
                {PRESET_CODES.includes(cat.code) && (
                  <Tag style={{ marginLeft: 8, fontSize: 10 }} color="default">
                    预置
                  </Tag>
                )}
              </div>
              <Space size="small">
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddSub(cat)}
                >
                  子分类
                </Button>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditCat(cat)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除？"
                  onConfirm={() => handleDeleteCat(cat)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button size="small" icon={<DeleteOutlined />} danger />
                </Popconfirm>
              </Space>
            </div>

            {/* 子分类列表 */}
            {cat.subs.map((sub) => (
              <div
                key={sub.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginLeft: 28,
                  padding: '2px 0',
                }}
              >
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {sub.name}
                </Text>
                <Space size="small">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditSub(cat, sub)}
                  />
                  <Popconfirm
                    title="确定删除？"
                    onConfirm={() => handleDeleteSub(sub)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            ))}

            {cat.subs.length === 0 && (
              <div style={{ marginLeft: 28, padding: '4px 0' }}>
                <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
                  暂无子分类
                </Text>
              </div>
            )}
          </React.Fragment>
        ))}

        {displayCategories.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
            暂无分类，请点击上方按钮添加
          </div>
        )}
      </Spin>

      {/* 一级分类弹窗 */}
      <CategoryFormModal
        visible={catModalVisible}
        editingCategory={
          editingCat
            ? { id: editingCat.id, name: editingCat.name, icon: editingCat.icon, code: editingCat.code }
            : null
        }
        onOk={handleCatSubmit}
        onCancel={() => setCatModalVisible(false)}
        submitting={submitting}
      />

      {/* 子分类弹窗 */}
      <SubCategoryFormModal
        visible={subModalVisible}
        categories={categories}
        parentCategoryId={subParentId}
        editingSubCategory={
          editingSub
            ? { id: editingSub.id, name: editingSub.name, category_id: (editingSub as any).category_id }
            : null
        }
        onOk={handleSubSubmit}
        onCancel={() => setSubModalVisible(false)}
        submitting={submitting}
      />
    </div>
  );
};

export default CategoryManager;
