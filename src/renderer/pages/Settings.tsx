/**
 * 设置页面
 * 数据导出、备份恢复、关于信息
 */
import React, { useState } from 'react';
import { Card, Button, Space, message, Modal, Typography, Descriptions, Divider } from 'antd';
import {
  ExportOutlined,
  SaveOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text, Paragraph } = Typography;

const Settings: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // 导出 CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // 获取所有记录
      const { records } = await api.getRecords({ pageSize: 99999 });

      // 构建 CSV 内容
      const headers = ['日期', '一级分类', '二级分类', '金额（元）', '备注'];
      const rows = records.map((r) => [
        r.record_date,
        r.category_name,
        r.sub_category_name || '',
        r.amount.toFixed(2),
        r.note || '',
      ]);

      // CSV 转义（处理含逗号或引号的字段）
      const escapeCSV = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(','))
        .join('\n');

      const result = await api.exportCSV(csvContent);
      if (result.success) {
        message.success('导出成功！');
      }
    } catch (err) {
      message.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 备份数据库
  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const result = await api.backupDatabase();
      if (result.success) {
        message.success('备份成功！');
      }
    } catch (err) {
      message.error('备份失败，请重试');
    } finally {
      setBackingUp(false);
    }
  };

  // 恢复数据库
  const handleRestore = () => {
    Modal.confirm({
      title: '确认恢复数据',
      icon: <ExclamationCircleOutlined />,
      content: '恢复数据将覆盖当前所有记录，此操作不可撤销。请确保已备份当前数据。',
      okText: '我已知晓，开始恢复',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setRestoring(true);
        try {
          const result = await api.restoreDatabase();
          if (result.success) {
            Modal.info({
              title: '恢复成功',
              content: '数据已恢复，请重新启动应用以完成操作。',
              okText: '我知道了',
            });
          } else {
            message.error(result.error || '恢复失败');
          }
        } catch (err) {
          message.error('恢复失败，请重试');
        } finally {
          setRestoring(false);
        }
      },
    });
  };

  return (
    <div className="page-card">
      <div className="page-title">设置</div>

      {/* 数据管理 */}
      <Card title="💾 数据管理" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <Text strong>导出账单</Text>
              <br />
              <Text type="secondary">将所有账单数据导出为 CSV 文件，可用 Excel 打开</Text>
            </div>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExportCSV}
              loading={exporting}
            >
              导出 CSV
            </Button>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <Text strong>备份数据</Text>
              <br />
              <Text type="secondary">将数据库文件备份到指定位置，建议定期备份</Text>
            </div>
            <Button
              icon={<SaveOutlined />}
              onClick={handleBackup}
              loading={backingUp}
            >
              备份
            </Button>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <Text strong>恢复数据</Text>
              <br />
              <Text type="secondary">从备份文件恢复数据（将覆盖当前所有记录）</Text>
            </div>
            <Button
              icon={<UploadOutlined />}
              onClick={handleRestore}
              loading={restoring}
              danger
            >
              恢复
            </Button>
          </div>
        </Space>
      </Card>

      {/* 关于 */}
      <Card title="ℹ️ 关于">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="应用名称">钉钉记账</Descriptions.Item>
          <Descriptions.Item label="版本">1.0.0</Descriptions.Item>
          <Descriptions.Item label="技术栈">Electron + React + TypeScript</Descriptions.Item>
          <Descriptions.Item label="数据存储">
            本地 SQLite 数据库（数据完全保存在您的电脑上，不联网）
          </Descriptions.Item>
        </Descriptions>
        <Divider />
        <Paragraph type="secondary" style={{ fontSize: 13 }}>
          钉钉记账是一款本地运行的个人记账工具，所有数据均保存在您的电脑上，
          不会上传至任何服务器。请定期备份数据以防丢失。
        </Paragraph>
      </Card>
    </div>
  );
};

export default Settings;
