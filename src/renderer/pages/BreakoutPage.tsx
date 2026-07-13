import React from 'react';
const BreakoutPage: React.FC = () => (
  <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    <iframe src="./games/breakout.html" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="打砖块" allow="autoplay" />
  </div>
);
export default BreakoutPage;
