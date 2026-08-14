/**
 * 音乐工坊 — 离线 8-bit 编曲器
 * 五声音阶保证怎么点都好听,作品保存在本地
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Slider, Modal, Form, Input, message, Empty, Popconfirm } from 'antd';
import { IconPlay, IconPause, IconTrash, IconNote } from '../components/Icons';

const STEPS = 16;
const STORAGE_KEY = 'qinggu-melodies';

/* 五声音阶:怎么组合都好听 */
const MELODY_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
const BASS_NOTES = [130.81, 146.83, 164.81, 196.0];

interface Track {
  id: string;
  name: string;
  rows: number;
  kind: 'melody' | 'bass' | 'drum';
  cells: boolean[][]; // rows x 16
}

interface Melody {
  id: string;
  name: string;
  createdAt: number;
  tracks: Track[];
}

function emptyTrack(id: string, name: string, rows: number, kind: Track['kind']): Track {
  return { id, name, rows, kind, cells: Array.from({ length: rows }, () => Array(STEPS).fill(false)) };
}

function defaultTracks(): Track[] {
  return [
    emptyTrack('m', '旋律', MELODY_NOTES.length, 'melody'),
    emptyTrack('b', '贝斯', BASS_NOTES.length, 'bass'),
    emptyTrack('d', '鼓点', 2, 'drum'),
  ];
}

function loadMelodies(): Melody[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* noop */ }
  return [];
}

const MusicStudioPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(() => defaultTracks());
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(-1);
  const [melodies, setMelodies] = useState<Melody[]>(() => loadMelodies());
  const [saveModal, setSaveModal] = useState(false);
  const [nameForm] = Form.useForm();

  const ctxRef = useRef<AudioContext | null>(null);
  const nextTimeRef = useRef(0);
  const stepRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playingRef = useRef(false);

  /* 音频引擎 */
  function ensureCtx(): AudioContext | null {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!ctxRef.current) ctxRef.current = new AC();
      if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
      return ctxRef.current;
    } catch {
      return null;
    }
  }

  function playNote(freq: number, time: number, type: OscillatorType, dur: number, vol: number) {
    const ctx = ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(vol, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  function playDrum(row: number, time: number) {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (row === 0) {
      /* 底鼓 */
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.16);
    } else {
      /* 军鼓 + 踩镲 */
      const bufferSize = Math.floor(ctx.sampleRate * 0.08);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(time);
    }
  }

  function scheduleStep(step: number, time: number) {
    const stepDur = 60 / bpm / 2; /* 八分音符 */
    for (const track of tracks) {
      for (let row = 0; row < track.rows; row++) {
        if (!track.cells[row]?.[step]) continue;
        if (track.kind === 'melody') {
          playNote(MELODY_NOTES[row], time, 'square', stepDur * 0.9, 0.14);
        } else if (track.kind === 'bass') {
          playNote(BASS_NOTES[row], time, 'triangle', stepDur * 0.95, 0.22);
        } else {
          playDrum(row, time);
        }
      }
    }
  }

  /* 播放循环(前瞻调度) */
  useEffect(() => {
    if (playing) {
      const ctx = ensureCtx();
      if (ctx) {
        nextTimeRef.current = ctx.currentTime + 0.06;
        stepRef.current = 0;
      }
      timerRef.current = setInterval(() => {
        const ctxNow = ensureCtx();
        if (!ctxNow) return;
        const stepDur = 60 / bpm / 2;
        while (nextTimeRef.current < ctxNow.currentTime + 0.15) {
          scheduleStep(stepRef.current % STEPS, nextTimeRef.current);
          setCurrentStep(stepRef.current % STEPS);
          nextTimeRef.current += stepDur;
          stepRef.current++;
        }
      }, 30);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentStep(-1);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, bpm, tracks]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ctxRef.current) {
        try { void ctxRef.current.close(); } catch { /* noop */ }
        ctxRef.current = null;
      }
    };
  }, []);

  const toggleCell = (trackId: string, row: number, step: number) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const cells = t.cells.map((r, ri) => (ri === row ? r.map((c, si) => (si === step ? !c : c)) : r));
        return { ...t, cells };
      })
    );
    /* 点击时预览音 */
    const track = tracks.find((t) => t.id === trackId);
    if (track) {
      const ctx = ensureCtx();
      if (ctx && track.cells[row]?.[step] === false) {
        const t0 = ctx.currentTime + 0.01;
        if (track.kind === 'melody') playNote(MELODY_NOTES[row], t0, 'square', 0.22, 0.15);
        else if (track.kind === 'bass') playNote(BASS_NOTES[row], t0, 'triangle', 0.3, 0.22);
        else playDrum(row, t0);
      }
    }
  };

  const togglePlay = () => {
    setPlaying((p) => {
      playingRef.current = !p;
      return !p;
    });
  };

  const clearAll = () => {
    setTracks(defaultTracks());
    message.info('已清空');
  };

  const saveMelody = async () => {
    try {
      const values = await nameForm.validateFields();
      const melody: Melody = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: values.name.trim(),
        createdAt: Date.now(),
        tracks: JSON.parse(JSON.stringify(tracks)),
      };
      const next = [melody, ...melodies].slice(0, 20);
      setMelodies(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      setSaveModal(false);
      nameForm.resetFields();
      message.success('作品已保存!');
    } catch { /* 校验失败 */ }
  };

  const loadMelody = (m: Melody) => {
    setTracks(JSON.parse(JSON.stringify(m.tracks)));
    setPlaying(false);
    message.success(`已载入「${m.name}」`);
  };

  const deleteMelody = (id: string) => {
    const next = melodies.filter((m) => m.id !== id);
    setMelodies(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const noteLabels = useMemo(
    () => ({
      melody: ['Do', 'Re', 'Mi', 'So', 'La', 'Do′', 'Re′', 'Mi′'],
      bass: ['C2', 'D2', 'E2', 'G2'],
      drum: ['🥁 底鼓', '🥁 军鼓/镲'],
    }),
    []
  );

  return (
    <div className="page-card music-page">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconNote size={22} /> 音乐工坊
      </div>
      <p className="page-sub">8-bit 编曲器:点格子谱曲,五声音阶保证好听,完全离线</p>

      {/* 控制栏 */}
      <div className="music-controls">
        <Button type="primary" size="large" icon={playing ? <IconPause size={18} /> : <IconPlay size={18} />} onClick={togglePlay}>
          {playing ? '停止' : '播放'}
        </Button>
        <div className="music-bpm">
          <span className="music-bpm-label">速度</span>
          <Slider style={{ width: 130 }} min={60} max={200} value={bpm} onChange={setBpm} tooltip={{ formatter: (v) => `${v} BPM` }} />
          <span className="music-bpm-value">{bpm} BPM</span>
        </div>
        <Button onClick={clearAll}>清空</Button>
        <Button type="primary" ghost onClick={() => setSaveModal(true)}>
          保存作品
        </Button>
      </div>

      {/* 音轨网格 */}
      <div className="music-tracks">
        {tracks.map((track) => (
          <div className="music-track" key={track.id}>
            <div className="music-track-head">
              <span className="music-track-name">{track.name}</span>
              <span className="music-track-kind">
                {track.kind === 'melody' ? '🔊 方波' : track.kind === 'bass' ? '🎸 三角波' : '🥁 打击乐'}
              </span>
            </div>
            <div className="music-grid-wrap">
              <div className="music-row-labels">
                {Array.from({ length: track.rows }).map((_, r) => (
                  <span key={r} className="music-row-label">
                    {track.kind === 'drum' ? noteLabels.drum[r] : noteLabels[track.kind][r]}
                  </span>
                ))}
              </div>
              <div className="music-grid">
                {Array.from({ length: track.rows }).map((_, row) => (
                  <div className="music-grid-row" key={row}>
                    {Array.from({ length: STEPS }).map((_, step) => (
                      <button
                        key={step}
                        className={`music-cell ${track.cells[row]?.[step] ? 'on' : ''} ${step % 4 === 0 ? 'beat' : ''} ${currentStep === step && playing ? 'playing' : ''}`}
                        onClick={() => toggleCell(track.id, row, step)}
                        aria-label={`${track.name} 第${step + 1}拍`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 我的作品 */}
      <div className="music-library">
        <div className="music-library-title">我的作品（{melodies.length}）</div>
        {melodies.length === 0 ? (
          <Empty description="还没有作品,编一段旋律保存下来吧" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="music-library-list">
            {melodies.map((m) => (
              <div className="music-library-item" key={m.id}>
                <span className="music-library-name">🎵 {m.name}</span>
                <span className="music-library-date">
                  {new Date(m.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <Button size="small" type="primary" ghost onClick={() => loadMelody(m)}>
                  载入
                </Button>
                <Popconfirm title="删除这个作品？" onConfirm={() => deleteMelody(m.id)} okText="确定" cancelText="取消">
                  <Button size="small" danger icon={<IconTrash size={13} />} />
                </Popconfirm>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 保存弹窗 */}
      <Modal
        title="保存作品"
        open={saveModal}
        onOk={saveMelody}
        onCancel={() => setSaveModal(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={nameForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="作品名"
            name="name"
            rules={[{ required: true, message: '给作品起个名字' }, { max: 20, message: '最多 20 个字' }]}
          >
            <Input placeholder="例如:夏日小调" maxLength={20} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MusicStudioPage;
