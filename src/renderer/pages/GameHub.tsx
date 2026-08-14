/**
 * 游戏中心页面
 * 展示所有可用小游戏，SVG 图标 + 渐变顶条
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography } from 'antd';
import {
  IconZap, IconGamepad,
  IconSnake, IconTetris, Icon2048,
  IconMine, IconBreakout, IconWhackAMole, IconTicTacToe, IconTower, IconRocket,
} from '../components/Icons';

const { Text } = Typography;

interface GameInfo {
  key: string;
  name: string;
  icon: React.FC<{ size?: number }>;
  desc: string;
  color: string;
  route: string;
}

const games: GameInfo[] = [
  { key: 'runner', name: '星际跑酷', icon: IconRocket, desc: '全新 WebGL 3D 无尽跑酷,三赛道飞驰宇宙', color: '#06b6d4', route: '/game/runner' },
  { key: 'stack', name: '叠叠高', icon: IconTower, desc: '3D 叠塔,完美对齐触发连击', color: '#38bdf8', route: '/game/stack' },
  { key: 'snake', name: '贪吃蛇', icon: IconSnake, desc: '经典贪吃蛇，触屏操控、排行榜、多彩皮肤', color: '#52c41a', route: '/game/snake' },
  { key: 'tetris', name: '俄罗斯方块', icon: IconTetris, desc: '经典消除，七种方块，挑战高分', color: '#1890ff', route: '/game/tetris' },
  { key: '2048', name: '2048', icon: Icon2048, desc: '滑动合并数字，挑战 2048 极限', color: '#edc22e', route: '/game/2048' },
  { key: 'minesweeper', name: '扫雷', icon: IconMine, desc: '经典扫雷，初级/专家模式，推理挑战', color: '#fa8c16', route: '/game/minesweeper' },
  { key: 'breakout', name: '打砖块', icon: IconBreakout, desc: '弹球打砖块，清空所有砖块过关', color: '#eb2f96', route: '/game/breakout' },
  { key: 'whackamole', name: '打地鼠', icon: IconWhackAMole, desc: '30 秒限时挑战，眼疾手快', color: '#f5222d', route: '/game/whackamole' },
  { key: 'tictactoe', name: '井字棋', icon: IconTicTacToe, desc: '人机对战，三子连珠即获胜', color: '#722ed1', route: '/game/tictactoe' },
];

const GameHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-card">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconZap size={22} /> 小游戏
      </div>

      <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 14 }}>
        休息一下，玩玩小游戏放松放松
      </Text>

      <Row gutter={[16, 16]}>
        {games.map((game) => {
          const GameIcon = game.icon;
          return (
            <Col xs={24} sm={12} lg={8} key={game.key}>
              <Card
                hoverable
                onClick={() => navigate(game.route)}
                style={{
                  borderTop: `4px solid ${game.color}`,
                  borderRadius: 'var(--qg-radius)',
                  height: '100%',
                  overflow: 'hidden',
                }}
                styles={{ body: { padding: '28px 20px' } }}
              >
                <div style={{
                  textAlign: 'center', marginBottom: 14,
                  width: 56, height: 56, margin: '0 auto 14px',
                  borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: game.color,
                  background: `color-mix(in srgb, ${game.color} 14%, transparent)`,
                }}>
                  <GameIcon size={32} />
                </div>
                <div style={{
                  textAlign: 'center', fontSize: 17, fontWeight: 700,
                  marginBottom: 6, color: 'var(--qg-text)',
                }}>
                  {game.name}
                </div>
                <Text type="secondary" style={{
                  fontSize: 13, display: 'block', textAlign: 'center',
                  lineHeight: 1.5,
                }}>
                  {game.desc}
                </Text>
              </Card>
            </Col>
          );
        })}
      </Row>

      {games.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--qg-text-tertiary)' }}>
          <IconGamepad size={48} />
          <div style={{ fontSize: 16, marginTop: 12 }}>暂无游戏，敬请期待</div>
        </div>
      )}
    </div>
  );
};

export default GameHub;
