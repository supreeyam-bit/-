// ทดสอบการเล่นจริงในเบราว์เซอร์ (Playwright) กับไฟล์ dist-single/index.html
// รัน: npm run build:single && npm run test:e2e
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(join(root, 'dist-single', 'index.html')).href;
const shots = join(root, 'test-results');
mkdirSync(shots, { recursive: true });
const { missions } = JSON.parse(readFileSync(join(root, 'data', 'missions_exact_table2.json'), 'utf8'));

// ใช้ Playwright ในโปรเจกต์ถ้ามี ไม่งั้นใช้ตัวที่ติดตั้งไว้ทั้งเครื่อง
let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  const g = execSync('npm root -g').toString().trim();
  ({ chromium } = createRequire(join(g, 'x.js'))('playwright'));
}

let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failed++; };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
page.on('dialog', (d) => d.accept());
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url);
await page.getByTestId('count-2').click();
await page.getByTestId('start').click();
for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'ต่อไป ▶' }).click();
await page.getByTestId('intro-done').click();
ok(await page.getByTestId('current-player').isVisible(), 'เริ่มเกม 2 คน และผ่านคัตซีนเปิดเรื่อง');

// ทอยลูกเต๋า ตัวเดินต้องย้าย
const before = Number(await page.getByTestId('token-0').getAttribute('data-pos'));
await page.getByTestId('roll').click();
await page.waitForSelector('.overlay', { timeout: 5000 });
const after = Number(await page.getByTestId('token-0').getAttribute('data-pos'));
ok(after !== before && after >= 1 && after <= 3, `ตัวเดินย้ายจากช่อง ${before} ไปช่อง ${after}`);
await page.screenshot({ path: join(shots, '01-landed.png') });
await page.getByTestId('close-modal').click();

// เปิดภารกิจทั้ง 12 ใบ และข้อความตรงกับตารางที่ 2
await page.getByTestId('tab-missions').click();
for (const m of missions) {
  await page.getByTestId(`mission-card-${m.id}`).click();
  const text = (await page.getByTestId('instruction').locator('blockquote').innerText()).trim();
  const timer = await page.locator('.mission-head .badge.time').count();
  ok(text === m.instruction_exact_from_table_2 && (timer > 0) === Boolean(m.time_limit_minutes), `เปิดภารกิจ ${m.id} ข้อความตรง ตัวจับเวลา=${timer > 0}`);
  await page.getByTestId('close-modal').click();
}

// ทำโซน 1 ครบ: เสนอไอเดีย บันทึกประโยค ส่ง และครูรับรอง
await page.getByTestId('teacher-toggle').click();
for (const m of missions.filter((x) => x.zone === 1)) {
  await page.getByTestId(`mission-card-${m.id}`).click();
  const tabs = page.locator('.player-tabs button');
  for (let p = 0; p < 2; p++) {
    await page.getByTestId('idea-input').fill(`ไอเดีย ${m.id} คนที่ ${p + 1}`);
    await page.getByTestId('idea-post').click();
    await tabs.nth(p).click();
    // ใช้แท่นบล็อก: แตะบล็อก 2 ใบ แล้วย้ายตำแหน่ง
    await page.locator('.bank-words .wblock').nth(0).click();
    await page.locator('.bank-words .wblock').nth(1).click();
    ok((await page.locator('.tray .placed').count()) === 2, `${m.id} วางบล็อกบนแท่นได้`);
    await page.getByTestId('sentence-text').fill(p === 0 ? 'แมวสีส้มกินปลาทู' : 'น้องเตะลูกบอล');
    await page.getByTestId('save-sentence').click();
    if (m.work.drawing) {
      const c = page.getByTestId('drawpad');
      const b = await c.boundingBox();
      await page.mouse.move(b.x + 40, b.y + 40);
      await page.mouse.down();
      await page.mouse.move(b.x + 200, b.y + 150, { steps: 8 });
      await page.mouse.up();
      await page.getByRole('button', { name: 'บันทึกภาพวาด' }).click();
      ok((await page.locator('.drawings .thumbs img').count()) >= 1, `${m.id} วาดภาพและบันทึกได้`);
    }
    await page.getByTestId('submit-work').click();
  }
  ok((await page.getByTestId('entry').count()) === 1, `${m.id} บันทึกประโยคของผู้เล่นได้`);
  const approves = page.getByTestId('approve');
  for (let p = 0; p < 2; p++) await approves.nth(p).click();
  ok((await page.locator('.badge.ok').count()) === 1, `${m.id} ครูรับรองครบ ทีมผ่านภารกิจ`);
  if (m.id === 'Z1-E') await page.screenshot({ path: join(shots, '02-mission.png'), fullPage: true });
  await page.getByTestId('close-modal').click();
}

// บอสโซน 1 → คริสตัล → โซน 2
await page.getByRole('button', { name: '🗺️ แผนที่' }).click();
await page.getByTestId('face-boss').click({ force: true });
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'ต่อไป ▶' }).click();
await page.getByTestId('boss-win').click();
await page.screenshot({ path: join(shots, '03-boss.png') });
await page.getByRole('button', { name: 'ไปโซน 2' }).click();
ok((await page.locator('.gem.on').count()) === 1, 'ชนะบอสโซน 1 ได้คริสตัล 1 ก้อน');
ok((await page.locator('.side .label').filter({ hasText: 'โซน 2' }).count()) === 1, 'ทีมเข้าสู่โซน 2');

// บันทึกในเครื่อง: โหลดหน้าใหม่แล้วข้อมูลยังอยู่
await page.reload();
ok((await page.locator('.gem.on').count()) === 1, 'โหลดหน้าใหม่ ข้อมูลยังอยู่ (localStorage)');

// แดชบอร์ดและส่งออก
await page.getByTestId('tab-dashboard').click();
const [csv] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-csv').click()]);
const csvText = readFileSync(await csv.path(), 'utf8');
ok(csvText.includes('แมวสีส้มกินปลาทู') && csvText.includes('approved'), 'ส่งออก CSV มีผลงานและสถานะ');
const [json] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-json').click()]);
const saved = JSON.parse(readFileSync(await json.path(), 'utf8'));
ok(saved.zone === 2 && saved.bossDefeated[0] === true, 'ส่งออก JSON ได้สถานะเกมครบ');
await page.screenshot({ path: join(shots, '04-dashboard.png'), fullPage: true });

// จอมือถือ
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await phone.goto(url);
await phone.getByTestId('start').click();
await phone.getByRole('button', { name: 'ต่อไป ▶' }).click();
await phone.getByRole('button', { name: 'ต่อไป ▶' }).click();
await phone.getByTestId('intro-done').click();
const sw = await phone.evaluate(() => document.documentElement.scrollWidth);
ok(sw <= 390, `มือถือ 390px ไม่มีเลื่อนแนวนอน (กว้าง ${sw}px)`);
await phone.screenshot({ path: join(shots, '05-phone.png'), fullPage: true });

ok(errors.length === 0, `ไม่มี error ในหน้าเว็บ ${errors.join(' | ')}`);
await browser.close();
console.log(failed ? `\n${failed} ข้อไม่ผ่าน` : '\nผ่านทุกข้อ');
process.exit(failed ? 1 : 0);
