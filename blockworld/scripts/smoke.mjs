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

// 1. ทอยแล้วตัวเดินเปลี่ยนตำแหน่งจริง (ทอยหลายตา เพื่อให้ตกช่องหลายชนิด รวมช่องภารกิจที่เปิดภารกิจทันที)
for (let t = 0; t < 6; t++) {
  const who = t % 2;
  const before = await page.locator('.team li').nth(who).innerText();
  await page.getByRole('button', { name: /ทอยลูกเต๋า/ }).click();
  await page.waitForTimeout(2400);
  const after = await page.locator('.team li').nth(who).innerText();
  ok(before !== after, `ตาที่ ${t + 1}: ทอยแล้วตัวเดินเปลี่ยนตำแหน่ง (${before.split('\n').pop()} → ${after.split('\n').pop()})`);
  if (t === 0) await shot('03-after-roll');
  await closeModal();
  await page.keyboard.press('Escape');
  // ภารกิจที่เปิดจากช่องจะเหลือค้างไว้ ทำต่อได้ภายหลังจากกระดานภารกิจ
  await page.getByRole('button', { name: /จบตา/ }).click();
}

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
    const waiting = modal().locator('.exchange .speaker', { hasText: '⏳' });
    if (!(await waiting.count())) break;
    await waiting.first().click();
    await modal().locator('.exchange textarea').fill('ฉันชอบที่เพื่อนใช้คำขยายชัดเจน ลองเพิ่มคำลงท้ายให้เหมาะกับผู้ฟังอีกนิด');
    await modal().getByRole('button', { name: /บันทึกความคิดของ/ }).click();
  }
}

const SENTENCE = 'คุณครูคะ ตอนเย็นแมวสีส้มไม่ได้กินปลาที่ทุ่งนา ว่าว ลม ห้องเรียน ใครช่วยหน่อยได้ไหมคะ เพราะสนุก';

/** กรอกใบงานของผู้เล่นที่เปิดอยู่ให้ครบตามเงื่อนไขภารกิจ */
async function fillSheet(n) {
  const sheet = modal().locator('.sheet');
  const start = sheet.getByRole('button', { name: /เริ่มจับเวลา/ });
  if (await start.count()) await start.click();
  if (await sheet.locator('.cubes').count()) await sheet.locator('.cubes').getByRole('button', { name: '🎲 ทอย' }).click();
  for (const inp of await sheet.locator('.elab-field input').all()) await inp.fill(`คำขยายแปลกใหม่${n}`);
  const list = sheet.locator('.items-editor');
  if (await list.count()) {
    const sel = list.locator('select');
    const opts = (await sel.count()) ? await sel.locator('option').allInnerTexts() : [''];
    for (let i = 0; i < 3; i++) {
      if (await sel.count()) await sel.selectOption(opts[i % opts.length]);
      const input = list.locator('.builder-free input');
      await input.fill(`แมวกินปลาตอนเย็นครับ แบบที่ ${i + 1} ของคนที่ ${n}`);
      await input.press('Enter');
    }
  }
  const builder = sheet.locator('.builder').first();
  if (await builder.count()) {
    await builder.locator('.bank .word-chip').nth(1).click();
    await builder.locator('.bank .word-chip').nth(0).click();
    await builder.getByRole('button', { name: '⬇️ ใช้ประโยคนี้' }).click();
  }
  for (const ta of await sheet.locator('textarea.answer').all()) if (!(await ta.inputValue())) await ta.fill(`${SENTENCE} (${n})`);
  const canvas = sheet.locator('canvas');
  if (await canvas.count()) {
    await canvas.scrollIntoViewIfNeeded();
    const b = await canvas.boundingBox();
    await page.mouse.move(b.x + 40, b.y + 40);
    await page.mouse.down();
    await page.mouse.move(b.x + 200, b.y + 120, { steps: 8 });
    await page.mouse.up();
  }
  for (const c of await sheet.locator('.self-check input[type=checkbox]').all()) await c.check();
}

