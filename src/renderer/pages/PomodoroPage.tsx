/**
 * 番茄钟 — 专注计时器
 * 专注 25 分钟 + 短休 5 分钟，每 4 轮专注后长休
 * 配置保存在 localStorage
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Segmented, InputNumber, Switch, message } from 'antd';
import { IconTimer, IconPlay, IconPause, IconReset } from '../components/Icons';
import { achEmit } from '../services/achievements';

type Mode = 'focus' | 'short' | 'long';

interface PomodoroConfig {
  focus: number; // 分钟
  short: number;
  long: number;
  sessionsBeforeLong: number;
  sound: boolean;
}

interface PomodoroStats {
  today: number;
  total: number;
  date: string; // 统计日期（跨天重置 today）
}

const CONFIG_KEY = 'qinggu-pomodoro-config';
const STATS_KEY = 'qinggu-pomodoro-stats';

const DEFAULT_CONFIG: PomodoroConfig = { focus: 25, short: 5, long: 15, sessionsBeforeLong: 4, sound: true };

function loadConfig(): PomodoroConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { /* noop */ }
  return DEFAULT_CONFIG;
}

function loadStats(): PomodoroStats {
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...parsed, today: parsed.date === todayStr ? parsed.today : 0, date: todayStr };
    }
  } catch { /* noop */ }
  return { today: 0, total: 0, date: todayStr };
}

const MODE_META: Record<Mode, { label: string; emoji: string; colorVar: string }> = {
  focus: { label: '专注', emoji: '🎯', colorVar: 'var(--qg-primary)' },
  short: { label: '短休息', emoji: '☕', colorVar: 'var(--qg-success)' },
  long: { label: '长休息', emoji: '🌴', colorVar: 'var(--qg-accent)' },
};

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 用 WebAudio 合成提示音（无需音频文件） */
function playBeep(times = 3): void {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    let t = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = i === times - 1 ? 1174.66 : 880;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.55);
      t += 0.6;
    }
    setTimeout(() => { try { ctx.close(); } catch { /* noop */ } }, t * 1000 + 500);
  } catch { /* 浏览器不支持时静默 */ }
}

