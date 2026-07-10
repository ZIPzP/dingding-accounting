/**
 * 子分类表单弹窗（新增 / 编辑）
 */
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';

interface SubCategoryFormModalProps {
  visible: boolean;
  categories: CategoryWithSubs[];
  parentCategoryId?: number | null;
  editingSubCategory?: { id: number; name: string; category_id: number } | null;
  onOk: (values: { category_id: number; name: string }) => void;
  onCancel: () => void;
  submitting: boolean;
}

const SubCategoryFormModal: React.FC<SubCategoryFormModalProps> = ({
  visible,
  categories,
  parentCategoryId,
  editingSubCategory,
  onOk,
  onCancel,
  submitting,
}) => {
  const [form] = Form.useForm<{ category_id: number; name: string }>();
  const isEdit = !!editingSubCategory;

  useEffect(() => {
    if (visible) {
      if (editingSubCategory) {
        form.setFieldsValue({
          category_id: editingSubCategory.category_id,
          name: editingSubCategory.name,
        });
      } else if (parentCategoryId) {
        form.setFieldsValue({
          category_id: parentCategoryId,
          name: '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingSubCategory, parentCategoryId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch {
      // 表单校验不通过
    }
  };

  const filteredCategories = categories.filter((c) => c.code !== '_deleted');

  return (
    <Modal
      title={isEdit ? '编辑子分类' : '新增子分类'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={submitting}
      okText={isEdit ? '保存' : '添加'}
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label="所属分类"
          name="category_id"
          rules={[{ required: true, message: '请选择所属分类' }]}
        >
          <Select disabled={isEdit || !!parentCategoryId}>
            {filteredCategories.map((c) => (
              <Select.Option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入子分类名称' }]}
        >
          <Input placeholder="例如：猫粮" maxLength={20} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SubCategoryFormModal;
