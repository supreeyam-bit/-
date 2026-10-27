// เล่นเกมจริงในเบราว์เซอร์ตั้งแต่ต้นจนจบ (2 ผู้เล่น) เพื่อตรวจตาม Acceptance tests
// ใช้: npm run build && node scripts/smoke.mjs [โฟลเดอร์เก็บภาพหน้าจอ]
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// ใช้ Playwright ที่ติดตั้งในเครื่อง (ในโปรเจกต์ หรือแบบ global ผ่าน NODE_PATH)
const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = resolve(process.argv[2] ?? join(root, 'dist', 'shots'));
mkdirSync(shots, { recursive: true });
const url = pathToFileURL(join(root, 'blockworld.html')).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('dialog', (d) => d.accept());
const ok = (cond, msg) => {
  if (!cond) throw new Error(`✗ ${msg}`);
  console.log(`✓ ${msg}`);
};
const shot = (name) => page.screenshot({ path: join(shots, `${name}.png`) });
const modal = () => page.locator('.modal').last();
const closeModal = async () => { while (await page.locator('.modal').count()) await page.keyboard.press('Escape'); };

await page.goto(url);
await shot('01-setup');
await page.getByRole('button', { name: '🚀 เริ่มเกม' }).click();
await page.getByRole('button', { name: '🚀 ออกผจญภัย' }).click();
await shot('02-board');

// 1. ทอยแล้วตัวเดินเปลี่ยนตำแหน่งจริง
const before = await page.locator('.token').first().getAttribute('style');
await page.getByRole('button', { name: /ทอยลูกเต๋า/ }).click();
await page.waitForTimeout(2200);
const after = await page.locator('.token').first().getAttribute('style');
ok(before !== after, 'ทอยลูกเต๋าแล้วตัวเดินเปลี่ยนตำแหน่ง');
await shot('03-after-roll');
await closeModal();
await page.keyboard.press('Escape');

// 3. สถานีทั้ง 7
const stations = await page.locator('.stations .station').allInnerTexts();
ok(stations.length === 7, `มีสถานี 7 องค์ประกอบ: ${stations.map((s) => s.replace(/^\S+\s/, '')).join(' | ')}`);

// 7. เปิดความรู้/ช่วยเหลือ/โค้ชได้
await page.getByRole('button', { name: /2\. ศูนย์การเรียนรู้/ }).click();
await page.getByRole('button', { name: /ตัวอย่างการแสดงผล AR/ }).click();
ok(await page.locator('.ar-badge').isVisible(), 'ศูนย์การเรียนรู้เปิดตัวอย่าง AR จำลองได้');
await shot('04-learning-ar');
await page.keyboard.press('Escape');

let pinDone = false;
async function enterPin() {
  if (pinDone) return;
  const pin = modal().locator('input[type=password]');
  if (await pin.count()) {
    await pin.first().fill('1234');
    await modal().getByRole('button', { name: '🔓 เข้าโหมดครู' }).first().click();
    pinDone = true;
  }
}

async function exchange() {
  for (let i = 0; i < 4; i++) {
    const waiting = modal().locator('.speaker', { hasText: '⏳' });
    if (!(await waiting.count())) break;
    await waiting.first().click();
    await modal().locator('.exchange textarea').fill('ฉันชอบที่เพื่อนเรียงคำชัดเจน ลองเพิ่มคำบอกเวลาอีกนิด');
    await modal().getByRole('button', { name: /บันทึกความคิดของ/ }).click();
  }
}

async function fillVisible(text) {
  for (const ta of await modal().locator('textarea.answer:visible').all()) {
    if (!(await ta.inputValue()) && !(await ta.isDisabled())) await ta.fill(text);
  }
  for (const r of await modal().locator('.choices').all()) await r.locator('input[type=radio]').last().check();
  for (const c of await modal().locator('.self-check input[type=checkbox]:visible').all()) await c.check();
}

