/**
 * 星际跑酷构建脚本
 * 使用 three-legacy(0.152 UMD 单文件)经典脚本方式加载,
 * 兼容 http(s)、GitHub Pages、Electron file:// 所有环境
 * 用法:node scripts/build-runner.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const game = fs.readFileSync(path.join(root, 'scripts/runner-game-src.mjs'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<title>星际跑酷 · 青孤项目</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #060810; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
  #game { position: fixed; inset: 0; display: block; touch-action: none; }
  .hud { position: fixed; z-index: 5; user-select: none; pointer-events: none; }
  .hud-top { top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; padding-top: calc(14px + env(safe-area-inset-top, 0px)); }
  .hud button { pointer-events: auto; border: none; cursor: pointer; background: rgba(255,255,255,0.08); color: #cbd5e1; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 999px; padding: 8px 16px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255,255,255,0.12); transition: all .18s ease; }
  .hud button:hover { background: rgba(255,255,255,0.16); color: #fff; }
  .score-wrap { text-align: center; }
  .score-num { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: 1px; text-shadow: 0 0 24px rgba(34,211,238,0.5); line-height: 1; font-variant-numeric: tabular-nums; }
  .score-label { font-size: 11px; color: #64748b; letter-spacing: 3px; margin-top: 3px; }
  .best-num { font-size: 13px; color: #94a3b8; font-variant-numeric: tabular-nums; }
  .best-label { font-size: 10px; color: #475569; letter-spacing: 2px; }
  .overlay { position: fixed; inset: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: rgba(4,6,12,0.72); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); animation: fadeIn .3s ease both; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .overlay-title { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: 2px; }
  .overlay-sub { font-size: 13px; color: #94a3b8; letter-spacing: 1px; }
  .overlay-score { font-size: 56px; font-weight: 800; color: #22d3ee; text-shadow: 0 0 30px rgba(34,211,238,0.55); line-height: 1; margin: 6px 0; font-variant-numeric: tabular-nums; }
  .overlay-best { font-size: 13px; color: #94a3b8; }
  .overlay-btn { pointer-events: auto; border: none; cursor: pointer; margin-top: 18px; padding: 14px 44px; border-radius: 999px; font-size: 16px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #06b6d4, #3b82f6); box-shadow: 0 8px 26px rgba(6,182,212,0.4); transition: all .2s ease; letter-spacing: 2px; }
  .overlay-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 34px rgba(6,182,212,0.5); }
  .overlay-btn:active { transform: scale(0.96); }
  .overlay-btn.ghost { background: rgba(255,255,255,0.1); box-shadow: none; border: 1px solid rgba(255,255,255,0.18); color: #cbd5e1; font-size: 14px; padding: 11px 30px; letter-spacing: 1px; margin-top: 0; }
  .hint { position: fixed; bottom: 20px; left: 0; right: 0; text-align: center; font-size: 12px; color: #64748b; letter-spacing: 2px; z-index: 5; pointer-events: none; padding-bottom: env(safe-area-inset-bottom, 0px); }
</style>
</head>
<body>
<canvas id="game"></canvas>

<div class="hud hud-top">
  <button id="btnBack" aria-label="返回">← 返回</button>
  <div class="score-wrap">
    <div class="score-num" id="scoreNum">0</div>
    <div class="score-label">SCORE</div>
  </div>
  <div style="text-align:right">
    <div class="best-num" id="bestNum">0</div>
    <div class="best-label">最佳</div>
  </div>
</div>

<div class="hint">点击跳跃 · 左右滑动变道 · 键盘 ↑/←/→</div>

<div class="overlay" id="startOverlay">
  <div class="overlay-title">🚀 星际跑酷</div>
  <div class="overlay-sub">真 3D 无尽跑酷:跳跃躲障,收集星能</div>
  <div class="overlay-best" id="startBest">最佳纪录:0</div>
  <button class="overlay-btn" id="btnStart">起飞!</button>
</div>

<div class="overlay" id="overOverlay" style="display:none">
  <div class="overlay-title">坠落星辰</div>
  <div class="overlay-sub">速度太快,星云太美</div>
  <div class="overlay-score" id="overScore">0</div>
  <div class="overlay-best" id="overBest">最佳纪录:0</div>
  <button class="overlay-btn" id="btnRestart">再飞一次</button>
  <button class="overlay-btn ghost" id="btnBack2">返回</button>
</div>

<script src="./qg-engine.js"></script>
<script src="./three-legacy.min.js"></script>
<script>
${game}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'public/games/runner.html'), html);
console.log(`✅ runner.html 已生成 (${(html.length / 1024).toFixed(0)} KB,Three.js 由外部 three-legacy.min.js 加载)`);
