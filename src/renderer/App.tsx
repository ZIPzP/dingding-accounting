/**
 * 青孤项目 — 应用根组件
 * 桌面端：左侧可折叠菜单（选中态左侧指示条）
 * 手机端：底部标签栏（触屏优化）
 * 全局：页面淡入动画
 */
import React, { useState, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Spin } from 'antd';
import type { MenuProps } from 'antd';
import { ThemeProvider } from './contexts/ThemeContext';
import {
  IconLogo,
  IconHome,
  IconBook,
  IconPlusCircle,
  IconChart,
  IconGamepad,
  IconSettings,
} from './components/Icons';

import HomePage from './pages/HomePage';
import BillList from './pages/BillList';
import AddRecord from './pages/AddRecord';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import GameHub from './pages/GameHub';
import SnakeGamePage from './pages/SnakeGamePage';
import TetrisGamePage from './pages/TetrisGamePage';
import Game2048Page from './pages/Game2048Page';
import MinesweeperPage from './pages/MinesweeperPage';
import BreakoutPage from './pages/BreakoutPage';
import WhackAMolePage from './pages/WhackAMolePage';
import TicTacToePage from './pages/TicTacToePage';

const { Sider, Content } = Layout;

/* 页面加载骨架屏 */
const PageLoader: React.FC = () => (
  <div className="page-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
    <Spin size="large" />
  </div>
);

/* 页面包装器：添加淡入动画 */
const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="page-enter">{children}</div>
);

/* 导航菜单项 */
const menuItems: MenuProps['items'] = [
  { key: '/',       icon: <IconHome size={20} />,       label: '首页' },
  { key: '/bills',  icon: <IconBook size={20} />,       label: '记账' },
  { key: '/game',   icon: <IconGamepad size={20} />,    label: '游戏' },
  { key: '/add',    icon: <IconPlusCircle size={20} />,  label: '记一笔' },
  { key: '/stats',  icon: <IconChart size={20} />,      label: '统计' },
  { key: '/settings', icon: <IconSettings size={20} />, label: '设置' },
];

/* 手机端底部导航项 */
const mobileTabs = [
  { key: '/',       Icon: IconHome,       label: '首页' },
  { key: '/bills',  Icon: IconBook,       label: '记账' },
  { key: '/game',   Icon: IconGamepad,    label: '游戏' },
  { key: '/stats',  Icon: IconChart,      label: '统计' },
  { key: '/settings', Icon: IconSettings,  label: '设置' },
];

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = window.innerWidth < 768;
  const [mobile, setMobile] = useState(isMobile);

  React.useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentKey = '/' + location.pathname.split('/')[1];

  /* ======== 手机端布局 ======== */
  if (mobile) {
    return (
      <Layout style={{ minHeight: '100vh', paddingBottom: 62 }}>
        <Content className={`main-content mobile-content ${currentKey === '/' ? 'landing-content' : ''}`}>
          <div className="mobile-header">
            <IconLogo size={22} /> 青孤项目
          </div>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
              <Route path="/bills" element={<AnimatedPage><BillList /></AnimatedPage>} />
              <Route path="/add" element={<AnimatedPage><AddRecord /></AnimatedPage>} />
              <Route path="/edit/:id" element={<AnimatedPage><AddRecord /></AnimatedPage>} />
              <Route path="/stats" element={<AnimatedPage><Statistics /></AnimatedPage>} />
              <Route path="/settings" element={<AnimatedPage><Settings /></AnimatedPage>} />
              <Route path="/game" element={<AnimatedPage><GameHub /></AnimatedPage>} />
              <Route path="/game/snake" element={<AnimatedPage><SnakeGamePage /></AnimatedPage>} />
              <Route path="/game/tetris" element={<AnimatedPage><TetrisGamePage /></AnimatedPage>} />
              <Route path="/game/2048" element={<AnimatedPage><Game2048Page /></AnimatedPage>} />
              <Route path="/game/minesweeper" element={<AnimatedPage><MinesweeperPage /></AnimatedPage>} />
              <Route path="/game/breakout" element={<AnimatedPage><BreakoutPage /></AnimatedPage>} />
              <Route path="/game/whackamole" element={<AnimatedPage><WhackAMolePage /></AnimatedPage>} />
              <Route path="/game/tictactoe" element={<AnimatedPage><TicTacToePage /></AnimatedPage>} />
            </Routes>
          </Suspense>
        </Content>

        {/* 底部导航栏 */}
        <div className="mobile-tab-bar">
          {mobileTabs.map(({ key, Icon, label }) => {
            const isActive = currentKey === key;
            return (
              <div
                key={key}
                className={`mobile-tab-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(key)}
              >
                <div className="mobile-tab-icon">
                  <Icon size={22} />
                </div>
                <span className="mobile-tab-label">{label}</span>
              </div>
            );
          })}
        </div>
      </Layout>
    );
  }

  /* ======== 桌面端布局 ======== */
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={220}
        style={{
          borderRight: '1px solid var(--qg-border)',
        }}
      >
        <div className="logo">
          <IconLogo size={24} />
          {!collapsed && <span>青孤项目</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Content className={`main-content ${currentKey === '/' ? 'landing-content' : ''}`}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
              <Route path="/bills" element={<AnimatedPage><BillList /></AnimatedPage>} />
              <Route path="/add" element={<AnimatedPage><AddRecord /></AnimatedPage>} />
              <Route path="/edit/:id" element={<AnimatedPage><AddRecord /></AnimatedPage>} />
              <Route path="/stats" element={<AnimatedPage><Statistics /></AnimatedPage>} />
              <Route path="/settings" element={<AnimatedPage><Settings /></AnimatedPage>} />
              <Route path="/game" element={<AnimatedPage><GameHub /></AnimatedPage>} />
              <Route path="/game/snake" element={<AnimatedPage><SnakeGamePage /></AnimatedPage>} />
              <Route path="/game/tetris" element={<AnimatedPage><TetrisGamePage /></AnimatedPage>} />
              <Route path="/game/2048" element={<AnimatedPage><Game2048Page /></AnimatedPage>} />
              <Route path="/game/minesweeper" element={<AnimatedPage><MinesweeperPage /></AnimatedPage>} />
              <Route path="/game/breakout" element={<AnimatedPage><BreakoutPage /></AnimatedPage>} />
              <Route path="/game/whackamole" element={<AnimatedPage><WhackAMolePage /></AnimatedPage>} />
              <Route path="/game/tictactoe" element={<AnimatedPage><TicTacToePage /></AnimatedPage>} />
            </Routes>
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
