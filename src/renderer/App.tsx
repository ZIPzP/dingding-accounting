/**
 * 青孤项目 — 应用根组件
 * 桌面端：左侧可折叠菜单 + 顶部工具栏（页面标题 / 日期 / 快捷记一笔）
 * 手机端：底部标签栏（触屏优化）
 * 全局：路由懒加载（首屏性能）、页面淡入动画、动态页面标题
 */
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Spin, Button } from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { ThemeProvider } from './contexts/ThemeContext';
import {
  IconLogo,
  IconHome,
  IconBook,
  IconPlusCircle,
  IconChart,
  IconGamepad,
  IconSettings,
  IconCalendar,
} from './components/Icons';

dayjs.locale('zh-cn');

/* 页面懒加载：打开哪个页面才下载哪段代码，大幅提升首屏速度 */
const HomePage = lazy(() => import('./pages/HomePage'));
const BillList = lazy(() => import('./pages/BillList'));
const AddRecord = lazy(() => import('./pages/AddRecord'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Settings = lazy(() => import('./pages/Settings'));
const GameHub = lazy(() => import('./pages/GameHub'));
const SnakeGamePage = lazy(() => import('./pages/SnakeGamePage'));
const TetrisGamePage = lazy(() => import('./pages/TetrisGamePage'));
const Game2048Page = lazy(() => import('./pages/Game2048Page'));
const MinesweeperPage = lazy(() => import('./pages/MinesweeperPage'));
const BreakoutPage = lazy(() => import('./pages/BreakoutPage'));
const WhackAMolePage = lazy(() => import('./pages/WhackAMolePage'));
const TicTacToePage = lazy(() => import('./pages/TicTacToePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

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

/* 路由元信息：顶栏标题 / 描述 / 浏览器标签页标题 */
interface RouteMeta {
  title: string;
  desc?: string;
}

const routeMetaMap: Record<string, RouteMeta> = {
  '/': { title: '首页', desc: '无聊救星 · 随时解闷' },
  '/bills': { title: '记账', desc: '账单明细与搜索' },
  '/add': { title: '记一笔', desc: '快速记录一笔开销' },
  '/edit': { title: '编辑账单', desc: '修改账单信息' },
  '/stats': { title: '统计', desc: '月度消费分析' },
  '/settings': { title: '设置', desc: '主题与数据管理' },
  '/game': { title: '游戏中心', desc: '7 款经典小游戏' },
  '/game/snake': { title: '贪吃蛇', desc: '怀旧经典 · 排行榜' },
  '/game/tetris': { title: '俄罗斯方块', desc: '消除益智 · 挑战高分' },
  '/game/2048': { title: '2048', desc: '数字策略 · 滑动合并' },
  '/game/minesweeper': { title: '扫雷', desc: '逻辑推理 · 初/中/高级' },
  '/game/breakout': { title: '打砖块', desc: '动作反应 · 关卡推进' },
  '/game/whackamole': { title: '打地鼠', desc: '限时挑战 · 眼疾手快' },
  '/game/tictactoe': { title: '井字棋', desc: '策略对战 · 三子连珠' },
};

function resolveRouteMeta(pathname: string): RouteMeta | undefined {
  if (routeMetaMap[pathname]) return routeMetaMap[pathname];
  const first = '/' + pathname.split('/')[1];
  return routeMetaMap[first];
}

/* 路由表（桌面端 / 手机端共用，避免重复维护） */
const appRoutes = (
  <>
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
    <Route path="*" element={<AnimatedPage><NotFoundPage /></AnimatedPage>} />
  </>
);

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentKey = '/' + location.pathname.split('/')[1];
  const meta = resolveRouteMeta(location.pathname);

  /* 浏览器标签页标题跟随页面变化 */
  useEffect(() => {
    document.title = meta ? `${meta.title} · 青孤项目` : '青孤项目 · 离线工具集';
  }, [meta]);

  /* ======== 手机端布局 ======== */
  if (mobile) {
    return (
      <Layout style={{ minHeight: '100vh', paddingBottom: 62 }}>
        <Content className={`main-content mobile-content ${currentKey === '/' ? 'landing-content' : ''}`}>
          <div className="mobile-header">
            <IconLogo size={22} /> 青孤项目
          </div>
          <Suspense fallback={<PageLoader />}>
            <Routes>{appRoutes}</Routes>
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
      <Layout className="desktop-shell">
        {/* 顶部工具栏 */}
        <header className="desktop-topbar">
          <div className="desktop-topbar-left">
            <span className="desktop-topbar-title">{meta?.title ?? '青孤项目'}</span>
            {meta?.desc && <span className="desktop-topbar-desc">{meta.desc}</span>}
          </div>
          <div className="desktop-topbar-right">
            <span className="desktop-topbar-date">
              <IconCalendar size={14} />
              {dayjs().format('M月D日 dddd')}
            </span>
            <Button
              type="primary"
              icon={<IconPlusCircle size={16} />}
              onClick={() => navigate('/add')}
            >
              记一笔
            </Button>
          </div>
        </header>
        <Content className={`main-content ${currentKey === '/' ? 'landing-content' : ''}`}>
          <Suspense fallback={<PageLoader />}>
            <Routes>{appRoutes}</Routes>
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
