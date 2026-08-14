/**
 * 青孤项目 — PWA 图标生成器（零依赖）
 * 纯 Node.js 手写光栅化 + PNG 编码，不引入任何第三方库。
 * 用法：node scripts/gen-icons.mjs
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'public');

/* ---------------- PNG 编码 ---------------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type: RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------------- 调色 ---------------- */
const BG_TOP = [13, 18, 32];      // #0d1220
const BG_BOTTOM = [27, 43, 74];   // #1b2b4a
const RING = [34, 211, 238, 0.35 * 255];       // rgba(34,211,238,.35)
const RAY = [103, 232, 249, 0.45 * 255];       // rgba(103,232,249,.45)
const CYAN_TOP = [34, 211, 238];  // #22d3ee
const CYAN_BOTTOM = [8, 145, 178];// #0891b2

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 圆角矩形内部判定（世界坐标，中心 cx,cy，半宽 hw，半高 hh，圆角 r） */
function insideRoundRect(wx, wy, cx, cy, hw, hh, r) {
  const qx = Math.abs(wx - cx) - (hw - r);
  const qy = Math.abs(wy - cy) - (hh - r);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) <= r;
}

/** 点到线段的距离 */
function distSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const t = clamp01(((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

const RAYS = [
  [16, 2, 16, 4.6],
  [16, 27.4, 16, 30],
  [2, 16, 4.6, 16],
  [27.4, 16, 30, 16],
];
const EYES = [[11, 13], [21, 13]];
const EYE_R = 2.4;
const SMILE_CX = 16, SMILE_CY = 21.25, SMILE_RX = 8.5, SMILE_RY = 4.75;
const SMILE_SAMPLES = (() => {
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const a = ((25 + (130 * i) / 60) * Math.PI) / 180;
    pts.push([SMILE_CX + SMILE_RX * Math.cos(a), SMILE_CY + SMILE_RY * Math.sin(a)]);
  }
  return pts;
})();

function smileDist(wx, wy) {
  let d = Infinity;
  for (let i = 0; i < SMILE_SAMPLES.length - 1; i++) {
    const [ax, ay] = SMILE_SAMPLES[i];
    const [bx, by] = SMILE_SAMPLES[i + 1];
    d = Math.min(d, distSegment(wx, wy, ax, ay, bx, by));
  }
  return d;
}

/**
 * 渲染图标到 RGBA 缓冲
 * @param {number} size   目标尺寸
 * @param {'normal'|'maskable'|'apple'} mode
 */
function render(size, mode) {
  const SS = 3; // 超采样倍数（抗锯齿）
  const N = size * SS;
  const contentScale = mode === 'maskable' ? size * 0.66 : mode === 'apple' ? size * 0.85 : size;
  const worldScale = contentScale / 32; // 世界坐标（32 单位）→ 像素
  const half = size / 2;
  const rgba = Buffer.alloc(N * N * 4);

  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      const fx = px / SS + 0.5 / SS;
      const fy = py / SS + 0.5 / SS;
      const wx = (fx - half) / worldScale + 16;
      const wy = (fy - half) / worldScale + 16;

      let r = 0, g = 0, b = 0, a = 0; // 预乘与否无所谓，最终写 straight alpha

      // 背景：normal 为圆角矩形，maskable/apple 为整块正方形
      let inside = true;
      if (mode === 'normal') {
        inside = insideRoundRect(wx, wy, 16, 16, 16, 16, 8.5);
      }
      if (inside) {
        const t = clamp01((wx + wy) / 64);
        r = lerp(BG_TOP[0], BG_BOTTOM[0], t);
        g = lerp(BG_TOP[1], BG_BOTTOM[1], t);
        b = lerp(BG_TOP[2], BG_BOTTOM[2], t);
        a = 255;

        // 边框环
        if (mode === 'normal') {
          const inOuter = insideRoundRect(wx, wy, 16, 16, 16, 16, 8.5);
          const inInner = insideRoundRect(wx, wy, 16, 16, 15.4, 15.4, 7.9);
          if (inOuter && !inInner) {
            r = RING[0]; g = RING[1]; b = RING[2]; a = RING[3];
          }
        }

        // 光线
        for (const [ax, ay, bx, by] of RAYS) {
          if (distSegment(wx, wy, ax, ay, bx, by) <= 0.55) {
            r = RAY[0]; g = RAY[1]; b = RAY[2]; a = RAY[3];
          }
        }

        // 眼睛（青色渐变）
        for (const [ex, ey] of EYES) {
          const d = Math.hypot(wx - ex, wy - ey);
          if (d <= EYE_R) {
            const t = clamp01((wy - (ey - EYE_R)) / (2 * EYE_R));
            r = lerp(CYAN_TOP[0], CYAN_BOTTOM[0], t);
            g = lerp(CYAN_TOP[1], CYAN_BOTTOM[1], t);
            b = lerp(CYAN_TOP[2], CYAN_BOTTOM[2], t);
            a = 255;
          }
        }

        // 微笑弧线
        if (smileDist(wx, wy) <= 0.9) {
          r = CYAN_TOP[0]; g = CYAN_TOP[1]; b = CYAN_TOP[2]; a = 255;
        }
      }

      const idx = (py * N + px) * 4;
      rgba[idx] = Math.round(r);
      rgba[idx + 1] = Math.round(g);
      rgba[idx + 2] = Math.round(b);
      rgba[idx + 3] = Math.round(a);
    }
  }

  // 下采样（SS x SS 平均）
  const out = Buffer.alloc(size * size * 4);
  const ss2 = SS * SS;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const idx = ((y * SS + sy) * N + (x * SS + sx)) * 4;
          r += rgba[idx]; g += rgba[idx + 1]; b += rgba[idx + 2]; a += rgba[idx + 3];
        }
      }
      const idx = (y * size + x) * 4;
      out[idx] = Math.round(r / ss2);
      out[idx + 1] = Math.round(g / ss2);
      out[idx + 2] = Math.round(b / ss2);
      out[idx + 3] = Math.round(a / ss2);
    }
  }
  return out;
}

function save(name, size, mode) {
  const file = path.join(OUT_DIR, name);
  fs.writeFileSync(file, encodePNG(size, size, render(size, mode)));
  console.log(`已生成: ${file} (${size}x${size}, ${mode})`);
}

save('icon-192.png', 192, 'normal');
save('icon-512.png', 512, 'normal');
save('maskable-512.png', 512, 'maskable');
save('apple-touch-icon.png', 180, 'apple');
console.log('全部图标生成完成');
