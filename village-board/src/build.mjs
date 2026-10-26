// สร้าง HTML ของชุดพิมพ์ แล้วพิมพ์เป็น PDF ด้วย Chromium
// ใช้: node village-board/src/build.mjs [ชื่อไฟล์ ...]   (ไม่ใส่ = สร้างทุกไฟล์)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rulebookHtml } from './rulebook.mjs';
import { boardHtml } from './board.mjs';
import { matsHtml, tilesHtml, tokensHtml } from './pieces.mjs';
import { cardsHtml, largeCardsHtml } from './cards.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = join(ROOT, 'html'), PDF = join(ROOT, 'pdf');
mkdirSync(HTML, { recursive: true }); mkdirSync(PDF, { recursive: true });
// ใช้ Playwright ที่ติดตั้งไว้ในโปรเจกต์ print-and-play หรือที่ติดตั้งในเครื่อง
const req = createRequire(join(ROOT, '..', 'print-and-play', 'package.json'));
const { chromium } = req('playwright');

const JOBS = [
  ['00-คู่มือ-A4', rulebookHtml, { format: 'A4' }],
  ['01-กระดานหลัก-A3x2', boardHtml, { width: '594mm', height: '420mm' }, 'split'],
  ['02-แผ่นผู้เล่นและสื่อประกอบ-A4', matsHtml, { format: 'A4', landscape: true }],
  ['03-บล็อกคำ-A4', tilesHtml, { format: 'A4' }],
  ['04-การ์ดเล็ก-A4-พิมพ์สองหน้า', cardsHtml, { format: 'A4' }],
  ['05-การ์ดใหญ่-A4-พิมพ์สองหน้า', largeCardsHtml, { format: 'A4' }],
  ['06-โทเคน-A4', tokensHtml, { format: 'A4' }],
];

const only = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage();
for (const [name, make, opts, post] of JOBS) {
  if (only.length && !only.some((o) => name.includes(o))) continue;
  const file = join(HTML, name + '.html');
  writeFileSync(file, make());
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: join(PDF, name + '.pdf'), printBackground: true, preferCSSPageSize: true, ...opts });
  if (post === 'split') execFileSync('python3', [join(ROOT, '..', 'print-and-play', 'src', 'split-a3.py'), join(PDF, name + '.pdf')]);
  console.log('✓', name);
}
await browser.close();