async function doMission(n, zoneNo) {
  await page.getByRole('button', { name: /กระดานภารกิจ/ }).first().click();
  await modal().locator('.mission-item').nth(n).getByRole('button').click();
  // ขั้น 1 สถานการณ์ปัญหา
  await modal().locator('.idea').first().click();
  await modal().locator('.problem-step textarea').nth(1).fill('ใช้บล็อกคำเรียงใหม่และถามเพื่อน');
  await modal().getByRole('button', { name: 'ไปที่ใบงาน ➡️' }).click();
  // ขั้น 2 ใบงานของทุกคน
  const tabs = modal().locator('[role=tab]');
  for (let i = 0; i < (await tabs.count()); i++) {
    await tabs.nth(i).click();
    await fillSheet(i + 1);
    ok(await modal().locator('.sheet .ok-text').isVisible(), `โซน ${zoneNo} ภารกิจ ${n + 1}: ใบงานของผู้เล่น ${i + 1} ครบตามเงื่อนไข`);
  }
  if (zoneNo === 1 && n === 2) await shot('05-originality-sheet');
  await modal().getByRole('button', { name: 'ไปแลกเปลี่ยนเรียนรู้ ➡️' }).click();
  await exchange();
  // ปรับปรุงคำตอบ 1 ครั้ง (ก่อนแก้/หลังแก้)
  await modal().getByRole('button', { name: '✏️ ปรับปรุงคำตอบ' }).click();
  const first = modal().locator('.sheet textarea.answer:not([disabled])').first();
  if (await first.count()) await first.fill((await first.inputValue()) + ' (แก้แล้ว)');
  await modal().getByRole('button', { name: 'ไปแลกเปลี่ยนเรียนรู้ ➡️' }).click();
  await modal().getByRole('button', { name: 'ไปตรวจและรับรอง ➡️' }).click();
  await modal().getByRole('button', { name: /ส่งให้เพื่อน\/ครูช่วยตรวจ/ }).click();
  await enterPin();
  for (const row of await modal().locator('.rating-row').all()) await row.getByRole('button', { name: '3' }).click();
  await modal().getByRole('button', { name: '✅ รับรองผ่าน' }).click();
  ok(await modal().locator('.approved-box').isVisible(), `โซน ${zoneNo} ภารกิจ ${n + 1} ผ่านการรับรองโดยครู`);
  await closeModal();
  await page.getByRole('button', { name: /จบตา/ }).click();
}

async function doBoss(zoneNo) {
  await page.getByRole('button', { name: '⚡ สู้บอส' }).click();
  await modal().getByRole('button', { name: /เริ่มทำลายผนึก/ }).click();
  const seals = modal().locator('details.boss-task');
  for (let i = 0; i < 4; i++) {
    const seal = seals.nth(i);
    for (const row of await seal.locator('.seal-row').all()) {
      const sel = row.locator('select');
      const val = await sel.locator('option').nth(1).getAttribute('value');
      await sel.selectOption(val);
      for (const c of await row.locator('input[type=checkbox]').all()) await c.check();
      await row.locator('textarea').nth(1).fill('ผลงานนี้ผ่านเกณฑ์ เพราะมีภาคประธานและภาคแสดงครบ');
    }
    await seal.getByRole('button', { name: /ทำลายผนึก/ }).click();
  }
  await exchange();
  await modal().getByRole('button', { name: '✅ รับรองผ่าน' }).click();
  ok(await modal().locator('.won-text').isVisible(), `ผ่านด่านตรวจบอสโซน ${zoneNo} ได้คริสตัล`);
  if (zoneNo === 1) await shot('06-boss-won');
  await closeModal();
}

