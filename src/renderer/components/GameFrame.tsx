/**
 * 游戏 iframe 包装组件
 * 自动将当前主题颜色传递给 iframe 内游戏
 */
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface GameFrameProps {
  src: string;
  title: string;
}

const GameFrame: React.FC<GameFrameProps> = ({ src, title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  // 发送主题颜色到 iframe
  const sendTheme = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const theme = {
      primary: currentTheme.primary,
      primaryLight: currentTheme.primaryLight,
      primaryDark: currentTheme.primaryDark,
      bg: currentTheme.bg,
      cardBg: currentTheme.cardBg,
      text: currentTheme.text,
      textSecondary: currentTheme.textSecondary,
      textTertiary: currentTheme.textTertiary,
      border: currentTheme.border,
      gameBg: currentTheme.gameBg,
      gameSurface: currentTheme.gameSurface,
      gameBorder: currentTheme.gameBorder,
    };

    try {
      iframe.contentWindow.postMessage(
        { type: 'theme-update', theme },
        '*'
      );
    } catch {
      // ignore
    }
  };

  // 主题变化时发送
  useEffect(() => {
    sendTheme();
    // 延迟再发一次，确保 iframe 已加载
    const t1 = setTimeout(sendTheme, 200);
    const t2 = setTimeout(sendTheme, 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [currentTheme]);

  // iframe 加载完成后发送主题
  const handleLoad = () => {
    sendTheme();
    setTimeout(sendTheme, 300);
  };

  // 监听 iframe 消息
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === 'request-theme') {
        sendTheme();
      } else if (e.data && e.data.type === 'game-back') {
        navigate(-1);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [currentTheme, navigate]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src={currentTheme.id === 'dark' ? `${src}${src.includes('?') ? '&' : '?'}theme=dark` : src}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title={title}
        allow="autoplay"
        onLoad={handleLoad}
      />
    </div>
  );
};

export default GameFrame;
