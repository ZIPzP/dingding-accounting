/**
 * 记一笔 / 编辑记录 页面
 * 表单：金额、日期、分类（两级）、备注
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  Form,
  InputNumber,
  DatePicker,
  Cascader,
  Input,
  Button,
  Card,
  message,
  Spin,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;

const AddRecord: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);

  // 分类级联选项
  const [cascaderOptions, setCascaderOptions] = useState<
    { value: number; label: string; children: { value: number; label: string }[] }[]
  >([]);

  useEffect(() => {
    api.getCategories().then((cats) => {
      setCategories(cats);
      setCascaderOptions(
        cats.map((cat) => ({
          value: cat.id,
          label: `${cat.icon} ${cat.name}`,
          children: cat.subs.map((sub) => ({
            value: sub.id,
            label: sub.name,
          })),
        }))
      );
    });
  }, []);

  // 编辑模式：加载已有数据
  useEffect(() => {
    if (id) {
      api.getRecordById(Number(id)).then((record) => {
        if (record) {
          form.setFieldsValue({
            amount: record.amount,
            record_date: dayjs(record.record_date),
            category: record.sub_category_id
              ? [record.category_id, record.sub_category_id]
              : [record.category_id],
            note: record.note || '',
          });
        }
        setPageLoading(false);
      });
    }
  }, [id, form]);

  // 提交
  const handleSubmit = async (values: {
    amount: number;
    record_date: dayjs.Dayjs;
    category: [number, number?];
    note?: string;
  }) => {
    setLoading(true);
    try {
      const params = {
        amount: values.amount,
        record_date: values.record_date.format('YYYY-MM-DD'),
        category_id: values.category[0],
        sub_category_id: values.category[1] || null,
        note: values.note || '',
      };

      if (isEdit) {
        await api.updateRecord({ ...params, id: Number(id) });
        message.success('记录已更新');
      } else {
        await api.addRecord(params);
        message.success('记账成功！');
      }

      navigate('/');
    } catch (err) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="page-card" style={{ textAlign: 'center', paddingTop: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page-card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ marginRight: 12 }}
        />
        <span className="page-title" style={{ marginBottom: 0 }}>
          {isEdit ? '编辑记录' : '记一笔'}
        </span>
      </div>

      <Card style={{ maxWidth: 520 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            amount: undefined,
            record_date: dayjs(),
            category: undefined,
            note: '',
          }}
        >
          <Form.Item
            label="金额（元）"
            name="amount"
            rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0.01, message: '金额必须大于 0' },
            ]}
          >
            <InputNumber
              prefix="¥"
              placeholder="0.00"
              style={{ width: '100%' }}
              size="large"
              precision={2}
              min={0.01}
              controls={false}
              autoFocus={!isEdit}
            />
          </Form.Item>

          <Form.Item
            label="日期"
            name="record_date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" format="YYYY年M月D日" />
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Cascader
              options={cascaderOptions}
              placeholder="选择分类（一级→二级）"
              style={{ width: '100%' }}
              size="large"
              expandTrigger="hover"
            />
          </Form.Item>

          <Form.Item label="备注（可选）" name="note">
            <TextArea
              placeholder="例如：中午和同事吃饭"
              rows={2}
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
              block
            >
              {isEdit ? '保存修改' : '记录这笔花销'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddRecord;