async function doMission(n) {
  await page.getByRole('button', { name: /กระดานภารกิจ/ }).first().click();
  const item = modal().locator('.mission-item').nth(n);
  await item.getByRole('button').click();
  // ขั้น 1 สถานการณ์ปัญหา
  await modal().locator('.idea').first().click();
  await modal().locator('.problem-step textarea').nth(1).fill('ใช้บล็อกคำเรียงใหม่และถามเพื่อน');
  await modal().getByRole('button', { name: 'ไปสร้างคำตอบ ➡️' }).click();
  // ขั้น 2 ใช้เครื่องมือเรียงบล็อกคำครั้งหนึ่ง แล้วพิมพ์ช่องที่เหลือ
  const builder = modal().locator('.builder').first();
  if (await builder.count()) {
    const chips = builder.locator('.bank .word-chip');
    await chips.nth(1).click();
    await chips.nth(0).click();
    await builder.locator('.row-chip button[aria-label^="เลื่อน"]').first().click({ trial: false }).catch(() => {});
    await builder.getByRole('button', { name: '⬇️ ใช้ประโยคนี้' }).click();
  }
  await fillVisible('ตอนเย็นแมวสีดำของยายกินปลาที่บ้าน เพราะแมวหิวครับ ขอบคุณ ขอโทษ ที่ช่วย');
  await modal().getByRole('button', { name: 'ส่งให้เพื่อนช่วยดู ➡️' }).click();
  // ขั้น 3 แลกเปลี่ยน
  await exchange();
  // ปรับปรุงคำตอบ 1 ครั้ง (ก่อน/หลังแก้)
  await modal().getByRole('button', { name: '✏️ ปรับปรุงคำตอบ' }).click();
  const first = modal().locator('textarea.answer:visible').first();
  await first.fill((await first.inputValue()) + ' (แก้แล้ว)');
  await modal().getByRole('button', { name: 'ส่งให้เพื่อนช่วยดู ➡️' }).click();
  await modal().getByRole('button', { name: 'ไปตรวจและรับรอง ➡️' }).click();
  await modal().getByRole('button', { name: /ส่งให้เพื่อน\/ครูช่วยตรวจ/ }).click();
  await enterPin();
  await modal().getByRole('button', { name: '✅ รับรองผ่าน' }).click();
  ok(await modal().locator('.approved-box').isVisible(), `ภารกิจข้อ ${n + 1} ผ่านการรับรองโดยครู`);
  await closeModal();
  await page.getByRole('button', { name: /จบตา/ }).click();
}

async function doBoss(zoneNo) {
  await page.getByRole('button', { name: '⚡ สู้บอส' }).click();
  await modal().getByRole('button', { name: /เริ่มสู้ด้วยภาษา/ }).click();
  const tasks = modal().locator('.boss-task');
  const n = await tasks.count();
  for (let i = 0; i < n; i++) {
    const t = tasks.nth(i);
    if ((await t.getAttribute('open')) === null) await t.locator('summary').click();
    for (const ta of await t.locator('textarea.answer').all()) await ta.fill('คุณยายครับ ช่วยบอกทางไปป้ายรถหน่อยได้ไหมครับ เมื่อวานตอนเย็นที่ทุ่งนา เพราะผมหลงทาง');
    for (const c of await t.locator('.self-check input').all()) await c.check();
    await t.getByRole('button', { name: /ใช้ภาษาโจมตี/ }).click();
  }
  await exchange();
  await modal().getByRole('button', { name: '✅ รับรองผ่าน' }).click();
  ok(await modal().locator('.won-text').isVisible(), `ชนะบอสโซน ${zoneNo} ได้คริสตัล`);
  if (zoneNo === 1) await shot('06-boss-won');
  await closeModal();
}

for (const z of [1, 2, 3]) {
  // 5. จบโซนไม่ได้จนทำครบ 5 หัวข้อ
  ok(await page.getByRole('button', { name: '⚡ สู้บอส' }).isDisabled(), `โซน ${z}: บอสยังล็อกก่อนทำครบ 5 หัวข้อ`);
  const tower = await page.getByRole('button', { name: /5\. ศูนย์ส่งเสริมการคิดสร้างสรรค์/ });
  for (let i = 0; i < 5; i++) {
    await doMission(i);
    if (z === 1 && i === 0) {
      // 8. รีเฟรชแล้วความคืบหน้ายังอยู่
      await page.reload();
      pinDone = false; // โหมดครูไม่ถูกจำข้ามการรีเฟรช ต้องใส่ PIN ใหม่
      ok((await page.locator('.mini-missions .st-done').count()) === 1, 'รีเฟรชหน้าแล้วความคืบหน้ายังอยู่');
    }
  }
  if (z === 1) await shot('05-zone1-done');
  await tower.click();
  ok(await modal().getByText('ประตูหอคอยยังล็อกอยู่').isVisible(), `โซน ${z}: หอคอยยังล็อก`);
  await closeModal();
  await doBoss(z);
}
await shot('07-all-zones');

