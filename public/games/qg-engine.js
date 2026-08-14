/**
 * 青孤项目 — 共享游戏引擎
 * 提供：WebAudio 合成音效（零音频文件）、手机震动反馈、最高分存档、通用轻触音
 * 用法：<script src="./qg-engine.js"></script>
 * API：qg.sfx.click()/move()/score()/drop()/perfect()/over()/success()
 *      qg.vibrate(pattern)  qg.best(key, value?)  qg.tap()
 */
(function () {
  'use strict';

  var audioCtx = null;

  function ensureCtx() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* noop */ }
  }

  /** 合成一个音符 */
  function tone(freq, dur, type, vol, delay) {
    try {
      ensureCtx();
      if (!audioCtx) return;
      var t0 = audioCtx.currentTime + (delay || 0);
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.22, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) { /* noop */ }
  }

  var sfx = {
    /** 轻触（自动绑定所有点击） */
    tap: function () { tone(340, 0.05, 'sine', 0.08); },
    click: function () { tone(520, 0.05, 'triangle', 0.16); },
    move: function () { tone(230, 0.04, 'square', 0.05); },
    score: function () { tone(660, 0.08, 'sine', 0.2); tone(880, 0.12, 'sine', 0.2, 0.07); },
    drop: function () { tone(190, 0.12, 'triangle', 0.3); },
    perfect: function () { tone(523, 0.09, 'sine', 0.24); tone(659, 0.09, 'sine', 0.24, 0.08); tone(784, 0.16, 'sine', 0.24, 0.16); },
    over: function () { tone(300, 0.18, 'sawtooth', 0.16); tone(220, 0.22, 'sawtooth', 0.16, 0.14); tone(150, 0.38, 'sawtooth', 0.14, 0.3); },
    success: function () { tone(587, 0.1, 'sine', 0.24); tone(880, 0.18, 'sine', 0.24, 0.09); },
    win: function () { tone(523, 0.1, 'sine', 0.24); tone(659, 0.1, 'sine', 0.24, 0.1); tone(784, 0.1, 'sine', 0.24, 0.2); tone(1046, 0.28, 'sine', 0.26, 0.3); }
  };

  function vibrate(pattern) {
    try {
      if ('vibrate' in navigator) navigator.vibrate(pattern);
    } catch (e) { /* noop */ }
  }

  /** 最高分存取：qg.best('key') 读取；qg.best('key', 值) 写入（返回新值） */
  function best(key, value) {
    var k = 'qg_best_' + key;
    try {
      if (typeof value === 'number') {
        localStorage.setItem(k, String(value));
        return value;
      }
      return parseFloat(localStorage.getItem(k) || '0') || 0;
    } catch (e) {
      return 0;
    }
  }

  /* 通用轻触反馈：所有点击/触摸都有轻微声音 + 震动 */
  document.addEventListener('pointerdown', function () {
    sfx.tap();
  }, { passive: true });

  window.qg = {
    sfx: sfx,
    vibrate: vibrate,
    best: best
  };
})();
