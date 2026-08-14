/**
 * 记一笔 / 编辑记录 页面
 * 支持支出 / 收入两种类型，表单：类型、金额、日期、分类（两级）、备注
 */
import React, { useEffect, useMemo, useState } from 'react';
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
  Segmented,
  message,
  Spin,
} from 'antd';
import { IconSave, IconLeft } from '../components/Icons';
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

  // 记录类型：支出 / 收入
  const [recordType, setRecordType] = useState<'expense' | 'income'>('expense');
  const isIncome = recordType === 'income';

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  /* 按类型过滤分类 */
  const cascaderOptions = useMemo(
    () =>
      categories
        .filter((cat) => cat.kind === recordType)
        .map((cat) => ({
          value: cat.id,
          label: `${cat.icon} ${cat.name}`,
          children: cat.subs.map((sub) => ({
            value: sub.id,
            label: sub.name,
          })),
        })),
    [categories, recordType]
  );

  // 编辑模式：加载已有数据
  useEffect(() => {
    if (id) {
      api.getRecordById(Number(id)).then((record) => {
        if (record) {
          const type = record.type === 'income' ? 'income' : 'expense';
          setRecordType(type);
          form.setFieldsValue({
            type,
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

  // 切换类型时清空已选分类
  const handleTypeChange = (val: 'expense' | 'income') => {
    setRecordType(val);
    form.setFieldsValue({ type: val, category: undefined });
  };

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
        type: recordType,
      };

      if (isEdit) {
        await api.updateRecord({ ...params, id: Number(id) });
        message.success('记录已更新');
      } else {
        await api.addRecord(params);
        message.success(isIncome ? '收入已记录！' : '记账成功！');
      }

      navigate('/bills');
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
          icon={<IconLeft size={18} />}
          onClick={() => navigate('/bills')}
          style={{ marginRight: 12 }}
        />
        <span className="page-title" style={{ marginBottom: 0 }}>
          {isEdit ? '编辑记录' : '记一笔'}
        </span>
      </div>

      <Card style={{ maxWidth: 520, borderRadius: 14 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'expense',
            amount: undefined,
            record_date: dayjs(),
            category: undefined,
            note: '',
          }}
        >
          {/* 类型切换 */}
          <Form.Item label="类型" name="type">
            <Segmented
              block
              size="large"
              value={recordType}
              onChange={(val) => handleTypeChange(val as 'expense' | 'income')}
              options={[
                { label: '💸 支出', value: 'expense' },
                { label: '💰 收入', value: 'income' },
              ]}
              className={isIncome ? 'seg-income' : 'seg-expense'}
            />
          </Form.Item>

          <Form.Item
            label={isIncome ? '收入金额（元）' : '支出金额（元）'}
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
              className={isIncome ? 'input-income' : 'input-expense'}
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
            label={isIncome ? '收入来源' : '分类'}
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Cascader
              options={cascaderOptions}
              placeholder="选择分类（一级→二级）"
              style={{ width: '100%' }}
              size="large"
              expandTrigger="hover"
              notFoundContent={isIncome ? '暂无收入分类，可在设置中添加' : '暂无分类'}
            />
          </Form.Item>

          <Form.Item label="备注（可选）" name="note">
            <TextArea
              placeholder={isIncome ? '例如：这个月工资' : '例如：中午和同事吃饭'}
              rows={2}
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<IconSave size={16} />}
              loading={loading}
              size="large"
              block
            >
              {isEdit ? '保存修改' : isIncome ? '记下这笔收入' : '记录这笔支出'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddRecord;
