// สร้าง HTML ของชุดพิมพ์ทั้งหมด แล้วพิมพ์เป็น PDF ด้วย Chromium
// ใช้: node src/build.mjs [ชื่อไฟล์ ...]   (ไม่ใส่ = สร้างทุกไฟล์)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { boardHtml } from './board.mjs';
import { matsHtml } from './mats.mjs';
import { blocksHtml } from './blocks.mjs';
import { cardsHtml, largeCardsHtml } from './cards.mjs';
import { tokensHtml } from './tokens.mjs';
import { rulebookHtml } from './rulebook.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = join(ROOT, 'html'), PDF = join(ROOT, 'pdf');
mkdirSync(HTML, { recursive: true }); mkdirSync(PDF, { recursive: true });

const JOBS = [
  ['00-คู่มือและแบบประเมิน-A4', rulebookHtml, { format: 'A4' }],
  ['01-กระดานหลัก-A3x2', boardHtml, { width: '594mm', height: '420mm' }, 'split'],
  ['02-กระดานเมืองและแท่นวางประโยค-A4', matsHtml, { format: 'A4', landscape: true }],
  ['03-บล็อกคำ-A4', blocksHtml, { format: 'A4' }],
  ['04-การ์ดเกม-A4-พิมพ์สองหน้า', cardsHtml, { format: 'A4' }],
  ['05-การ์ดใหญ่-A4-พิมพ์สองหน้า', largeCardsHtml, { format: 'A4' }],
  ['06-โทเคน-ธง-หมุด-A4', tokensHtml, { format: 'A4' }],
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
  if (post === 'split') execFileSync('python3', [join(ROOT, 'src', 'split-a3.py'), join(PDF, name + '.pdf')]);
  console.log('✓', name);
}
await browser.close();
