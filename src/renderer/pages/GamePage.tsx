/**
 * 游戏页面
 * 通过 iframe 嵌入贪吃蛇小游戏
 */
import React from 'react';

const GamePage: React.FC = () => {
  // 构建时使用相对路径，开发时使用绝对路径
  const gameUrl = './games/snake.html';

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <iframe
        src={gameUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        title="贪吃蛇"
        allow="autoplay"
      />
    </div>
  );
};

export default GamePage;
