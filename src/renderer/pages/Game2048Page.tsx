import React from 'react';
const Game2048Page: React.FC = () => (
  <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    <iframe src="./games/2048.html" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="2048" allow="autoplay" />
  </div>
);
export default Game2048Page;
