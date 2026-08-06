/**
 * 首页 — 现代科技风落地页（2026-08 网页重设计）
 * Hero + 数据条 + 游戏 Bento 网格 + 记账卡 + 特性条 + 页脚
 * 全部视觉由 CSS 变量驱动，随主题切换自动适配
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconSnake, IconTetris, Icon2048,
  IconMine, IconBreakout, IconWhackAMole, IconTicTacToe,
  IconBook, IconRight, IconZap, IconLogo,
} from '../components/Icons';

interface GameItem {
  key: string;
  name: string;
  icon: React.FC<{ size?: number; className?: string }>;
  desc: string;
  route: string;
  color: string;
  tag: string;
}

const games: GameItem[] = [
  { key: 'snake', name: '贪吃蛇', icon: IconSnake, desc: '经典贪吃蛇，排行榜 + 多彩皮肤', route: '/game/snake', color: '#34d399', tag: '怀旧经典' },
  { key: 'tetris', name: '俄罗斯方块', icon: IconTetris, desc: '七种方块，挑战高分', route: '/game/tetris', color: '#38bdf8', tag: '消除益智' },
  { key: '2048', name: '2048', icon: Icon2048, desc: '滑动合并数字', route: '/game/2048', color: '#fbbf24', tag: '数字策略' },
  { key: 'minesweeper', name: '扫雷', icon: IconMine, desc: '推理排雷，初/中/高级', route: '/game/minesweeper', color: '#fb923c', tag: '逻辑推理' },
  { key: 'breakout', name: '打砖块', icon: IconBreakout, desc: '弹球清砖，关卡推进', route: '/game/breakout', color: '#f472b6', tag: '动作反应' },
  { key: 'whackamole', name: '打地鼠', icon: IconWhackAMole, desc: '30 秒限时，眼疾手快', route: '/game/whackamole', color: '#f87171', tag: '限时挑战' },
  { key: 'tictactoe', name: '井字棋', icon: IconTicTacToe, desc: '人机对战，三子连珠', route: '/game/tictactoe', color: '#a78bfa', tag: '策略对战' },
];

const stats = [
  { value: '7', label: '经典小游戏' },
  { value: '1', label: '生活工具' },
  { value: '0', label: '网络依赖' },
  { value: '100%', label: '离线可用' },
];

const features = [
  { title: '完全离线', desc: '无需联网，随时可用' },
  { title: '数据安全', desc: '本地存储，绝不上传' },
  { title: '零依赖', desc: '不依赖任何外部服务' },
  { title: '开源免费', desc: '代码开源，永久免费' },
];

const accountingFeatures = [
  { title: '分类统计', desc: '自动归类每一笔开销' },
  { title: '数据导出', desc: '一键导出 CSV 账单' },
  { title: '本地备份', desc: '数据随时备份恢复' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* ======== Hero 区域 ======== */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <div className="landing-dots" />
        <div className="landing-hero-inner">
          <div className="landing-badge">
            <IconZap size={13} />
            OFFLINE FIRST
          </div>
          <h1 className="landing-title">离线工具集</h1>
          <div className="landing-subtitle">无网络 · 也能用</div>
          <p className="landing-desc">
            7 款经典小游戏 + 智能记账，全部本地运行。
            数据不出设备，游戏随时开玩。
          </p>
          <div className="landing-ctas">
            <button className="landing-btn landing-btn-primary" onClick={() => navigate('/game')}>
              立即体验
              <IconRight size={16} />
            </button>
            <button className="landing-btn landing-btn-ghost" onClick={() => navigate('/bills')}>
              开始记账
            </button>
          </div>
        </div>
      </section>

      {/* ======== 数据条 ======== */}
      <section className="landing-stats">
        {stats.map((s) => (
          <div className="landing-stat" key={s.label}>
            <div className="landing-stat-value">{s.value}</div>
            <div className="landing-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ======== 游戏区域（Bento 网格） ======== */}
      <section className="landing-section">
        <div className="landing-section-head">
          <h2 className="landing-section-title">经典小游戏</h2>
          <p className="landing-section-sub">经典怀旧，即开即玩，所有进度自动保存</p>
        </div>

        <div className="landing-games">
          {/* 2 大卡：贪吃蛇 + 俄罗斯方块 */}
          {(() => {
            const g0 = games[0];
            const G0 = g0.icon;
            const g1 = games[1];
            const G1 = g1.icon;
            return (
              <>
                <div className="landing-card landing-card-lg" style={{ '--gc': g0.color } as React.CSSProperties} onClick={() => navigate(g0.route)}>
                  <div className="landing-card-top">
                    <span className="landing-card-icon" style={{ color: g0.color }}>
                      <G0 size={26} />
                    </span>
                    <span className="landing-card-tag">{g0.tag}</span>
                  </div>
                  <div className="landing-card-name">{g0.name}</div>
                  <div className="landing-card-desc">{g0.desc}</div>
                  <IconRight size={16} className="landing-card-arrow" />
                </div>
                <div className="landing-card landing-card-lg" style={{ '--gc': g1.color } as React.CSSProperties} onClick={() => navigate(g1.route)}>
                  <div className="landing-card-top">
                    <span className="landing-card-icon" style={{ color: g1.color }}>
                      <G1 size={26} />
                    </span>
                    <span className="landing-card-tag">{g1.tag}</span>
                  </div>
                  <div className="landing-card-name">{g1.name}</div>
                  <div className="landing-card-desc">{g1.desc}</div>
                  <IconRight size={16} className="landing-card-arrow" />
                </div>
              </>
            );
          })()}

          {/* 4 小卡：2048 / 扫雷 / 打砖块 / 打地鼠 */}
          {games.slice(2, 6).map((g) => {
            const GI = g.icon;
            return (
              <div key={g.key} className="landing-card landing-card-sm" style={{ '--gc': g.color } as React.CSSProperties} onClick={() => navigate(g.route)}>
                <span className="landing-card-icon" style={{ color: g.color }}>
                  <GI size={24} />
                </span>
                <div className="landing-card-sm-body">
                  <div className="landing-card-name">{g.name}</div>
                  <div className="landing-card-desc">{g.desc}</div>
                </div>
                <IconRight size={14} className="landing-card-arrow" />
              </div>
            );
          })}

          {/* 1 宽卡：井字棋 */}
          {(() => {
            const g6 = games[6];
            const G6 = g6.icon;
            return (
              <div className="landing-card landing-card-wide" style={{ '--gc': g6.color } as React.CSSProperties} onClick={() => navigate(g6.route)}>
                <span className="landing-card-icon" style={{ color: g6.color }}>
                  <G6 size={24} />
                </span>
                <div className="landing-card-sm-body">
                  <div className="landing-card-name">{g6.name}</div>
                  <div className="landing-card-desc">{g6.desc}</div>
                </div>
                <span className="landing-card-tag">{g6.tag}</span>
                <IconRight size={14} className="landing-card-arrow" />
              </div>
            );
          })()}
        </div>
      </section>

      {/* ======== 记账区域 ======== */}
      <section className="landing-section">
        <div className="landing-section-head">
          <h2 className="landing-section-title">智能记账</h2>
          <p className="landing-section-sub">记录每一笔开销，自动分类统计，支持数据导出与本地备份</p>
        </div>

        <div className="landing-accounting">
          <div className="landing-acc-card" onClick={() => navigate('/add')}>
            <div className="landing-acc-icon">
              <IconBook size={30} />
            </div>
            <div className="landing-acc-title">轻松管理每一笔开销</div>
            <p className="landing-acc-desc">
              九大分类体系，支持自定义二级分类，
              随手记录，月度统计一目了然。
            </p>
            <button className="landing-btn landing-btn-primary">
              开始使用
              <IconRight size={16} />
            </button>
          </div>

          <div className="landing-acc-list">
            {accountingFeatures.map((f) => (
              <div className="landing-acc-feature" key={f.title} onClick={() => navigate('/stats')}>
                <div className="landing-acc-feature-icon">
                  <IconZap size={18} />
                </div>
                <div className="landing-acc-feature-body">
                  <div className="landing-acc-feature-name">{f.title}</div>
                  <div className="landing-acc-feature-desc">{f.desc}</div>
                </div>
                <IconRight size={14} className="landing-card-arrow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 特性条 ======== */}
      <section className="landing-features">
        {features.map((f) => (
          <div className="landing-feature" key={f.title}>
            <div className="landing-feature-title">{f.title}</div>
            <div className="landing-feature-desc">{f.desc}</div>
          </div>
        ))}
      </section>

      {/* ======== 页脚 ======== */}
      <footer className="landing-footer">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            <IconLogo size={20} />
            青孤 · 离线工具集
          </div>
          <div className="landing-footer-links">
            <span onClick={() => navigate('/settings')}>设置</span>
            <span onClick={() => navigate('/game')}>游戏</span>
            <span onClick={() => navigate('/stats')}>统计</span>
          </div>
        </div>
        <div className="landing-footer-copy">2026 青孤项目 · 所有数据本地存储，无需网络</div>
      </footer>
    </div>
  );
};

export default HomePage;
