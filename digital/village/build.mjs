// รวม src/ เป็นไฟล์เกมหน้าเดียว ../sentence-village.html
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(here, 'src', f), 'utf8');
const js = ['data.js', 'lang.js', 'app.js'].map(src).join('\n').replace(/<\/script/gi, '<\\/script');
writeFileSync(join(here, '..', 'sentence-village.html'), src('shell.html').replace('/*__SCRIPTS__*/', () => js));
console.log('✓ digital/sentence-village.html');
