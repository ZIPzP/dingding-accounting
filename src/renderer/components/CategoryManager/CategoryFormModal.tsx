/**
 * 一级分类表单弹窗（新增 / 编辑）
 */
import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import EmojiPicker from './EmojiPicker';

interface CategoryFormModalProps {
  visible: boolean;
  editingCategory?: { id: number; name: string; icon: string; code: string } | null;
  onOk: (values: { name: string; icon: string; code: string }) => void;
  onCancel: () => void;
  submitting: boolean;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  visible,
  editingCategory,
  onOk,
  onCancel,
  submitting,
}) => {
  const [form] = Form.useForm<{ name: string; icon: string; code: string }>();
  const isEdit = !!editingCategory;

  useEffect(() => {
    if (visible) {
      if (editingCategory) {
        form.setFieldsValue({
          name: editingCategory.name,
          icon: editingCategory.icon,
          code: editingCategory.code,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingCategory, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch {
      // 表单校验不通过
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑一级分类' : '新增一级分类'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={submitting}
      okText={isEdit ? '保存' : '创建'}
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入分类名称' }]}
        >
          <Input placeholder="例如：宠物支出" maxLength={20} />
        </Form.Item>

        <Form.Item
          label="图标"
          name="icon"
          rules={[{ required: true, message: '请选择图标' }]}
          getValueFromEvent={(val: string) => val}
        >
          <EmojiPicker />
        </Form.Item>

        <Form.Item
          label="代码标识"
          name="code"
          rules={[
            { required: true, message: '请输入代码标识' },
            {
              pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
              message: '只能包含字母、数字和下划线，以字母或下划线开头',
            },
          ]}
          extra="用于数据导出和筛选，创建后不可修改"
        >
          <Input placeholder="例如：pet" maxLength={20} disabled={isEdit} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryFormModal;
