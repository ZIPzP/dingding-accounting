/**
 * 白噪音 — 专注与助眠音景
 * 全部声音由 WebAudio 实时合成（雨声/海浪/风声/篝火），无需任何音频文件，完全离线
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Slider, Segmented, message } from 'antd';
import { IconWave, IconPlay, IconPause } from '../components/Icons';
import { achEmit } from '../services/achievements';

interface Preset {
  id: string;
  name: string;
  emoji: string;
  desc: string;
}

const PRESETS: Preset[] = [
  { id: 'rain', name: '雨声', emoji: '🌧️', desc: '淅淅沥沥,安心入眠' },
  { id: 'waves', name: '海浪', emoji: '🌊', desc: '潮起潮落,放空思绪' },
  { id: 'wind', name: '风声', emoji: '🍃', desc: '旷野清风,安静阅读' },
  { id: 'fire', name: '篝火', emoji: '🔥', desc: '噼啪暖意,冬日氛围' },
  { id: 'white', name: '白噪音', emoji: '📻', desc: '均匀底噪,屏蔽干扰' },
  { id: 'brown', name: '棕噪音', emoji: '🌫️', desc: '低沉浑厚,深度专注' },
];

const CONFIG_KEY = 'qinggu-noise-config';

function loadConfig(): { preset: string; volume: number } {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { preset: 'rain', volume: 60, ...JSON.parse(raw) };
  } catch { /* noop */ }
  return { preset: 'rain', volume: 60 };
}

/** 生成噪声缓冲（white / brown） */
function makeNoiseBuffer(ctx: AudioContext, type: 'white' | 'brown', seconds = 2): AudioBuffer {
  const len = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'brown') {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = white;
    }
  }
  return buffer;
}

interface NoiseNodes {
  stop: () => void;
}

