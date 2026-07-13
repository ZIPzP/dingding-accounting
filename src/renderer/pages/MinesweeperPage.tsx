import React from 'react';
const MinesweeperPage: React.FC = () => (
  <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    <iframe src="./games/minesweeper.html" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="扫雷" allow="autoplay" />
  </div>
);
export default MinesweeperPage;
