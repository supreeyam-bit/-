import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:single` ได้ไฟล์ dist-single/index.html ไฟล์เดียว เปิดในเบราว์เซอร์ได้โดยไม่ต้องมีเซิร์ฟเวอร์
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
}));
