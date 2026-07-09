/**
 * 开发模式：编译 Electron 主进程（tsc）并启动
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

async function main() {
  // 使用 tsc 编译主进程和预加载脚本
  console.log('🔨 编译主进程...');
  const tsc = spawn('npx', ['tsc', '-p', 'tsconfig.main.json'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((resolve, reject) => {
    tsc.on('close', (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`tsc failed with code ${code}`));
    });
  });

  console.log('✅ 主进程编译完成，启动 Electron...');

  // 构建 Electron 环境变量（移除 ELECTRON_RUN_AS_NODE，否则 Electron 会伪装成 Node.js）
  const electronEnv = { ...process.env };
  delete electronEnv.ELECTRON_RUN_AS_NODE;
  electronEnv.VITE_DEV_SERVER_URL = 'http://localhost:5173';
  electronEnv.NODE_ENV = 'development';

  // 启动 Electron
  const electron = spawn('npx', ['electron', '.'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: electronEnv,
  });

  electron.on('close', () => {
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('❌ 启动失败:', err);
  process.exit(1);
});
