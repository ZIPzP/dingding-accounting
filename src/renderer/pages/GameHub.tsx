/**
 * 游戏中心页面
 * 展示所有可用小游戏，点击进入对应游戏
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface GameInfo {
  key: string;
  name: string;
  icon: string;
  desc: string;
  color: string;
  route: string;
}

const games: GameInfo[] = [
  { key: 'snake', name: '🐍 贪吃蛇', icon: '🐍', desc: '经典贪吃蛇，触屏操控、排行榜、多彩皮肤、横竖屏切换', color: '#52c41a', route: '/game/snake' },
  { key: 'tetris', name: '🧱 俄罗斯方块', icon: '🧱', desc: '经典消除，七种方块，分数加倍，挑战高分', color: '#1890ff', route: '/game/tetris' },
  { key: '2048', name: '🔢 2048', icon: '🔢', desc: '滑动合并数字，挑战 2048 极限', color: '#edc22e', route: '/game/2048' },
  { key: 'minesweeper', name: '🧹 扫雷', icon: '💣', desc: '经典扫雷，初级/专家模式，考验推理能力', color: '#fa8c16', route: '/game/minesweeper' },
  { key: 'breakout', name: '🏓 打砖块', icon: '🧱', desc: '弹球打砖块，清空所有砖块过关', color: '#eb2f96', route: '/game/breakout' },
  { key: 'whackamole', name: '🎯 打地鼠', icon: '🔨', desc: '30 秒限时挑战，眼疾手快打地鼠', color: '#f5222d', route: '/game/whackamole' },
  { key: 'tictactoe', name: '⭕ 井字棋', icon: '🎯', desc: '人机对战，三子连珠即获胜', color: '#722ed1', route: '/game/tictactoe' },
];

const GameHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-card">
      <div className="page-title">🎮 小游戏</div>

      <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 14 }}>
        休息一下，玩玩小游戏放松放松 🎯
      </Text>

      <Row gutter={[16, 16]}>
        {games.map((game) => (
          <Col xs={24} sm={12} lg={8} key={game.key}>
            <Card
              hoverable
              onClick={() => navigate(game.route)}
              style={{
                borderTop: `4px solid ${game.color}`,
                borderRadius: 8,
                height: '100%',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 48 }}>{game.icon}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {game.name}
              </div>
              <Text
                type="secondary"
                style={{ fontSize: 13, display: 'block', textAlign: 'center' }}
              >
                {game.desc}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      {games.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#8c8c8c' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
          <div style={{ fontSize: 16 }}>暂无游戏，敬请期待</div>
        </div>
      )}
    </div>
  );
};

export default GameHub;
