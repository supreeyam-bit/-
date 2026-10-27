// คัดลอกไฟล์ที่ build แล้ว (HTML ไฟล์เดียว) ไปไว้ที่ blockworld.html ให้ครูเปิดได้ทันที
import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
copyFileSync(join(root, 'dist', 'index.html'), join(root, 'blockworld.html'));
console.log('✓ blockworld/blockworld.html');
