/**
 * 首页 — 两大板块中心
 * 🎮 小游戏 + 🛠️ 生活工具
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Typography, Divider } from 'antd';
import {
  ThunderboltOutlined,
  ToolOutlined,
  RightOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// ==================== 板块数据 ====================
// 添加新游戏/工具只需在下面加一条

interface HubItem {
  key: string;
  name: string;
  icon: string;
  desc: string;
  route: string;
  color: string;
}

const games: HubItem[] = [
  { key: 'snake', name: '贪吃蛇', icon: '🐍', desc: '经典贪吃蛇，横竖屏切换，排行榜', route: '/game/snake', color: '#52c41a' },
  { key: 'tetris', name: '俄罗斯方块', icon: '🧱', desc: '经典消除，挑战高分', route: '/game/tetris', color: '#1890ff' },
  { key: '2048', name: '2048', icon: '🔢', desc: '滑动合并，挑战极限', route: '/game/2048', color: '#edc22e' },
  { key: 'minesweeper', name: '扫雷', icon: '💣', desc: '推理排雷，初级专家模式', route: '/game/minesweeper', color: '#fa8c16' },
  { key: 'breakout', name: '打砖块', icon: '🧱', desc: '弹球打砖，清空过关', route: '/game/breakout', color: '#eb2f96' },
  { key: 'whackamole', name: '打地鼠', icon: '🔨', desc: '30秒限时，眼疾手快', route: '/game/whackamole', color: '#f5222d' },
  { key: 'tictactoe', name: '井字棋', icon: '🎯', desc: '人机对战，三子连珠', route: '/game/tictactoe', color: '#722ed1' },
];

const tools: HubItem[] = [
  {
    key: 'bills',
    name: '记账',
    icon: '📒',
    desc: '记录日常开销，分类统计，数据导出备份',
    route: '/bills',
    color: '#1677ff',
  },
];

// ==================== 组件 ====================

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-card" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* 顶部标题 */}
      <div className="hub-header">
        <Title level={3} style={{ marginBottom: 4 }}>
          🏠 青孤项目
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          离线工具集 · 无网络也能用
        </Text>
      </div>

      {/* ======== 🎮 小游戏板块 ======== */}
      <div className="hub-section hub-games">
        <div className="hub-section-title">
          <ThunderboltOutlined style={{ fontSize: 20 }} /> 小游戏
        </div>
        <Row gutter={[12, 12]}>
          {games.map((g) => (
            <Col xs={24} sm={12} key={g.key}>
              <div
                className="game-card"
                onClick={() => navigate(g.route)}
                style={{ cursor: 'pointer' }}
              >
                <div className="game-card-inner">
                  <span className="game-card-icon">{g.icon}</span>
                  <div className="game-card-body">
                    <div className="game-card-name">{g.name}</div>
                    <div className="game-card-desc">{g.desc}</div>
                  </div>
                  <RightOutlined className="game-card-arrow" />
                </div>
              </div>
            </Col>
          ))}
          {games.length === 0 && (
            <Col span={24}>
              <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
                更多游戏即将上线
              </div>
            </Col>
          )}
        </Row>
      </div>

      <Divider style={{ margin: '24px 0' }} />

      {/* ======== 🛠️ 生活工具板块 ======== */}
      <div className="hub-section hub-tools">
        <div className="hub-section-title">
          <ToolOutlined style={{ fontSize: 20 }} /> 生活工具
        </div>
        <Row gutter={[12, 12]}>
          {tools.map((t) => (
            <Col xs={24} sm={12} key={t.key}>
              <div
                className="tool-card"
                onClick={() => navigate(t.route)}
                style={{ cursor: 'pointer', borderLeftColor: t.color }}
              >
                <div className="tool-card-inner">
                  <span className="tool-card-icon">{t.icon}</span>
                  <div className="tool-card-body">
                    <div className="tool-card-name">{t.name}</div>
                    <div className="tool-card-desc">{t.desc}</div>
                  </div>
                  <RightOutlined className="tool-card-arrow" />
                </div>
              </div>
            </Col>
          ))}
          {tools.length === 0 && (
            <Col span={24}>
              <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
                更多工具即将上线
              </div>
            </Col>
          )}
        </Row>
      </div>

      {/* 底部提示 */}
      <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          所有数据和游戏均离线可用，无需网络
        </Text>
      </div>
    </div>
  );
};

export default HomePage;
