import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLE=1 → รวมทุกอย่างเป็นไฟล์ HTML เดียว (เปิดด้วยดับเบิลคลิกได้โดยไม่ต้องมีเซิร์ฟเวอร์)
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { assetsInlineLimit: 100_000_000 },
  test: { environment: 'node' },
} as never);
