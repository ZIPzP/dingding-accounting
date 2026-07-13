import React from 'react';
const WhackAMolePage: React.FC = () => (
  <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    <iframe src="./games/whackamole.html" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="打地鼠" allow="autoplay" />
  </div>
);
export default WhackAMolePage;