// 6. หอคอย 4 ด่าน
await page.getByRole('button', { name: /5\. ศูนย์ส่งเสริมการคิดสร้างสรรค์/ }).click();
const stage = async (i) => { await modal().locator('.tower-progress .step').nth(i).click(); await modal().getByRole('button', { name: /เริ่มด่าน/ }).click(); };
await stage(0);
await modal().getByRole('button', { name: /เริ่มจับเวลา/ }).click();
for (const s of ['เด็ก ๆ เล่นว่าวในทุ่งนา', 'สุนัขวิ่งไล่ว่าว', 'แม่ค้าขายขนม']) {
  await modal().locator('input[aria-label="ประโยคจากภาพ"]').fill(s);
  await modal().locator('input[aria-label="ประโยคจากภาพ"]').press('Enter');
}
ok(await modal().locator('.timer').isVisible(), 'ด่าน F มีตัวจับเวลา 2 นาที');
await shot('08-tower-f');
await modal().getByRole('button', { name: '✅ รับรองผ่าน' }).click();
await stage(1);
const ways = await modal().locator('#flex-way option').allInnerTexts();
for (let i = 0; i < 3; i++) {
  await modal().locator('#flex-way').selectOption(ways[i]);
  await modal().locator('input[aria-label="ประโยคแบบใหม่"]').fill(['หมากินปลา', 'แมวดมปลา', 'แมวกินปลาไหม'][i]);
  await modal().getByRole('button', { name: '➕ เพิ่ม' }).click();
}
await modal().getByRole('button', { name: '✅ รับรองผ่าน' }).click();
await stage(2);
for (const ta of await modal().locator('textarea.answer').all()) await ta.fill('หุ่นยนต์กางร่มให้เมล็ดพันธุ์ เพราะกลัวเมล็ดเปียกฝนจนไม่งอก');
await modal().getByRole('button', { name: '✅ รับรองผ่าน' }).click();
await stage(3);
for (const [i, v] of ['สีเหลืองตัวเล็ก', 'อย่างร่าเริง', 'ตอนเช้า', 'เหนือทุ่งนา'].entries()) await modal().locator('.elab-field input').nth(i).fill(v);
await modal().locator('textarea.answer').first().fill('ตอนเช้านกสีเหลืองตัวเล็กบินอย่างร่าเริงเหนือทุ่งนา');
for (const c of await modal().locator('.self-check input').all()) await c.check();
await modal().getByRole('button', { name: '✅ รับรองผ่าน' }).click();
await page.waitForTimeout(300);
ok(await page.getByText('หอคอยเปล่งแสง! อาณาจักรกลับมาสดใส').isVisible(), 'ผ่านหอคอยครบ 4 ด่าน จบเกม');
await shot('09-ending');
await closeModal();

// 9. แดชบอร์ดครูดูชิ้นงานรายคนและ export ได้
await page.getByRole('button', { name: /แดชบอร์ดครู/ }).click();
ok(await modal().getByText('ข้อมูลกิจกรรมฝึก ไม่ใช่คะแนนเครื่องมือวิจัยที่ผ่านการตรวจสอบ').isVisible(), 'แดชบอร์ดแสดงข้อความแยกจากเครื่องมือวิจัย');
ok((await modal().locator('.work-card').count()) > 0, 'แดชบอร์ดแสดงชิ้นงานรายคน');
const [dl] = await Promise.all([page.waitForEvent('download'), modal().getByRole('button', { name: '⬇️ ส่งออก CSV' }).click()]);
ok(/\.csv$/.test(dl.suggestedFilename()), `ส่งออก CSV ได้ (${dl.suggestedFilename()})`);
const [dj] = await Promise.all([page.waitForEvent('download'), modal().getByRole('button', { name: '⬇️ ส่งออก JSON' }).click()]);
ok(/\.json$/.test(dj.suggestedFilename()), `ส่งออก JSON ได้ (${dj.suggestedFilename()})`);
await shot('10-dashboard');
await closeModal();

// แท็บเล็ตแนวตั้ง
await page.setViewportSize({ width: 820, height: 1180 });
await shot('11-tablet');

ok(errors.length === 0, `ไม่มี error ในคอนโซล${errors.length ? `: ${errors.join('\n')}` : ''}`);
await browser.close();
console.log(`ภาพหน้าจออยู่ที่ ${shots}`);
