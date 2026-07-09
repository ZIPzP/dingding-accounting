/**
 * 应用根组件
 * 桌面端：左侧可折叠菜单
 * 手机端：底部标签栏（触屏优化）
 */
import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  PlusCircleOutlined,
  PieChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import HomePage from './pages/HomePage';
import AddRecord from './pages/AddRecord';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

const { Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  { key: '/', icon: <HomeOutlined />, label: '账单' },
  { key: '/add', icon: <PlusCircleOutlined />, label: '记一笔' },
  { key: '/stats', icon: <PieChartOutlined />, label: '统计' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
];

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = window.innerWidth < 768;
  const [mobile, setMobile] = useState(isMobile);

  // 监听窗口大小变化
  React.useEffect(() => {
    const handleResize = () => {
      setMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentKey = '/' + location.pathname.split('/')[1];

  // 手机端布局
  if (mobile) {
    return (
      <Layout style={{ minHeight: '100vh', paddingBottom: 56 }}>
        <Content className="main-content mobile-content">
          <div className="mobile-header">
            📒 青孤记账
          </div>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add" element={<AddRecord />} />
            <Route path="/edit/:id" element={<AddRecord />} />
            <Route path="/stats" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>

        {/* 底部导航栏 */}
        <div className="mobile-tab-bar">
          {menuItems.map((item) => {
            const key = String(item?.key || '');
            const isActive = currentKey === key;
            return (
              <div
                key={key}
                className={`mobile-tab-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(key)}
              >
                <span className="mobile-tab-icon">{item?.icon}</span>
                <span className="mobile-tab-label">{item?.label}</span>
              </div>
            );
          })}
        </div>
      </Layout>
    );
  }

  // 桌面端布局
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div className="logo">
          {collapsed ? '📒' : '📒 青孤记账'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Content className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add" element={<AddRecord />} />
            <Route path="/edit/:id" element={<AddRecord />} />
            <Route path="/stats" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
