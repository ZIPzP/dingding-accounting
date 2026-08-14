import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  root: '.',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // 手动分包：把稳定的第三方库独立成缓存友好的 chunk
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons', 'dayjs'],
          'vendor-charts': ['echarts', 'echarts-for-react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,  // 允许局域网内手机访问测试
    allowedHosts: true,  // 允许所有隧道域名访问
  },
});
