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
  {
    key: 'snake',
    name: '🐍 贪吃蛇',
    icon: '🐍',
    desc: '经典贪吃蛇游戏，支持触屏操控、排行榜、多彩皮肤和速度调节',
    color: '#52c41a',
    route: '/game/snake',
  },
  // 以后在这里添加更多游戏
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