const WhiteNoisePage: React.FC = () => {
  const [config, setConfig] = useState(() => loadConfig());
  const [playing, setPlaying] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(0); // 0 = 不限时
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<NoiseNodes | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fireTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveConfig = (patch: Partial<{ preset: string; volume: number }>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(CONFIG_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };

  const stopAll = () => {
    if (nodesRef.current) {
      nodesRef.current.stop();
      nodesRef.current = null;
    }
    if (fireTimerRef.current) {
      clearInterval(fireTimerRef.current);
      fireTimerRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (masterRef.current) {
      try { masterRef.current.disconnect(); } catch { /* noop */ }
      masterRef.current = null;
    }
  };

  const startPreset = (presetId: string) => {
    stopAll();
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!ctxRef.current) ctxRef.current = new AC();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') void ctx.resume();

      const master = ctx.createGain();
      master.gain.value = (config.volume / 100) * 0.8;
      master.connect(ctx.destination);
      masterRef.current = master;

      const cleanup: (() => void)[] = [];

      const noiseSource = (type: 'white' | 'brown') => {
        const src = ctx.createBufferSource();
        src.buffer = makeNoiseBuffer(ctx, type);
        src.loop = true;
        src.start();
        cleanup.push(() => { try { src.stop(); } catch { /* noop */ } });
        return src;
      };

      const filter = (type: BiquadFilterType, freq: number, q = 1) => {
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        f.Q.value = q;
        return f;
      };

      const lfo = (rate: number, depth: number) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = rate;
        const gain = ctx.createGain();
        gain.gain.value = depth;
        osc.connect(gain);
        osc.start();
        cleanup.push(() => { try { osc.stop(); } catch { /* noop */ } });
        return gain;
      };

      let out: AudioNode;

      switch (presetId) {
        case 'rain': {
          const src = noiseSource('white');
          const hp = filter('highpass', 300);
          const lp = filter('lowpass', 2400);
          src.connect(hp);
          hp.connect(lp);
          out = lp;
          break;
        }
        case 'waves': {
          const src = noiseSource('brown');
          const lp = filter('lowpass', 480);
          src.connect(lp);
          const waveGain = ctx.createGain();
          waveGain.gain.value = 0.32;
          lp.connect(waveGain);
          const l = lfo(0.08, 0.24);
          l.connect(waveGain.gain);
          out = waveGain;
          break;
        }
        case 'wind': {
          const src = noiseSource('white');
          const bp = filter('bandpass', 600, 0.7);
          src.connect(bp);
          const l = lfo(0.05, 260);
          l.connect(bp.frequency);
          const windGain = ctx.createGain();
          windGain.gain.value = 0.5;
          bp.connect(windGain);
          const l2 = lfo(0.07, 0.18);
          l2.connect(windGain.gain);
          out = windGain;
          break;
        }
        case 'fire': {
          const src = noiseSource('brown');
          const lp = filter('lowpass', 1100);
          src.connect(lp);
          const base = ctx.createGain();
          base.gain.value = 0.16;
          lp.connect(base);
          out = base;
          // 随机噼啪声
          const crackle = () => {
            if (Math.random() < 0.75) {
              try {
                const burst = ctx.createBufferSource();
                burst.buffer = makeNoiseBuffer(ctx, 'white', 0.06);
                const hp = filter('highpass', 1800);
                const g = ctx.createGain();
                g.gain.value = Math.random() * 0.3 + 0.05;
                burst.connect(hp);
                hp.connect(g);
                g.connect(master);
                burst.start();
                setTimeout(() => { try { burst.stop(); } catch { /* noop */ } }, 120);
              } catch { /* noop */ }
            }
          };
          fireTimerRef.current = setInterval(crackle, 90);
          break;
        }
        case 'brown': {
          const src = noiseSource('brown');
          const g = ctx.createGain();
          g.gain.value = 0.5;
          src.connect(g);
          out = g;
          break;
        }
        default: {
          const src = noiseSource('white');
          const g = ctx.createGain();
          g.gain.value = 0.35;
          src.connect(g);
          out = g;
          break;
        }
      }

      out.connect(master);
      nodesRef.current = {
        stop: () => {
          cleanup.forEach((fn) => fn());
          try { out.disconnect(); } catch { /* noop */ }
        },
      };

      // 定时关闭
      if (timerMinutes > 0) {
        timerRef.current = setTimeout(() => {
          setPlaying(false);
          stopAll();
          message.info('白噪音已按时关闭,休息一下吧');
        }, timerMinutes * 60 * 1000);
      }
    } catch (e) {
      console.warn('白噪音播放失败:', e);
      message.error('当前浏览器不支持音频合成');
    }
  };

  const togglePlay = () => {
    if (playing) {
      stopAll();
      setPlaying(false);
    } else {
      startPreset(config.preset);
      setPlaying(true);
      achEmit('noise_played');
    }
  };

  const handlePreset = (id: string) => {
    saveConfig({ preset: id });
    if (playing) {
      startPreset(id);
    }
  };

  const handleVolume = (v: number) => {
    saveConfig({ volume: v });
    if (masterRef.current) {
      try { masterRef.current.gain.value = (v / 100) * 0.8; } catch { /* noop */ }
    }
  };

  useEffect(() => {
    return () => {
      stopAll();
      if (ctxRef.current) {
        try { void ctxRef.current.close(); } catch { /* noop */ }
        ctxRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = PRESETS.find((p) => p.id === config.preset) ?? PRESETS[0];

  return (
    <div className="page-card noise-page">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconWave size={22} /> 白噪音
      </div>
      <p className="page-sub">声音由浏览器实时合成,零音频文件、完全离线,助你专注或入眠</p>

      <div className="noise-body">
        {/* 播放器 */}
        <div className={`noise-player ${playing ? 'playing' : ''}`}>
          <div className="noise-emoji">{active.emoji}</div>
          <div className="noise-name">{active.name}</div>
          <div className="noise-desc">{active.desc}</div>
          <div className="noise-bars">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.13}s` }} />
            ))}
          </div>
          <Button
            type="primary"
            size="large"
            shape="round"
            className="noise-play-btn"
            icon={playing ? <IconPause size={20} /> : <IconPlay size={20} />}
            onClick={togglePlay}
          >
            {playing ? '暂停' : '播放'}
          </Button>
        </div>

        {/* 音景选择 */}
        <div className="noise-presets">
          {PRESETS.map((p) => (
            <div
              key={p.id}
              className={`noise-preset ${config.preset === p.id ? 'active' : ''}`}
              onClick={() => handlePreset(p.id)}
            >
              <span className="noise-preset-emoji">{p.emoji}</span>
              <span className="noise-preset-name">{p.name}</span>
            </div>
          ))}
        </div>

        {/* 控制 */}
        <div className="noise-controls">
          <div className="noise-control-row">
            <span className="noise-control-label">音量</span>
            <Slider
              style={{ flex: 1 }}
              value={config.volume}
              onChange={handleVolume}
              min={0}
              max={100}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
            <span className="noise-control-value">{config.volume}%</span>
          </div>
          <div className="noise-control-row">
            <span className="noise-control-label">定时关闭</span>
            <Segmented
              value={timerMinutes}
              onChange={(v) => setTimerMinutes(v as number)}
              options={[
                { label: '不限', value: 0 },
                { label: '15分', value: 15 },
                { label: '30分', value: 30 },
                { label: '60分', value: 60 },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteNoisePage;
