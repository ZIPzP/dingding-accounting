/**
 * 游戏 iframe 包装组件
 * 游戏页面保持自身固定外观，不随应用主题切换而变化（2026-08 决策）
 * 仅保留「返回」通信能力
 */
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GameFrameProps {
  src: string;
  title: string;
}

const GameFrame: React.FC<GameFrameProps> = ({ src, title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();

  // 监听 iframe 消息：仅处理返回请求
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === 'game-back') {
        navigate(-1);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [navigate]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src={src}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title={title}
        allow="autoplay"
      />
    </div>
  );
};

export default GameFrame;
