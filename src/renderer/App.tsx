/**
 * 青孤项目 — 应用根组件
 * 桌面端：左侧可折叠菜单（工具分组）+ 顶部工具栏（标题 / 搜索 / 换主题 / 日期 / 记一笔）
 * 手机端：底部标签栏（5 项）+ 悬浮记一笔按钮 + 头部搜索/设置
 * 全局：命令面板(Ctrl+K)、开场品牌动画、路由懒加载、页面切换帷幕、阅读进度条
 */
import React, { useState, Suspense, lazy, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Spin, Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette, { type PaletteItem } from './components/CommandPalette';
import SplashScreen from './components/SplashScreen';
import { api } from './services/api';
import { achSetMax } from './services/achievements';
import './services/fox'; // 注册青狐伙伴的全局事件监听（应用内行为自动赚狐粮）
import {
  IconLogo,
  IconHome,
  IconBook,
  IconPlusCircle,
  IconChart,
  IconGamepad,
  IconSettings,
  IconCalendar,
  IconTools,
  IconHourglass,
  IconTimer,
  IconNote,
  IconWave,
  IconTarget,
  IconCheckCircle,
  IconReport,
  IconSearch,
  IconPalette,
  IconTower,
} from './components/Icons';

dayjs.locale('zh-cn');

/* 页面懒加载：打开哪个页面才下载哪段代码，大幅提升首屏速度 */
const HomePage = lazy(() => import('./pages/HomePage'));
const BillList = lazy(() => import('./pages/BillList'));
const AddRecord = lazy(() => import('./pages/AddRecord'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Settings = lazy(() => import('./pages/Settings'));
const GameHub = lazy(() => import('./pages/GameHub'));
const ToolsHub = lazy(() => import('./pages/ToolsHub'));
const CountdownPage = lazy(() => import('./pages/CountdownPage'));
const PomodoroPage = lazy(() => import('./pages/PomodoroPage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const WhiteNoisePage = lazy(() => import('./pages/WhiteNoisePage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const HabitsPage = lazy(() => import('./pages/HabitsPage'));
const AnnualReport = lazy(() => import('./pages/AnnualReport'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const FoxPage = lazy(() => import('./pages/FoxPage'));
const TimeCapsulePage = lazy(() => import('./pages/TimeCapsulePage'));
const MusicStudioPage = lazy(() => import('./pages/MusicStudioPage'));
const StackGamePage = lazy(() => import('./pages/StackGamePage'));
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

/* 导航菜单项（桌面端） */
const menuItems: MenuProps['items'] = [
  { key: '/', icon: <IconHome size={20} />, label: '首页' },
  { key: '/fox', icon: <span style={{ fontSize: 16 }}>🦊</span>, label: '青狐伙伴' },
  {
    key: 'tools',
    icon: <IconTools size={20} />,
    label: '工具',
    children: [
      { key: '/tools', icon: <IconTools size={18} />, label: '工具中心' },
      { key: '/bills', icon: <IconBook size={18} />, label: '收支记账' },
      { key: '/add', icon: <IconPlusCircle size={18} />, label: '记一笔' },
      { key: '/tools/countdown', icon: <IconHourglass size={18} />, label: '倒数日' },
      { key: '/tools/pomodoro', icon: <IconTimer size={18} />, label: '番茄钟' },
      { key: '/tools/whitenoise', icon: <IconWave size={18} />, label: '白噪音' },
      { key: '/tools/notes', icon: <IconNote size={18} />, label: '备忘录' },
      { key: '/tools/wishlist', icon: <IconTarget size={18} />, label: '心愿单' },
      { key: '/tools/habits', icon: <IconCheckCircle size={18} />, label: '习惯打卡' },
      { key: '/tools/capsule', icon: <span style={{ fontSize: 15 }}>💌</span>, label: '时间胶囊' },
      { key: '/tools/music', icon: <IconNote size={18} />, label: '音乐工坊' },
    ],
  },
  { key: '/game', icon: <IconGamepad size={20} />, label: '游戏' },
  { key: '/achievements', icon: <IconTower size={20} />, label: '成就' },
  {
    key: 'stats',
    icon: <IconChart size={20} />,
    label: '统计',
    children: [
      { key: '/stats', icon: <IconChart size={18} />, label: '统计分析' },
      { key: '/report', icon: <IconReport size={18} />, label: '年度报告' },
    ],
  },
  { key: '/settings', icon: <IconSettings size={20} />, label: '设置' },
];

/* 手机端底部导航项 */
const mobileTabs = [
  { key: '/', Icon: IconHome, label: '首页' },
  { key: '/tools', Icon: IconTools, label: '工具' },
  { key: '/bills', Icon: IconBook, label: '记账' },
  { key: '/game', Icon: IconGamepad, label: '游戏' },
  { key: '/stats', Icon: IconChart, label: '统计' },
];

/* 路由元信息：顶栏标题 / 描述 / 浏览器标签页标题 */
interface RouteMeta {
  title: string;
  desc?: string;
}

const routeMetaMap: Record<string, RouteMeta> = {
  '/': { title: '首页', desc: '无聊救星 · 随时解闷' },
  '/tools': { title: '生活工具', desc: '记账 · 倒数日 · 番茄钟 · 白噪音 · 心愿单 · 备忘录' },
  '/tools/countdown': { title: '倒数日', desc: '重要日子不错过' },
  '/tools/pomodoro': { title: '番茄钟', desc: '专注 25 分钟，效率翻倍' },
  '/tools/whitenoise': { title: '白噪音', desc: '雨声 · 海浪 · 篝火，实时合成' },
  '/tools/notes': { title: '备忘录', desc: '灵感与待办随手记' },
  '/tools/wishlist': { title: '心愿单', desc: '想要的东西，一点点攒' },
  '/tools/habits': { title: '习惯打卡', desc: '每天一点点，坚持看得见' },
  '/bills': { title: '收支记账', desc: '账单明细与搜索' },
  '/add': { title: '记一笔', desc: '智能记账 · 像聊天一样记账' },
  '/edit': { title: '编辑账单', desc: '修改账单信息' },
  '/stats': { title: '统计分析', desc: '月度收支与预算' },
  '/report': { title: '年度报告', desc: '这一年的每一笔,都有意义' },
  '/achievements': { title: '成就殿堂', desc: '每一份坚持,都有勋章' },
  '/fox': { title: '青狐伙伴', desc: '把应用用起来,把它养大' },
  '/tools/capsule': { title: '时间胶囊', desc: '写信给未来的自己' },
  '/tools/music': { title: '音乐工坊', desc: '8-bit 编曲器,点格子作曲' },
  '/settings': { title: '设置', desc: '主题、预算与数据管理' },
  '/game': { title: '游戏中心', desc: '8 款经典小游戏' },
  '/game/stack': { title: '叠叠高', desc: '全新 3D 叠塔 · 完美连击' },
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

/* 命令面板候选（页面快捷导航） */
const paletteNav: { path: string; label: string; desc?: string; icon: React.ReactNode }[] = [
  { path: '/', label: '首页', desc: '无聊救星 · 随时解闷', icon: <IconHome size={17} /> },
  { path: '/add', label: '记一笔', desc: '智能记账 · 像聊天一样记账', icon: <IconPlusCircle size={17} /> },
  { path: '/tools', label: '工具中心', desc: '全部生活工具', icon: <IconTools size={17} /> },
  { path: '/bills', label: '收支记账', desc: '账单明细与搜索', icon: <IconBook size={17} /> },
  { path: '/tools/countdown', label: '倒数日', desc: '重要日子不错过', icon: <IconHourglass size={17} /> },
  { path: '/tools/pomodoro', label: '番茄钟', desc: '专注 25 分钟', icon: <IconTimer size={17} /> },
  { path: '/tools/whitenoise', label: '白噪音', desc: '雨声 · 海浪 · 篝火', icon: <IconWave size={17} /> },
  { path: '/tools/notes', label: '备忘录', desc: '灵感与待办', icon: <IconNote size={17} /> },
  { path: '/tools/wishlist', label: '心愿单', desc: '攒钱进度', icon: <IconTarget size={17} /> },
  { path: '/tools/habits', label: '习惯打卡', desc: '坚持看得见', icon: <IconCheckCircle size={17} /> },
  { path: '/report', label: '年度报告', desc: '有仪式感的总结', icon: <IconReport size={17} /> },
  { path: '/achievements', label: '成就殿堂', desc: '每一份坚持,都有勋章', icon: <IconTower size={17} /> },
  { path: '/fox', label: '青狐伙伴', desc: '把应用用起来,把它养大', icon: <span style={{ fontSize: 16 }}>🦊</span> },
  { path: '/tools/capsule', label: '时间胶囊', desc: '写信给未来的自己', icon: <span style={{ fontSize: 16 }}>💌</span> },
  { path: '/tools/music', label: '音乐工坊', desc: '点格子作曲', icon: <IconNote size={17} /> },
  { path: '/stats', label: '统计分析', desc: '月度收支与预算', icon: <IconChart size={17} /> },
  { path: '/game', label: '游戏中心', desc: '8 款经典小游戏', icon: <IconGamepad size={17} /> },
  { path: '/settings', label: '设置', desc: '主题、预算与数据', icon: <IconSettings size={17} /> },
];

/* 路由表（桌面端 / 手机端共用，避免重复维护） */
const appRoutes = (
  <>
    <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
    <Route path="/tools" element={<AnimatedPage><ToolsHub /></AnimatedPage>} />
    <Route path="/tools/countdown" element={<AnimatedPage><CountdownPage /></AnimatedPage>} />
    <Route path="/tools/pomodoro" element={<AnimatedPage><PomodoroPage /></AnimatedPage>} />
    <Route path="/tools/whitenoise" element={<AnimatedPage><WhiteNoisePage /></AnimatedPage>} />
    <Route path="/tools/notes" element={<AnimatedPage><NotesPage /></AnimatedPage>} />
    <Route path="/tools/wishlist" element={<AnimatedPage><WishlistPage /></AnimatedPage>} />
    <Route path="/tools/habits" element={<AnimatedPage><HabitsPage /></AnimatedPage>} />
    <Route path="/bills" element={<AnimatedPage><BillList /></AnimatedPage>} />
    <Route path="/add" element={<AnimatedPage><AddRecord /></AnimatedPage>} />
    <Route path="/edit/:id" element={<AnimatedPage><AddRecord /></AnimatedPage>} />
    <Route path="/stats" element={<AnimatedPage><Statistics /></AnimatedPage>} />
    <Route path="/report" element={<AnimatedPage><AnnualReport /></AnimatedPage>} />
    <Route path="/achievements" element={<AnimatedPage><AchievementsPage /></AnimatedPage>} />
    <Route path="/fox" element={<AnimatedPage><FoxPage /></AnimatedPage>} />
    <Route path="/tools/capsule" element={<AnimatedPage><TimeCapsulePage /></AnimatedPage>} />
    <Route path="/tools/music" element={<AnimatedPage><MusicStudioPage /></AnimatedPage>} />
    <Route path="/settings" element={<AnimatedPage><Settings /></AnimatedPage>} />
    <Route path="/game" element={<AnimatedPage><GameHub /></AnimatedPage>} />
    <Route path="/game/stack" element={<AnimatedPage><StackGamePage /></AnimatedPage>} />
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

/** 顶部阅读进度条（绑定实际滚动容器） */
const ScrollProgress: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>('.main-content');
        if (!el || !barRef.current) return;
        const max = el.scrollHeight - el.clientHeight;
        const p = max > 0 ? el.scrollTop / max : 0;
        barRef.current.style.transform = `scaleX(${p})`;
      });
    };
    const timer = setInterval(() => {
      const el = document.querySelector<HTMLElement>('.main-content');
      if (el) {
        el.addEventListener('scroll', update, { passive: true });
        update();
        clearInterval(timer);
      }
    }, 200);
    return () => {
      clearInterval(timer);
      cancelAnimationFrame(raf);
      document.querySelector<HTMLElement>('.main-content')?.removeEventListener('scroll', update);
    };
  }, []);

  return <div className="scroll-progress" ref={barRef} />;
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme, setTheme, allThemes } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [curtainKey, setCurtainKey] = useState(0);

  /* 最近访问（命令面板） */
  const [recentPaths, setRecentPaths] = useState<string[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('qinggu-recent') || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  });

  /* 开场动画：每个会话仅一次 */
  const [splash, setSplash] = useState<boolean>(() => {
    try {
      if (sessionStorage.getItem('qinggu-splash')) return false;
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* Ctrl+K / ⌘K 呼出命令面板 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* 页面切换帷幕动画 */
  useEffect(() => {
    setCurtainKey((k) => k + 1);
  }, [location.pathname]);

  /* 记录最近访问 */
  useEffect(() => {
    const p = location.pathname;
    if (p === '/' || p === '') return;
    setRecentPaths((prev) => {
      const next = [p, ...prev.filter((x) => x !== p)].slice(0, 5);
      try {
        localStorage.setItem('qinggu-recent', JSON.stringify(next));
      } catch { /* noop */ }
      return next;
    });
  }, [location.pathname]);

  /* 启动时初始化成就计数（老用户历史数据也能点亮成就） */
  useEffect(() => {
    (async () => {
      try {
        const [all, exp, inc] = await Promise.all([
          api.getRecords({ pageSize: 1 }),
          api.getRecords({ pageSize: 1, type: 'expense' }),
          api.getRecords({ pageSize: 1, type: 'income' }),
        ]);
        achSetMax('record_total', all.total);
        achSetMax('record_expense', exp.total);
        achSetMax('record_income', inc.total);
      } catch { /* noop */ }
    })();
  }, []);

  const currentKey = '/' + location.pathname.split('/')[1];
  const meta = resolveRouteMeta(location.pathname);

  /* 浏览器标签页标题跟随页面变化 */
  useEffect(() => {
    document.title = meta ? `${meta.title} · 青孤项目` : '青孤项目 · 离线工具集';
  }, [meta]);

  const paletteItems: PaletteItem[] = useMemo(() => {
    const recentItems: PaletteItem[] = recentPaths
      .map((p) => paletteNav.find((n) => n.path === p))
      .filter((n): n is (typeof paletteNav)[number] => !!n)
      .map((item, i) => ({
        key: `recent-${item.path}`,
        label: item.label,
        desc: item.desc,
        icon: item.icon,
        group: i === 0 ? '最近访问' : undefined,
        action: () => navigate(item.path),
      }));
    const recentSet = new Set(recentPaths);
    const rest: PaletteItem[] = paletteNav
      .filter((n) => !recentSet.has(n.path))
      .map((item) => ({
        key: item.path,
        label: item.label,
        desc: item.desc,
        icon: item.icon,
        action: () => navigate(item.path),
      }));
    return [...recentItems, ...rest];
  }, [navigate, recentPaths]);

  const handleSplashDone = () => {
    setSplash(false);
    try {
      sessionStorage.setItem('qinggu-splash', '1');
    } catch { /* noop */ }
  };

  const themeMenu: MenuProps['items'] = allThemes.map((t) => ({
    key: t.id,
    label: (
      <span className="topbar-theme-label">
        <i className="topbar-theme-dot" style={{ background: t.primary }} />
        {t.name}
        {currentTheme.id === t.id && <span className="topbar-theme-check">✓</span>}
      </span>
    ),
    onClick: () => setTheme(t),
  }));

  const layout = mobile ? (
    /* ======== 手机端布局 ======== */
    <Layout style={{ minHeight: '100vh', paddingBottom: 62 }}>
      <Content className={`main-content mobile-content ${currentKey === '/' ? 'landing-content' : ''}`}>
        <div className="mobile-header">
          <button className="mobile-header-settings" aria-label="搜索" onClick={() => setPaletteOpen(true)}>
            <IconSearch size={20} />
          </button>
          <span className="mobile-header-title">
            <IconLogo size={20} /> 青孤项目
          </span>
          <button
            className="mobile-header-settings"
            aria-label="设置"
            onClick={() => navigate('/settings')}
          >
            <IconSettings size={20} />
          </button>
        </div>
        <Suspense fallback={<PageLoader />}>
          <ErrorBoundary>
            <Routes>{appRoutes}</Routes>
          </ErrorBoundary>
        </Suspense>
      </Content>

      {/* 悬浮记一笔按钮 */}
      <button className="fab-add" aria-label="记一笔" onClick={() => navigate('/add')}>
        <IconPlusCircle size={26} />
      </button>

      {/* 底部导航栏 */}
      <div className="mobile-tab-bar">
        {mobileTabs.map(({ key, Icon, label }) => {
          const isActive = currentKey === key || (key === '/tools' && location.pathname.startsWith('/tools'));
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
  ) : (
    /* ======== 桌面端布局 ======== */
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
          selectedKeys={[location.pathname.startsWith('/tools') && currentKey === '/tools' ? location.pathname : currentKey]}
          defaultOpenKeys={['tools']}
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
            <button className="topbar-search" onClick={() => setPaletteOpen(true)}>
              <IconSearch size={14} />
              <span>搜索</span>
              <kbd>Ctrl K</kbd>
            </button>
            <Dropdown menu={{ items: themeMenu }} trigger={['click']} placement="bottomRight">
              <Button type="text" className="topbar-icon-btn" title="切换主题" aria-label="切换主题">
                <IconPalette size={18} />
              </Button>
            </Dropdown>
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
            <ErrorBoundary>
              <Routes>{appRoutes}</Routes>
            </ErrorBoundary>
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );

  return (
    <>
      {layout}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={paletteItems} />
      {splash && <SplashScreen onDone={handleSplashDone} />}
      <ScrollProgress />
      {curtainKey > 0 && <div key={curtainKey} className="page-curtain" />}
    </>
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
