/**
 * 生产模式：编译 Electron 主进程（tsc）
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

execSync('npx tsc -p tsconfig.main.json', {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

console.log('✅ 主进程编译完成');
