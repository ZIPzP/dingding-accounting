import React from 'react';
const TetrisGamePage: React.FC = () => (
  <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    <iframe src="./games/tetris.html" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="俄罗斯方块" allow="autoplay" />
  </div>
);
export default TetrisGamePage;