const PomodoroPage: React.FC = () => {
  const [config, setConfig] = useState<PomodoroConfig>(() => loadConfig());
  const [mode, setMode] = useState<Mode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(() => loadConfig().focus * 60);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<PomodoroStats>(() => loadStats());
  const [completedFocusInCycle, setCompletedFocusInCycle] = useState(0);
  const runningRef = useRef(false);

  const totalSeconds = config[mode] * 60;
  const meta = MODE_META[mode];

  /* 倒计时 */
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, mode]);

  /* 倒计时结束 */
  useEffect(() => {
    if (!running || secondsLeft > 0) return;
    setRunning(false);
    runningRef.current = false;
    if (loadConfig().sound !== false) playBeep(3);
    try {
      if ('vibrate' in navigator) navigator.vibrate([80, 60, 80]);
    } catch { /* noop */ }

    if (mode === 'focus') {
      const nextCycle = completedFocusInCycle + 1;
      setCompletedFocusInCycle(nextCycle);
      const isLong = nextCycle % config.sessionsBeforeLong === 0;
      achEmit('pomodoro_total');
      setStats((prev) => {
        const next = { ...prev, today: prev.today + 1, total: prev.total + 1 };
        try { localStorage.setItem(STATS_KEY, JSON.stringify(next)); } catch { /* noop */ }
        return next;
      });
      message.success(isLong ? '太棒了！完成一轮，休息一下吧 🌴' : '专注完成，休息一下 ☕');
      switchMode(isLong ? 'long' : 'short');
    } else {
      message.info('休息结束，继续加油 💪');
      switchMode('focus');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running, mode]);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setSecondsLeft(loadConfig()[m] * 60);
  }, []);

  const handleStartPause = () => {
    if (!running) {
      setRunning(true);
      runningRef.current = true;
    } else {
      setRunning(false);
      runningRef.current = false;
    }
  };

  const handleReset = () => {
    setRunning(false);
    runningRef.current = false;
    setSecondsLeft(config[mode] * 60);
  };

  const handleModeChange = (m: Mode) => {
    setRunning(false);
    runningRef.current = false;
    switchMode(m);
  };

  /* 更新配置 */
  const handleConfigChange = (key: keyof PomodoroConfig, val: number | boolean | null) => {
    let next: PomodoroConfig;
    if (key === 'sound') {
      next = { ...config, sound: !!val };
    } else {
      const v = Math.max(1, Math.min(120, Number(val) || 1));
      next = { ...config, [key]: v };
    }
    setConfig(next);
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(next)); } catch { /* noop */ }
    if (!running && key !== 'sound') setSecondsLeft(next[mode] * 60);
  };

  /* 环形进度 */
  const R = 120;
  const CIRC = 2 * Math.PI * R;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dashOffset = CIRC * (1 - progress);

  /* 浏览器标题同步（专注时） */
  useEffect(() => {
    if (running && mode === 'focus') {
      document.title = `${fmt(secondsLeft)} · ${meta.label}中`;
    } else {
      document.title = '番茄钟 · 青孤项目';
    }
    return () => { document.title = '番茄钟 · 青孤项目'; };
  }, [running, secondsLeft, mode, meta.label]);

  return (
    <div className="page-card pomodoro-page">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconTimer size={22} /> 番茄钟
      </div>
      <p className="page-sub">25 分钟专注 + 5 分钟休息，用节奏打败拖延</p>

      <div className="pomodoro-body">
        {/* 环形计时器 */}
        <div className="pomodoro-ring-wrap" style={{ '--pc': meta.colorVar } as React.CSSProperties}>
          <svg viewBox="0 0 280 280" className="pomodoro-ring">
            <circle className="pomodoro-ring-bg" cx="140" cy="140" r={R} fill="none" strokeWidth="10" />
            <circle
              className="pomodoro-ring-fg"
              cx="140"
              cy="140"
              r={R}
              fill="none"
              strokeWidth="10"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 140 140)"
              strokeLinecap="round"
            />
          </svg>
          <div className="pomodoro-ring-center">
            <div className="pomodoro-mode">
              {meta.emoji} {meta.label}
            </div>
            <div className="pomodoro-time">{fmt(secondsLeft)}</div>
            <div className="pomodoro-hint">{running ? '保持专注…' : '准备好了就开始'}</div>
          </div>
        </div>

        {/* 模式切换 */}
        <Segmented
          block
          size="large"
          style={{ maxWidth: 420, margin: '0 auto' }}
          value={mode}
          onChange={(v) => handleModeChange(v as Mode)}
          options={[
            { label: '🎯 专注', value: 'focus' },
            { label: '☕ 短休', value: 'short' },
            { label: '🌴 长休', value: 'long' },
          ]}
        />

        {/* 控制按钮 */}
        <div className="pomodoro-controls">
          <Button size="large" icon={<IconReset size={18} />} onClick={handleReset}>
            重置
          </Button>
          <Button
            type="primary"
            size="large"
            className="pomodoro-main-btn"
            icon={running ? <IconPause size={20} /> : <IconPlay size={20} />}
            onClick={handleStartPause}
          >
            {running ? '暂停' : '开始'}
          </Button>
        </div>

        {/* 统计 */}
        <div className="pomodoro-stats">
          <div className="pomodoro-stat">
            <span className="pomodoro-stat-value">{stats.today}</span>
            <span className="pomodoro-stat-label">今日专注</span>
          </div>
          <div className="pomodoro-stat">
            <span className="pomodoro-stat-value">{stats.total}</span>
            <span className="pomodoro-stat-label">累计专注</span>
          </div>
          <div className="pomodoro-stat">
            <span className="pomodoro-stat-value">
              {completedFocusInCycle % config.sessionsBeforeLong || config.sessionsBeforeLong}/{config.sessionsBeforeLong}
            </span>
            <span className="pomodoro-stat-label">本轮进度</span>
          </div>
        </div>

        {/* 时长设置 */}
        <div className="pomodoro-config">
          <div className="pomodoro-config-title">时长设置（分钟）</div>
          <div className="pomodoro-config-row">
            <label>专注</label>
            <InputNumber min={1} max={120} value={config.focus} onChange={(v) => handleConfigChange('focus', v)} />
            <label>短休</label>
            <InputNumber min={1} max={60} value={config.short} onChange={(v) => handleConfigChange('short', v)} />
            <label>长休</label>
            <InputNumber min={1} max={60} value={config.long} onChange={(v) => handleConfigChange('long', v)} />
          </div>
          <div className="pomodoro-config-row" style={{ marginTop: 12 }}>
            <label>提示音</label>
            <Switch checked={config.sound} onChange={(v) => handleConfigChange('sound', v)} />
            <span style={{ fontSize: 12, color: 'var(--qg-text-tertiary)' }}>
              {config.sound ? '完成时响铃并震动' : '仅静默提醒'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroPage;
