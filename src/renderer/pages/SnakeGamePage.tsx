/**
 * 贪吃蛇游戏页面
 * 通过 iframe 嵌入贪吃蛇小游戏
 */
import React from 'react';

const SnakeGamePage: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <iframe
        src="./games/snake.html"
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

export default SnakeGamePage;
