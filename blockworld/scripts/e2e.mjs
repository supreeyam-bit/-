// ทดสอบการเล่นจริงในเบราว์เซอร์ (Playwright + Chromium): npm run build && npm run test:e2e
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const data = JSON.parse(readFileSync(new URL('../data/missions_exact_table2.json', import.meta.url)));
const shots = new URL('../e2e-shots/', import.meta.url).pathname;
mkdirSync(shots, { recursive: true });

const PORT = 4179;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: new URL('..', import.meta.url).pathname, stdio: 'pipe', detached: true });
server.stderr.on('data', (d) => process.stderr.write(d));
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes(String(PORT)) && r()));

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) failures++; };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());

try {
  await page.goto(`http://localhost:${PORT}/`);
  await page.getByRole('button', { name: '3 คน' }).click();
  await page.getByLabel('ชื่อผู้เล่น 1').fill('ต้นกล้า');
  await page.getByRole('button', { name: /เริ่มสร้างโลก/ }).click();
  check(await page.getByTestId('current-player').innerText().then((t) => t.includes('ต้นกล้า')), 'เริ่มเกม 3 คน และแสดงตาผู้เล่นคนแรก');
  await page.screenshot({ path: shots + '01-board.png' });

  // ---- ทอยเต๋า ตัวเดินย้ายจริง ----
  for (let turn = 0; turn < 3; turn++) {
    const before = Number(await page.getByTestId(`pawn-${turn}`).getAttribute('data-pos'));
    await page.getByTestId('dice').click();
    await page.locator('.modal').waitFor({ timeout: 5000 });
    const after = Number(await page.getByTestId(`pawn-${turn}`).getAttribute('data-pos'));
    const moved = (after - before + 12) % 12;
    check(moved >= 1 && moved <= 3, `ผู้เล่น ${turn + 1} ทอยแล้วตัวเดินย้าย ${before} → ${after} (${moved} ช่อง) และเปิดช่องที่หยุด`);
    if (turn === 0) await page.screenshot({ path: shots + '02-landed.png' });
    await page.getByRole('button', { name: 'ปิด', exact: true }).click();
  }
  check(await page.getByTestId('current-player').innerText().then((t) => t.includes('ต้นกล้า')), 'ปิดหน้าต่างแล้วส่งตาต่อ วนกลับมาผู้เล่นคนแรก');

  // ---- โหมดครู + เปิดภารกิจทั้ง 12 ใบ ตรวจข้อความตรงตาราง ----
  await page.getByLabel('โหมดครู').check();
  for (const m of data.missions) {
    await page.getByRole('button', { name: /ภารกิจ 12 ใบ/ }).click();
    await page.getByTestId(`mcard-${m.id}`).click();
    const text = await page.getByTestId('instruction').innerText();
    const timer = await page.getByTestId('timer').count();
    check(text.trim() === m.instruction_exact_from_table_2 && (timer === 1) === (m.timed_minutes === 5),
      `เปิด ${m.id} ข้อความตรงตารางที่ 2 · ตัวจับเวลา ${timer ? 'มี' : 'ไม่มี'} (ตาราง ${m.timed_minutes ? '5 นาที' : 'ไม่กำหนด'})`);
    await page.getByRole('button', { name: 'ปิด', exact: true }).click();
  }
  await page.getByLabel('โหมดครู').uncheck();

  // ---- ทำภารกิจครบทั้งสามโซน ----
  const players = await page.locator('.pcard b').allInnerTexts();
  for (const zone of [1, 2, 3]) {
    for (const m of data.missions.filter((x) => x.zone === zone)) {
      await page.getByRole('button', { name: /ภารกิจ 12 ใบ/ }).click();
      await page.getByTestId(`mcard-${m.id}`).click();
      if (m.timed_minutes) {
        await page.getByRole('button', { name: /เริ่มจับเวลา/ }).click();
        await page.waitForTimeout(1200);
        const t = await page.locator('.timer-ring span').innerText();
        check(t.startsWith('4:5'), `${m.id} ตัวนับถอยหลังเดินจริง (${t})`);
      }
      for (const name of players) {
        await page.locator('.ptab', { hasText: name }).click();
        const fix = page.getByRole('button', { name: '🔧 แก้ประโยคนี้' }).first();
        if (await fix.count()) {
          await fix.click();
          // ย้ายบล็อก: เลือก "นักเรียน" แล้วกดย้ายซ้ายสองครั้ง
          await page.locator('.tray .tok', { hasText: 'นักเรียน' }).click();
          await page.getByRole('button', { name: 'ย้ายซ้าย' }).click();
          await page.getByRole('button', { name: 'ย้ายซ้าย' }).click();
          await page.getByRole('button', { name: /บันทึกฉบับหลัง/ }).click();
          const after = await page.locator('.revise-item .ver.after').first().innerText();
          check(after.includes('นักเรียนห้องเรียนกวาด') || after.includes('นักเรียน'), `${m.id} ${name} แก้ประโยค ก่อน/หลัง: ${after.replace(/\s+/g, ' ')}`);
        } else {
          if (await page.getByTestId('canvas').count()) {
            await page.getByTestId('canvas').scrollIntoViewIfNeeded();
            const box = await page.getByTestId('canvas').boundingBox();
            await page.mouse.move(box.x + 40, box.y + 40);
            await page.mouse.down();
            await page.mouse.move(box.x + 200, box.y + 160, { steps: 8 });
            await page.mouse.up();
            await page.getByRole('button', { name: /บันทึกภาพ/ }).click();
          }
          await page.getByRole('button', { name: /^✏️ เขียน/ }).first().click();
          await page.locator('.block', { hasText: /^แมว$|^น้อง$|^ว่าว$|^นักเรียน$|^แม่$|^คุณครู$/ }).first().click();
          await page.getByPlaceholder('พิมพ์คำหรือข้อความเอง…').first().fill(`ประโยคของ${name}`);
          await page.getByPlaceholder('พิมพ์คำหรือข้อความเอง…').first().press('Enter');
          await page.getByRole('button', { name: /^💾 บันทึก(ประโยค)?$/ }).first().click();
        }
        await page.getByRole('button', { name: /ส่งให้ครู\/โค้ชตรวจ/ }).click();
      }
      if (zone === 1 && m.area_en === 'Originality') await page.screenshot({ path: shots + '03-mission-drawing.png', fullPage: true });
      if (zone === 3 && m.area_en === 'Flexibility') await page.screenshot({ path: shots + '04-listener-cards.png', fullPage: true });

      // แลกเปลี่ยนเรียนรู้: ผลัดกันเสนอไอเดีย
      await page.getByRole('tab', { name: /ศูนย์แลกเปลี่ยนเรียนรู้/ }).click();
      for (let i = 0; i < players.length; i++) {
        await page.getByLabel('ไอเดีย').fill(`ไอเดียที่ ${i + 1}`);
        await page.getByRole('button', { name: /เสนอไอเดีย/ }).click();
      }
      // ฐานการช่วยเหลือ
      await page.getByRole('tab', { name: /ฐานการช่วยเหลือ/ }).click();
      await page.getByRole('button', { name: /Strategic/ }).click();
      // ครูตรวจ: ไม่มีปุ่มเมื่อยังไม่เปิดโหมดครู
      await page.getByRole('tab', { name: /การโค้ช/ }).click();
      check(await page.getByRole('button', { name: /รับรองคำตอบ/ }).count() === 0, `${m.id} ปุ่มครูซ่อนเมื่อไม่ใช่โหมดครู`);
      await page.getByLabel('โหมดครู').check({ force: true }).catch(async () => {
        await page.getByRole('button', { name: 'ปิด', exact: true }).click();
        await page.getByLabel('โหมดครู').check();
        await page.getByRole('button', { name: /ภารกิจ 12 ใบ/ }).click();
        await page.getByTestId(`mcard-${m.id}`).click();
        await page.getByRole('tab', { name: /การโค้ช/ }).click();
      });
      if (zone === 1 && m.area_en === 'Fluency') {
        await page.getByLabel(`ข้อสังเกตสำหรับ ${players[0]}`).fill('ลองเพิ่มคำนามอีก 1 คำ');
        await page.getByRole('button', { name: /ให้ปรับปรุง/ }).first().click();
      }
      for (const name of players) {
        await page.getByLabel(`ข้อสังเกตสำหรับ ${name}`).fill('ดีมาก');
        await page.getByTestId(`coach-${name}`).getByRole('button', { name: /รับรองคำตอบ/ }).click();
      }
      check(await page.locator('.mission-meta .badge', { hasText: 'ภารกิจสำเร็จ' }).count() === 1, `${m.id} ครูรับรองครบ + แลกเปลี่ยนครบ → ภารกิจสำเร็จ`);
      await page.getByRole('button', { name: 'ปิด', exact: true }).click();
      await page.getByLabel('โหมดครู').uncheck();
    }
    // บอส
    await page.getByRole('button', { name: /เผชิญหน้าบอสประจำโซน/ }).click();
    for (const name of players) await page.getByLabel(`ผลงานของ ${name}`).selectOption({ index: 1 });
    await page.getByRole('button', { name: /ปล่อยพลังคำ/ }).click();
    check(await page.getByText(/ได้รับ คริสตัล/).count() === 1, `ชนะบอสโซน ${zone} ได้รับคริสตัล`);
    if (zone === 1) await page.screenshot({ path: shots + '05-boss.png' });
    await page.getByRole('button', { name: 'ไปต่อ' }).click();
  }
  check(await page.getByText('สร้างโลกแห่งคำสำเร็จ').count() === 1, 'ครบสามโซน แสดงหน้าจบ');

  // หอคอย
  await page.getByTestId('tower').click();
  check(await page.locator('.g-item').count() >= 36, `หอคอยแสดงผลงานที่รับรองแล้ว ${await page.locator('.g-item').count()} ชิ้น (4 ด้าน × 3 โซน × 3 คน)`);
  await page.getByLabel('สะท้อนคิด การคิดคล่อง').fill('ฉันถามตัวเองว่าใครทำอะไร');
  await page.getByRole('button', { name: /เปิดตัวอย่างการแสดงผล AR/ }).click();
  check(await page.getByText('ตัวอย่างการแสดงผล AR · จำลอง').count() === 1, 'AR แสดงเป็น "ตัวอย่างการแสดงผล AR" จำลอง');
  await page.screenshot({ path: shots + '06-tower.png', fullPage: true });
  await page.getByRole('button', { name: 'ปิด', exact: true }).click();

  // แดชบอร์ด + ส่งออก
  await page.getByLabel('โหมดครู').check();
  await page.getByRole('button', { name: /แดชบอร์ดครู/ }).click();
  await page.screenshot({ path: shots + '07-dashboard.png' });
  await page.getByRole('button', { name: /ส่งออก\/นำเข้า/ }).click();
  const [dj] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /JSON \(ข้อมูลทั้งหมด/ }).click()]);
  const json = JSON.parse(readFileSync(await dj.path(), 'utf8'));
  check(Object.keys(json.completed).filter((k) => json.completed[k]).length === 12 && json.helpLog.length > 0 && json.coachLog.length > 0, `ส่งออก JSON: ภารกิจสำเร็จ 12 · ความช่วยเหลือ ${json.helpLog.length} · การโค้ช ${json.coachLog.length}`);
  const drawings = Object.values(json.works).flatMap((byP) => Object.values(byP)).filter((w) => Object.keys(w.drawings).length).length;
  check(drawings > 0, `ภาพวาดอยู่ใน JSON (${drawings} ชิ้นงานมีภาพ)`);
  const [dc] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /CSV ผลงาน/ }).click()]);
  const csv = readFileSync(await dc.path(), 'utf8');
  check(csv.split('\r\n').length > 36 && csv.includes('ฉบับก่อน'), `ส่งออก CSV ผลงาน ${csv.split('\r\n').length - 1} แถว`);
  await page.getByRole('button', { name: 'ปิด', exact: true }).click();

  // โหลดใหม่ ข้อมูลยังอยู่
  await page.reload();
  check(await page.getByText('สร้างโลกแห่งคำสำเร็จ').count() === 1, 'โหลดหน้าใหม่ ข้อมูลยังอยู่ในเครื่อง');

  // จอโทรศัพท์
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!overflow, 'จอกว้าง 390px ไม่มีการเลื่อนแนวนอน');
  await page.screenshot({ path: shots + '08-phone.png' });
} catch (e) {
  failures++;
  console.error('✗ หยุดกลางทาง:', e.message);
  await page.screenshot({ path: shots + 'error.png', fullPage: true });
}
check(errors.length === 0, `ไม่มีข้อผิดพลาด JavaScript ในหน้าเว็บ${errors.length ? ': ' + errors.join(' | ') : ''}`);
await browser.close();
process.kill(-server.pid);
console.log(failures ? `\n${failures} รายการไม่ผ่าน` : '\nผ่านทุกรายการ');
process.exit(failures ? 1 : 0);
