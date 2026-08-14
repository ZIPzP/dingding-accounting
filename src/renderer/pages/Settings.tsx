/**
 * 设置页面
 * 数据导出、备份恢复、关于信息、主题切换
 */
import React, { useState } from 'react';
import { Card, Button, Space, message, Modal, Typography, Descriptions, Divider, InputNumber, Checkbox, ColorPicker, Segmented } from 'antd';
import {
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { IconDownload, IconSave, IconUpload, IconInfo } from '../components/Icons';
import { api } from '../services/api';
import { getBudget, setBudget } from '../services/budget';
import CategoryManager from '../components/CategoryManager/CategoryManager';
import { useTheme } from '../contexts/ThemeContext';
import { buildCustomTheme, saveCustomTheme } from '../themes';

const { Title, Text, Paragraph } = Typography;

/** 是否已作为 PWA 安装运行 */
function isStandalone(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

function isIOS(): boolean {
  try {
    return /iPad|iPhone|iPod/i.test(navigator.userAgent);
  } catch {
    return false;
  }
}

const Settings: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [budgetValue, setBudgetValue] = useState<number | null>(() => {
    const b = getBudget();
    return b.amount > 0 ? b.amount : null;
  });
  const [savingBudget, setSavingBudget] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [clearChecked, setClearChecked] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customColor, setCustomColor] = useState('#06b6d4');
  const [customDark, setCustomDark] = useState<boolean>(true);
  const { currentTheme, setTheme, allThemes, refreshThemes } = useTheme();

  // 保存自定义主题
  const handleSaveCustomTheme = () => {
    const theme = buildCustomTheme(customColor, customDark);
    if (!theme) {
      message.error('颜色格式不正确');
      return;
    }
    saveCustomTheme(customColor, customDark);
    refreshThemes();
    setTheme(theme);
    setCustomModalVisible(false);
    message.success('🎨 你的专属主题已生效!');
  };

  // 清空全部数据
  const handleClearAll = async () => {
    setClearing(true);
    try {
      const result = await api.clearAllData();
      if (result.success) {
        Modal.success({
          title: '数据已清空',
          content: '所有账单与设置已恢复初始状态。',
          okText: '好的',
          onOk: () => window.location.reload(),
        });
      } else {
        message.error(result.error || '清空失败，请重试');
      }
    } catch {
      message.error('清空失败，请重试');
    } finally {
      setClearing(false);
      setClearModalVisible(false);
      setClearChecked(false);
    }
  };

  // 保存月度预算
  const handleSaveBudget = () => {
    setSavingBudget(true);
    setBudget(budgetValue ?? 0);
    setSavingBudget(false);
    message.success(budgetValue && budgetValue > 0 ? `月度预算已设置为 ¥${budgetValue}` : '已关闭月度预算');
  };

  // 导出 CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const { records } = await api.getRecords({ pageSize: 99999 });

      const headers = ['日期', '类型', '一级分类', '二级分类', '金额（元）', '备注'];
      const rows = records.map((r) => [
        r.record_date,
        r.type === 'income' ? '收入' : '支出',
        r.category_name,
        r.sub_category_name || '',
        r.amount.toFixed(2),
        r.note || '',
      ]);

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
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconInfo size={20} /> 设置
      </div>

      {/* 主题设置 */}
      <Card title="主题设置" style={{ marginBottom: 24 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          选择你喜欢的主题风格，切换后会立即生效
        </Text>
        <div className="theme-selector">
          {allThemes.map((theme) => (
            <div
              key={theme.id}
              className={`theme-option ${currentTheme.id === theme.id ? 'active' : ''}`}
              onClick={() => {
                setTheme(theme);
                message.success(`已切换到「${theme.name}」主题`);
              }}
            >
              <div
                className="theme-option-preview"
                style={{
                  background: theme.bgImage
                    ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`
                    : theme.primary,
                  backgroundImage: theme.bgImage ? `url("${theme.bgImage}")` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <span className="theme-option-name">{theme.name}</span>
            </div>
          ))}
          {/* 自定义主题入口 */}
          <div className="theme-option" onClick={() => setCustomModalVisible(true)}>
            <div
              className="theme-option-preview"
              style={{
                background: 'conic-gradient(from 0deg, #f43f5e, #f59e0b, #10b981, #06b6d4, #8b5cf6, #f43f5e)',
              }}
            />
            <span className="theme-option-name">🎨 自定义</span>
          </div>
        </div>
      </Card>

      {/* 预算设置 */}
      <Card title="🎯 月度预算" style={{ marginBottom: 24 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          设置每月支出预算，统计页会展示预算使用进度
        </Text>
        <Space wrap size="middle">
          <InputNumber
            prefix="¥"
            placeholder="例如 3000"
            min={0}
            precision={2}
            value={budgetValue}
            onChange={(v) => setBudgetValue(v as number | null)}
            style={{ width: 180 }}
            size="large"
          />
          <Button
            type="primary"
            icon={<IconSave size={16} />}
            onClick={handleSaveBudget}
            loading={savingBudget}
          >
            保存预算
          </Button>
          {budgetValue && budgetValue > 0 && (
            <Button onClick={() => { setBudgetValue(null); setBudget(0); message.success('已关闭月度预算'); }}>
              关闭预算
            </Button>
          )}
        </Space>
      </Card>

      {/* 分类管理 */}
      <Card title="📂 分类管理" style={{ marginBottom: 24 }}>
        <CategoryManager />
      </Card>

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
              icon={<IconDownload size={16} />}
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
              icon={<IconSave size={16} />}
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
              icon={<IconUpload size={16} />}
              onClick={handleRestore}
              loading={restoring}
              danger
            >
              恢复
            </Button>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <Text type="secondary" style={{ fontSize: 12.5, display: 'block', lineHeight: 1.7 }}>
            💡 跨设备迁移：手机端在浏览器里点「备份」下载 .db 文件 → 传到电脑 → 桌面应用或网页里点「恢复」选择该文件，即可把手机数据搬到电脑（反向同理）。
          </Text>
        </Space>
      </Card>

      {/* PWA 安装引导（未安装时显示） */}
      {!isStandalone() && (
        <Card title="📱 安装到手机/电脑" style={{ marginBottom: 24 }}>
          <Paragraph type="secondary" style={{ marginBottom: 8, fontSize: 13.5 }}>
            把青孤项目安装到主屏幕,像原生 App 一样全屏使用,还能离线打开。
          </Paragraph>
          {isIOS() ? (
            <Paragraph style={{ marginBottom: 0, fontSize: 13.5 }}>
              1️⃣ 用 <Text strong>Safari</Text> 打开本页面<br />
              2️⃣ 点底部 <Text strong>分享按钮</Text>(方框带箭头)<br />
              3️⃣ 选择 <Text strong>「添加到主屏幕」</Text> → 完成 ✅
            </Paragraph>
          ) : (
            <Paragraph style={{ marginBottom: 0, fontSize: 13.5 }}>
              1️⃣ 点浏览器地址栏右侧的 <Text strong>安装图标</Text>(⊕ 或 ↓)<br />
              2️⃣ 或在浏览器菜单里选择 <Text strong>「安装应用」/「添加到主屏幕」</Text> → 完成 ✅
            </Paragraph>
          )}
        </Card>
      )}

      {/* 危险操作 */}
      <Card title="⚠️ 危险操作" style={{ marginBottom: 24 }} className="danger-card">
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
            <Text strong>清空所有数据</Text>
            <br />
            <Text type="secondary">删除全部账单记录与分类设置,恢复到初始状态,不可撤销</Text>
          </div>
          <Button danger onClick={() => { setClearChecked(false); setClearModalVisible(true); }}>
            清空数据
          </Button>
        </div>
      </Card>

      {/* 关于 */}
      <Card title="ℹ️ 关于">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="应用名称">青孤项目</Descriptions.Item>
          <Descriptions.Item label="版本">1.6.0</Descriptions.Item>
          <Descriptions.Item label="技术栈">Electron + React + TypeScript</Descriptions.Item>
          <Descriptions.Item label="数据存储">
            本地 SQLite 数据库（数据完全保存在您的电脑上，不联网）
          </Descriptions.Item>
        </Descriptions>
        <Divider />
        <Paragraph type="secondary" style={{ fontSize: 13 }}>
          青孤项目是一款陪你打发无聊的离线工具集：8 款经典小游戏、智能收支记账、
          倒数日、番茄钟、白噪音、备忘录、心愿单、习惯打卡与年度报告。
          所有数据均保存在您的电脑上，不会上传至任何服务器。请定期备份数据以防丢失。
        </Paragraph>
        <Paragraph type="secondary" style={{ fontSize: 12, opacity: 0.8 }}>
          v1.6.0 更新:成就殿堂(18 枚徽章)、记账热力图、自定义专属主题。
        </Paragraph>
      </Card>

      {/* 清空数据确认弹窗 */}
      <Modal
        title="清空所有数据"
        open={clearModalVisible}
        onCancel={() => setClearModalVisible(false)}
        onOk={handleClearAll}
        okText="确认清空"
        cancelText="取消"
        okButtonProps={{ danger: true, disabled: !clearChecked, loading: clearing }}
        destroyOnClose
      >
        <div style={{ marginTop: 8 }}>
          <Paragraph>
            此操作将<Text strong type="danger">永久删除</Text>以下全部内容,且<Text strong type="danger">无法恢复</Text>:
          </Paragraph>
          <ul style={{ paddingLeft: 20, color: 'var(--qg-text-secondary)', fontSize: 13.5, lineHeight: 2 }}>
            <li>所有账单记录(支出/收入)</li>
            <li>所有自定义分类与子分类</li>
            <li>预算设置</li>
          </ul>
          <Checkbox checked={clearChecked} onChange={(e) => setClearChecked(e.target.checked)}>
            我明白,并已确认不需要这些数据(建议先备份)
          </Checkbox>
        </div>
      </Modal>

      {/* 自定义主题弹窗 */}
      <Modal
        title="🎨 创建专属主题"
        open={customModalVisible}
        onCancel={() => setCustomModalVisible(false)}
        onOk={handleSaveCustomTheme}
        okText="使用这个主题"
        cancelText="取消"
        destroyOnClose
      >
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            挑选一个主色,我们会自动生成一整套配色
          </Text>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 10 }}>主色调</Text>
              <ColorPicker
                value={customColor}
                onChange={(c) => setCustomColor(c.toHexString())}
                showText
                presets={[
                  { label: '推荐', colors: ['#06b6d4', '#4f6df5', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9', '#14b8a6', '#f97316'] },
                ]}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 10 }}>明暗模式</Text>
              <Segmented
                value={customDark ? 'dark' : 'light'}
                onChange={(v) => setCustomDark(v === 'dark')}
                options={[
                  { label: '🌙 深色', value: 'dark' },
                  { label: '☀️ 浅色', value: 'light' },
                ]}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 10 }}>预览</Text>
              <div
                className="custom-theme-preview"
                style={{
                  background: customDark ? 'hsl(220, 30%, 9%)' : 'hsl(220, 45%, 97%)',
                }}
              >
                <div className="ctp-card">
                  <span className="ctp-dot" style={{ background: customColor }} />
                  <span className="ctp-line" style={{ background: customDark ? '#e2e8f0' : '#1f2937' }} />
                </div>
                <div className="ctp-btn" style={{ background: customColor }}>按钮</div>
              </div>
            </div>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
