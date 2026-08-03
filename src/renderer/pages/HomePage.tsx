/**
 * 首页 — 两大板块中心
 * 🎮 小游戏（渐变背景 + 噪点纹理 + 专属 SVG 图标）
 * 🛠️ 生活工具（左侧色条 + 图标）
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Divider } from 'antd';
import {
  IconZap,
  IconTool,
  IconRight,
  IconSnake, IconTetris, Icon2048,
  IconMine, IconBreakout, IconWhackAMole, IconTicTacToe,
  IconBook,
} from '../components/Icons';

const { Title, Text } = Typography;

interface HubItem {
  key: string;
  name: string;
  icon: React.FC<{ size?: number }>;
  desc: string;
  route: string;
  color: string;
}

const games: HubItem[] = [
  { key: 'snake', name: '贪吃蛇', icon: IconSnake, desc: '经典贪吃蛇，横竖屏切换，排行榜', route: '/game/snake', color: 'green' },
  { key: 'tetris', name: '俄罗斯方块', icon: IconTetris, desc: '经典消除，挑战高分', route: '/game/tetris', color: 'blue' },
  { key: '2048', name: '2048', icon: Icon2048, desc: '滑动合并，挑战极限', route: '/game/2048', color: 'gold' },
  { key: 'minesweeper', name: '扫雷', icon: IconMine, desc: '推理排雷，初/中/高级模式', route: '/game/minesweeper', color: 'orange' },
  { key: 'breakout', name: '打砖块', icon: IconBreakout, desc: '弹球打砖，清空过关', route: '/game/breakout', color: 'pink' },
  { key: 'whackamole', name: '打地鼠', icon: IconWhackAMole, desc: '30秒限时，眼疾手快', route: '/game/whackamole', color: 'red' },
  { key: 'tictactoe', name: '井字棋', icon: IconTicTacToe, desc: '人机对战，三子连珠', route: '/game/tictactoe', color: 'purple' },
];

const tools: HubItem[] = [
  { key: 'bills', name: '记账', icon: IconBook, desc: '记录日常开销，分类统计，数据导出备份', route: '/bills', color: '#4f6df5' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-card" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* 顶部标题 */}
      <div className="hub-header">
        <Title level={3} style={{ marginBottom: 4, fontWeight: 700, color: 'var(--qg-text)' }}>
          青孤项目
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          离线工具集 · 无网络也能用
        </Text>
      </div>

      {/* ======== 🎮 小游戏板块 ======== */}
      <div className="hub-section hub-games">
        <div className="hub-section-title">
          <IconZap size={20} /> 小游戏
        </div>
        <div className="game-card-grid">
          {games.map((g) => {
            const GameIcon = g.icon;
            return (
              <div
                key={g.key}
                className="game-card"
                data-color={g.color}
                onClick={() => navigate(g.route)}
              >
                <div className="game-card-inner">
                  <div className="game-card-icon-wrap">
                    <GameIcon size={28} />
                  </div>
                  <div className="game-card-body">
                    <div className="game-card-name">{g.name}</div>
                    <div className="game-card-desc">{g.desc}</div>
                  </div>
                  <IconRight size={18} className="game-card-arrow" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Divider style={{ margin: '28px 0 24px' }} />

      {/* ======== 🛠️ 生活工具板块 ======== */}
      <div className="hub-section hub-tools">
        <div className="hub-section-title">
          <IconTool size={20} /> 生活工具
        </div>
        <div className="tool-card-grid">
          {tools.map((t) => {
            const ToolIcon = t.icon;
            return (
              <div
                key={t.key}
                className="tool-card"
                onClick={() => navigate(t.route)}
                style={{ borderLeftColor: t.color }}
              >
                <div className="tool-card-inner">
                  <span className="tool-card-icon">
                    <ToolIcon size={36} />
                  </span>
                  <div className="tool-card-body">
                    <div className="tool-card-name">{t.name}</div>
                    <div className="tool-card-desc">{t.desc}</div>
                  </div>
                  <IconRight size={16} className="tool-card-arrow" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部提示 */}
      <div style={{ textAlign: 'center', marginTop: 36, paddingBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12, opacity: 0.6 }}>
          所有数据和游戏均离线可用，无需网络
        </Text>
      </div>
    </div>
  );
};

export default HomePage;
