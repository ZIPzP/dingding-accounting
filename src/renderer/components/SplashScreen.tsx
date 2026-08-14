/**
 * 开场品牌动画
 * 进入应用时播放一次（每个会话仅一次），像打开一个真正的产品
 */
import React, { useEffect } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="splash">
      <div className="splash-glow" />
      <div className="splash-logo">
        <svg viewBox="0 0 32 32" fill="none" className="splash-svg">
          <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="1.6" className="splash-rect" />
          <circle cx="11" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.6" className="splash-eye" />
          <circle cx="21" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.6" className="splash-eye" />
          <path d="M7 22c2.5-3 6-5 9-5s6.5 2 9 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="splash-smile" />
          <path d="M16 2v3 M16 27v3 M2 16h3 M27 16h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.4" className="splash-ray" />
        </svg>
      </div>
      <div className="splash-name">
        {'青孤项目'.split('').map((c, i) => (
          <span key={i} style={{ animationDelay: `${300 + i * 90}ms` }}>{c}</span>
        ))}
      </div>
      <div className="splash-line"><i /></div>
      <div className="splash-tagline">无聊时刻,有青孤相伴</div>
    </div>
  );
};

export default SplashScreen;
