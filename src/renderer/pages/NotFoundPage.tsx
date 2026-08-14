/**
 * 404 页面 — 访问不存在的页面时显示
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconHome, IconGamepad } from '../components/Icons';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound">
      <div className="notfound-glow" />
      <div className="notfound-code">404</div>
      <div className="notfound-emoji">🧭</div>
      <h1 className="notfound-title">这页走丢了</h1>
      <p className="notfound-desc">
        你访问的页面不存在,或链接已经失效。
        <br />
        别担心,回首页继续解闷吧。
      </p>
      <div className="notfound-actions">
        <button className="landing-btn landing-btn-primary" onClick={() => navigate('/')}>
          <IconHome size={16} />
          回 首 页
        </button>
        <button className="landing-btn landing-btn-ghost" onClick={() => navigate('/game')}>
          <IconGamepad size={16} />
          去玩游戏
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