for (const z of [1, 2, 3]) {
  ok(await page.getByRole('button', { name: '⚡ สู้บอส' }).isDisabled(), `โซน ${z}: บอสยังล็อกก่อนทำครบ 4 ด้าน`);
  for (let i = 0; i < 4; i++) {
    await doMission(i, z);
    if (z === 1 && i === 0) {
      await page.reload();
      pinDone = false; // โหมดครูไม่ถูกจำข้ามการรีเฟรช ต้องใส่ PIN ใหม่
      ok((await page.locator('.mini-missions .st-done').count()) === 1, 'รีเฟรชหน้าแล้วความคืบหน้ายังอยู่');
    }
  }
  await page.getByRole('button', { name: /5\. ศูนย์ส่งเสริมการคิดสร้างสรรค์/ }).click();
  ok(await modal().getByText('ประตูยังล็อกอยู่').isVisible(), `โซน ${z}: ศูนย์ส่งเสริมการคิดสร้างสรรค์ยังล็อก`);
  await closeModal();
  await doBoss(z);
}
await shot('07-all-zones');

// ศูนย์ส่งเสริมการคิดสร้างสรรค์: นิทรรศการ 4 ชั้น
await page.getByRole('button', { name: /5\. ศูนย์ส่งเสริมการคิดสร้างสรรค์/ }).click();
for (let i = 0; i < 4; i++) {
  await modal().locator('.tower-progress .step').nth(i).click();
  await modal().getByRole('button', { name: /เปิดชั้น/ }).click();
  for (const card of await modal().locator('.exhibit-card').all()) {
    await card.locator('select').selectOption('0');
    await card.locator('textarea').fill('ภูมิใจผลงานนี้ เพราะคิดได้หลายแบบและแปลกใหม่');
  }
  if (i === 2) await shot('08-tower-exhibit');
  await modal().getByRole('button', { name: '✅ รับรองผ่าน' }).click();
}
await page.waitForTimeout(300);
ok(await page.getByText('หอคอยเปล่งแสง! อาณาจักรกลับมาสดใส').isVisible(), 'นิทรรศการครบ 4 ชั้น จบเกม');
await shot('09-ending');
await closeModal();

// แดชบอร์ดครู: ผลงานรายคนตามตัวบ่งชี้ และส่งออก
await page.getByRole('button', { name: /แดชบอร์ดครู/ }).click();
ok(await modal().getByText('ข้อมูลกิจกรรมฝึก ไม่ใช่คะแนนเครื่องมือวิจัยที่ผ่านการตรวจสอบ').isVisible(), 'แดชบอร์ดแยกข้อมูลเกมจากเครื่องมือวิจัย');
ok((await modal().locator('.matrix tbody tr').count()) === 2, 'ตารางตัวบ่งชี้ 1.1–4.3 รายบุคคล');
ok((await modal().locator('.matrix td').filter({ hasText: '📄' }).count()) >= 24, 'มีหลักฐานรายบุคคลครบทุกตัวบ่งชี้');
ok((await modal().locator('.work-card').count()) > 0, 'แดชบอร์ดแสดงชิ้นงานรายคน');
const [dl] = await Promise.all([page.waitForEvent('download'), modal().getByRole('button', { name: '⬇️ ส่งออก CSV' }).click()]);
ok(/\.csv$/.test(dl.suggestedFilename()), `ส่งออก CSV ได้ (${dl.suggestedFilename()})`);
const [dj] = await Promise.all([page.waitForEvent('download'), modal().getByRole('button', { name: '⬇️ ส่งออก JSON' }).click()]);
ok(/\.json$/.test(dj.suggestedFilename()), `ส่งออก JSON ได้ (${dj.suggestedFilename()})`);
await modal().locator('.matrix').scrollIntoViewIfNeeded();
await shot('10-dashboard');
await closeModal();

await page.setViewportSize({ width: 820, height: 1180 });
await shot('11-tablet');

ok(errors.length === 0, `ไม่มี error ในคอนโซล${errors.length ? `: ${errors.join('\n')}` : ''}`);
await browser.close();
console.log(`ภาพหน้าจออยู่ที่ ${shots}`);
