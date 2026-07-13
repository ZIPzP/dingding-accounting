import React from 'react';
const TicTacToePage: React.FC = () => (
  <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    <iframe src="./games/tictactoe.html" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="井字棋" allow="autoplay" />
  </div>
);
export default TicTacToePage;
