/**
 * 青狐伙伴 — 虚拟宠物页面
 * Canvas 程序化绘制卡通狐狸:眨眼、摇尾巴、呼吸、进化装饰
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Progress, message } from 'antd';
import { IconWave, IconFire } from '../components/Icons';
import { getFoxState, foxFeed, foxPet, foxLevelName, foxQuip } from '../services/fox';

type FoxMood = 'idle' | 'happy' | 'sad' | 'eat';

const FoxPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState(() => getFoxState());
  const [quip, setQuip] = useState(() => foxQuip());
  const [moodAnim, setMoodAnim] = useState<FoxMood>('idle');
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const quipTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    setState(getFoxState());
  }, []);

  useEffect(() => {
    quipTimer.current = setInterval(() => {
      setQuip(foxQuip());
      refresh();
    }, 9000);
    return () => {
      if (quipTimer.current) clearInterval(quipTimer.current);
    };
  }, [refresh]);

  /* ---------------- Canvas 狐狸绘制 ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let lastBlink = performance.now();
    let nextBlink = 2500 + Math.random() * 2500;
    let blinkT = 0;
    let t0 = performance.now();

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const s = getFoxState();
      const level = s.level;
      const W = canvas.width / (window.devicePixelRatio || 1);
      const H = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, W, H);

      /* 心情决定姿势 */
      let bounce = Math.sin(t * 2.2) * 3;
      let tailWag = Math.sin(t * 2.8) * 0.16;
      let earDroop = 0;
      let mouthCurve = 1; // 1 smile, -1 frown
      if (moodAnim === 'happy') { bounce = Math.abs(Math.sin(t * 3.4)) * 7; tailWag = Math.sin(t * 5) * 0.28; }
      if (moodAnim === 'sad') { bounce = 0; tailWag = Math.sin(t * 1.2) * 0.06; earDroop = 0.3; mouthCurve = -1; }
      if (moodAnim === 'eat') { bounce = Math.sin(t * 6) * 2; tailWag = Math.sin(t * 6) * 0.2; mouthCurve = 0; }

      const cx = W / 2;
      const baseY = H * 0.62 + bounce;
      const bodyW = W * 0.34;
      const bodyH = bodyW * 0.62;
      const headR = bodyW * 0.34;

      /* 影子 */
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(cx, H * 0.86, bodyW * 0.62, bodyW * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();

      /* 光环（10级） */
      if (level >= 10) {
        ctx.save();
        ctx.strokeStyle = 'rgba(251,191,36,0.9)';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(251,191,36,0.8)';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.ellipse(cx, baseY - bodyH - headR * 2.1, headR * 0.9, headR * 0.24, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      /* 尾巴 */
      ctx.save();
      ctx.translate(cx + bodyW * 0.52, baseY - bodyH * 0.28);
      ctx.rotate(-0.5 + tailWag);
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.ellipse(0, -bodyH * 0.34, bodyW * 0.34, bodyW * 0.17, -0.5, 0, Math.PI * 2);
      ctx.fill();
      /* 尾尖 */
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(bodyW * 0.2, -bodyH * 0.46, bodyW * 0.13, bodyW * 0.1, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* 身体 */
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.ellipse(cx, baseY, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      /* 肚皮 */
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(cx, baseY + bodyH * 0.14, bodyW * 0.32, bodyH * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      /* 围巾（4级+） */
      if (level >= 4) {
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.ellipse(cx, baseY - bodyH * 0.52, bodyW * 0.2, bodyH * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(cx - bodyW * 0.1, baseY - bodyH * 0.55, bodyW * 0.14, bodyH * 0.34);
      }

      /* 头 */
      const headY = baseY - bodyH * 0.62;
      /* 耳朵 */
      const earTilt = earDroop * 0.7;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(cx + side * headR * 0.72, headY - headR * 0.62);
        ctx.rotate(side * (0.28 + earTilt * (side > 0 ? 1 : -1)));
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.moveTo(0, headR * 0.52);
        ctx.lineTo(-headR * 0.4, -headR * 0.72);
        ctx.lineTo(headR * 0.4, -headR * 0.62);
        ctx.closePath();
        ctx.fill();
        /* 耳内 */
        ctx.fillStyle = '#fdba74';
        ctx.beginPath();
        ctx.moveTo(0, headR * 0.3);
        ctx.lineTo(-headR * 0.2, -headR * 0.4);
        ctx.lineTo(headR * 0.18, -headR * 0.34);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(cx, headY, headR, 0, Math.PI * 2);
      ctx.fill();

      /* 口鼻 */
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(cx, headY + headR * 0.28, headR * 0.52, headR * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d1a2a';
      ctx.beginPath();
      ctx.ellipse(cx, headY + headR * 0.16, headR * 0.11, headR * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      /* 眼睛 + 眨眼 */
      const nowMs = performance.now();
      if (nowMs - lastBlink > nextBlink) {
        lastBlink = nowMs;
        nextBlink = 2500 + Math.random() * 3000;
        blinkT = nowMs;
      }
      const blink = nowMs - blinkT < 140 ? 0.12 : 1;
      for (const side of [-1, 1]) {
        const ex = cx + side * headR * 0.4;
        const ey = headY - headR * 0.12;
        ctx.save();
        ctx.translate(ex, ey);
        ctx.scale(1, blink);
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(0, 0, headR * 0.13, 0, Math.PI * 2);
        ctx.fill();
        if (blink === 1) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(headR * 0.05, -headR * 0.05, headR * 0.045, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      /* 嘴 */
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (moodAnim === 'eat') {
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.ellipse(cx, headY + headR * 0.4, headR * 0.16, headR * 0.12 + Math.abs(Math.sin(t * 6)) * 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(cx, headY + headR * 0.32, headR * 0.2, mouthCurve * 0.5 + 0.15, Math.PI - (mouthCurve * 0.5 + 0.15));
        ctx.stroke();
      }

      /* 星冠（7级+） */
      if (level >= 7) {
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const cy0 = headY - headR * 0.98;
        ctx.moveTo(cx - headR * 0.34, cy0);
        ctx.lineTo(cx - headR * 0.2, cy0 - headR * 0.26);
        ctx.lineTo(cx, cy0 - headR * 0.06);
        ctx.lineTo(cx + headR * 0.2, cy0 - headR * 0.26);
        ctx.lineTo(cx + headR * 0.34, cy0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      /* 漂浮爱心（摸头时） */
      for (const h of hearts) {
        const age = (nowMs - h.id) / 900;
        if (age > 1) continue;
        ctx.globalAlpha = 1 - age;
        ctx.font = `${14 + age * 6}px sans-serif`;
        ctx.fillText('❤', h.x, h.y - age * 46);
      }
      ctx.globalAlpha = 1;

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [hearts, moodAnim]);

  const handleFeed = () => {
    const result = foxFeed(10);
    if (result.ok) {
      setMoodAnim('eat');
      setTimeout(() => setMoodAnim('idle'), 1800);
      setQuip(result.msg);
      message.success(result.msg);
    } else {
      setMoodAnim('sad');
      setTimeout(() => setMoodAnim('idle'), 1600);
      message.warning(result.msg);
    }
    refresh();
  };

  const handlePet = () => {
    foxPet();
    setMoodAnim('happy');
    setTimeout(() => setMoodAnim('idle'), 1200);
    const h = { id: performance.now() + Math.random(), x: 150 + Math.random() * 120, y: 120 + Math.random() * 60 };
    setHearts((prev) => [...prev.slice(-6), h]);
    try {
      if ('vibrate' in navigator) navigator.vibrate(12);
    } catch { /* noop */ }
    refresh();
  };

  const levelName = foxLevelName(state.level);
  const moodText = state.mood >= 70 ? '开心' : state.mood >= 40 ? '一般' : '难过';

  return (
    <div className="page-card fox-page">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        🦊 青狐伙伴
      </div>
      <p className="page-sub">你的专属小狐狸:用应用赚狐粮,把它养大、看它进化</p>

      <div className="fox-body">
        {/* 对话框 */}
        <div className="fox-bubble">
          <span className="fox-bubble-name">青狐</span>
          <span className="fox-bubble-text">{quip}</span>
        </div>

        {/* 画布 */}
        <div className="fox-canvas-wrap">
          <canvas ref={canvasRef} className="fox-canvas" width={600} height={480} />
        </div>

        {/* 状态 */}
        <div className="fox-stats">
          <div className="fox-stat">
            <span className="fox-stat-value">{levelName}</span>
            <span className="fox-stat-label">等级 {state.level}/10</span>
          </div>
          <div className="fox-stat fox-stat-mood">
            <span className="fox-stat-value">{moodText}</span>
            <Progress
              percent={state.mood}
              showInfo={false}
              size="small"
              strokeColor={{ from: '#fb923c', to: '#fbbf24' }}
              style={{ width: 90, margin: 0 }}
            />
          </div>
          <div className="fox-stat">
            <span className="fox-stat-value">{state.food}</span>
            <span className="fox-stat-label">狐粮</span>
          </div>
        </div>

        {/* 互动按钮 */}
        <div className="fox-actions">
          <Button type="primary" size="large" onClick={handleFeed}>
            🍗 喂食（10 狐粮）
          </Button>
          <Button size="large" onClick={handlePet}>
            🖐️ 摸摸头
          </Button>
        </div>

        {/* 狐粮获取指南 */}
        <div className="fox-guide">
          <div className="fox-guide-title">怎么赚狐粮?</div>
          <div className="fox-guide-grid">
            <span>📒 记一笔 +1</span>
            <span>🍅 完成专注 +2</span>
            <span>🔥 连续打卡7天 +3</span>
            <span>🎉 实现心愿 +5</span>
            <span>🛡️ 守住预算 +4</span>
            <span>🎮 游戏成就 +3</span>
          </div>
          <div className="fox-guide-tip">
            <IconFire size={13} /> 连续喂食 6 次升 1 级:幼狐 → 青狐(4级,戴上围巾) → 星灵狐(7级,加冕星冠) → 星狐(10级,光环)
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoxPage;
