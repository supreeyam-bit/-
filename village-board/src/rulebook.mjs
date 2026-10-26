// คู่มือการเล่น คู่มือครู และแบบบันทึกตัวบ่งชี้ (A4)
import { doc, esc } from './lib.mjs';
import { TITLE, SUBTITLE, STAGES, MISSIONS, AREAS, AREA_ORDER, INDICATORS, RUBRIC, SPACE_KINDS, PROBLEM_PANEL, CHECK4, EXTRAS, TILES, BLANK_TILES } from './data.mjs';
import { COUNTS } from './cards.mjs';

const css = `
@page{size:210mm 297mm;margin:0}
.page{width:210mm;height:297mm;padding:14mm 16mm 16mm;display:flex;flex-direction:column;gap:4mm;font-size:10pt;line-height:1.55}
h1{font-size:24pt;line-height:1.15}
h2{font-size:15pt;color:var(--market);margin-top:1mm}
h3{font-size:11.5pt}
ul,ol{margin:0;padding-left:5.5mm}
li{margin:.4mm 0}
.eyebrow{font:500 9pt var(--display);color:var(--muted)}
.cover{justify-content:flex-start;gap:6mm}
.cover h1{font-size:40pt;font-weight:600}
.strip{display:flex;gap:2mm}.strip span{flex:1;height:5mm;border-radius:1mm;background:var(--s)}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}
.facts div{border:.4mm solid var(--line);border-radius:3mm;padding:2.4mm 3mm}
.facts b{display:block;font:500 13pt var(--display)}
.facts span{font-size:8.5pt;color:var(--muted)}
table{width:100%;border-collapse:collapse;font-size:9pt;line-height:1.4}
th,td{border:.3mm solid var(--line);padding:1.4mm 2mm;text-align:left;vertical-align:top}
th{background:var(--sunk);font:500 9pt var(--display)}
td.c{text-align:center}
.two{display:grid;grid-template-columns:1fr 1fr;gap:5mm}
.note{background:var(--sunk);border-radius:3mm;padding:2.4mm 3.4mm;font-size:9.2pt}
.step{display:grid;grid-template-columns:9mm 1fr;gap:2.4mm;align-items:start}
.step .n{width:8mm;height:8mm;border-radius:50%;background:var(--ink);color:#fff;font:500 10pt/8mm var(--display);text-align:center}
.step b{font-family:var(--display);font-weight:500}
.sp{display:inline-flex;align-items:center;justify-content:center;min-width:8mm;height:8mm;border-radius:2mm;font-size:5mm;border:.4mm solid var(--line)}
.rec td{height:9mm}
.rec th.v{writing-mode:vertical-rl;transform:rotate(180deg);height:22mm;font-size:8pt;padding:1mm .6mm;text-align:left}
.pill{display:inline-block;border-radius:9mm;padding:0 2.4mm;font:500 8pt/1.6 var(--display);color:#fff;background:var(--a)}
`;
const page = (body, cls = '') => `<div class="page ${cls}">${body}</div>`;
const mOf = (sid, a) => MISSIONS.find((m) => m.stage === sid && m.area === a);
const nTiles = Object.values(TILES).reduce((s, x) => s + x.length + BLANK_TILES, 0);

function cover() {
  return page(`<p class="eyebrow">${esc(SUBTITLE)}</p><h1>${TITLE}</h1>
<div class="strip">${STAGES.map((s) => `<span class="s-${s.id}"></span>`).join('')}</div>
<p style="font-size:12pt">ออกเดินทางผ่านโรงเรียน ตลาด และทุ่งนาของบ้านดอนข้าวหอม ช่วยกันแก้ปัญหาของคนในหมู่บ้านด้วยประโยค และฝึกคิดให้มาก คิดให้หลาก คิดให้แปลก คิดให้ละเอียด</p>
<div class="facts"><div><b>2–4 คนหรือทีม</b><span>ทีมละ 2–3 คนได้</span></div><div><b>ป.3</b><span>ภาษาไทย ท 4.1 ป.3/4</span></div><div><b>3 คาบ</b><span>คาบละ 50 นาที · 1 ด่านต่อคาบ</span></div><div><b>ร่วมมือ</b><span>ทุกคนช่วยกันกู้หมู่บ้าน</span></div></div>
<h2>ในชุดมีอะไรบ้าง</h2>
<table><tr><th>ชิ้นส่วน</th><th>จำนวน</th><th>ไฟล์</th></tr>
<tr><td>กระดานหลัก (A3 สองแผ่นต่อกัน)</td><td>1</td><td>01</td></tr>
<tr><td>แผ่นผู้เล่น (แท่นเรียงประโยค + ดาว) · ผังจัดความคิด · กระดานแลกเปลี่ยน · แผนผังความรู้</td><td>4 · 1 · 1 · 1</td><td>02</td></tr>
<tr><td>บล็อกคำ 5 สี (รวมบล็อกเปล่าสำหรับเขียนเอง)</td><td>${nTiles}</td><td>03</td></tr>
<tr><td>การ์ดฐานเรียนรู้ · การ์ดสถานการณ์ปัญหา · การ์ดครูฮูก</td><td>${COUNTS.learn} · ${COUNTS.event} · ${COUNTS.coach}</td><td>04</td></tr>
<tr><td>การ์ดใหญ่: เปิดด่าน · ภารกิจสร้างสรรค์ · ฐานช่วยเหลือ</td><td>3 · 12 · ${COUNTS.help}</td><td>05</td></tr>
<tr><td>โทเคนช่วยเหลือ · เมล็ดข้าว · โหวตแปลกใหม่ · หมุด · ตัวบอกภารกิจ · ตัวเดิน · เหรียญ</td><td>30 · 30 · 10 · 18 · 12 · 4 · 3</td><td>06</td></tr></table>
<p><b>จัดหาเพิ่ม:</b> ${EXTRAS.map(esc).join(' · ')}</p>`, 'cover');
}

function rules1() {
  return page(`<h1>วิธีเล่น</h1>
<h2>เป้าหมาย</h2><p>ทุกคนช่วยกันผ่าน 3 ด่าน ด่านละ 1 คาบ แต่ละด่านต้อง <b>เล่นภารกิจสร้างสรรค์ครบ 4 ด้าน</b> จึงผ่านประตูด่านได้ และพยายาม <b>แก้สถานการณ์ปัญหาให้ได้ 4 ช่อง</b> บนแผงของด่าน เพื่อรับเหรียญหมู่บ้าน เมื่อจบเกม ได้ 3 เหรียญ = กู้หมู่บ้านสำเร็จ ส่วนดาวที่ระบายบนแผ่นผู้เล่นใช้ดูความก้าวหน้าการคิดสร้างสรรค์ของแต่ละคน</p>
<h2>เตรียมเกม</h2>
<ol><li>ต่อกระดานหลัก วางตัวเดินทุกตัวที่ช่อง 🏁 เริ่ม</li>
<li>แยกการ์ดฐานเรียนรู้และการ์ดสถานการณ์ตามด่าน สับแล้ววางคว่ำในช่องบนแผงของด่าน</li>
<li>เรียงการ์ดภารกิจสร้างสรรค์ของด่านตามลำดับ คล่อง → ยืดหยุ่น → ริเริ่ม → ละเอียดลออ วางคว่ำ</li>
<li>แจกแผ่นผู้เล่นคนละ 1 แผ่น บล็อกคำคนละ 6 ชิ้น (ใคร 2 ทำอะไร 2 กับอะไร 1 ส่วนขยาย 1) โทเคนช่วยเหลือคนละ 1 และโทเคนโหวตแปลกใหม่คนละ 2 บล็อกที่เหลือเป็นกองกลาง</li>
<li>ครูหรือผู้เล่นอ่านการ์ดเปิดด่านที่ 1 ออกเสียง แล้วช่วยกันตอบคำถามชวนคิดด้านหลังการ์ด</li></ol>
<h2>ในเทิร์นของเธอ</h2>
<div class="step"><span class="n">1</span><div><b>ทอยเต๋าและเดิน</b> เดินตามทาง ถ้าผ่านประตูด่าน 🚪 ที่ยังไม่เปิด ต้องหยุดที่ประตู</div></div>
<div class="step"><span class="n">2</span><div><b>ทำตามช่อง</b> ที่หยุด (ดูตารางหน้าถัดไป)</div></div>
<div class="step"><span class="n">3</span><div><b>ตรวจกัน</b> ทุกประโยคที่แต่ง คนทางซ้ายตรวจด้วยเกณฑ์ 4 ข้อบนแผ่นผู้เล่น: ${CHECK4.map(esc).join(' · ')} ถ้าไม่ผ่าน คนตรวจหยิบการ์ดครูฮูกถามแทนการบอกคำตอบ แล้วให้ลองใหม่ 1 ครั้ง</div></div>
<div class="step"><span class="n">4</span><div><b>ติดอยู่หรือ?</b> จ่ายโทเคนช่วยเหลือ 1 อัน เลือกอ่านการ์ดฐานช่วยเหลือของด่าน 1 แบบ (ความคิดรวบยอด · การคิด · กระบวนการ · กลยุทธ์) หรือแลกเมล็ดข้าว 2 เมล็ดเป็นโทเคน 1 อันก่อน</div></div>
<div class="note">ผู้เล่นที่รออยู่ที่ประตูด่าน ใช้เทิร์นจั่วการ์ดฐานเรียนรู้หรือการ์ดสถานการณ์แทนการเดิน เมื่อภารกิจครบ 4 ด้าน ประตูเปิดและทุกคนเดินต่อได้ในเทิร์นถัดไป</div>`);
}

function rules2() {
  const desc = {
    learn: 'คนทางซ้ายจั่วการ์ดฐานเรียนรู้ของด่านแล้วอ่านให้ฟัง เฉลยกลับหัวอยู่ด้านล่างการ์ด ตอบถูกรับ 🌾 1 เมล็ด ตอบผิดได้ฟังคำใบ้ของครูฮูกแล้วตอบใหม่ 1 ครั้ง',
    star: 'เปิดการ์ดภารกิจใบถัดไปของด่าน ทุกคนเล่นพร้อมกัน (ดูหน้าถัดไป) ถ้าภารกิจของด่านเล่นครบแล้ว ให้จั่วการ์ดฐานเรียนรู้แทน',
    problem: 'จั่วการ์ดสถานการณ์ของด่าน เรียงบล็อกคำบนแท่นเพื่อแต่งประโยคแก้ปัญหา ยืมบล็อกจากเพื่อนหรือกองกลางได้ 1 ชิ้น ผ่านเกณฑ์ 4 ข้อ วางหมุด 1 ช่องบนแผงของด่าน',
    trade: 'ยืมหรือแลกบล็อกคำกับเพื่อนคนใดก็ได้ 2 ชิ้น (ต้องคืนบล็อกอื่นให้เท่ากัน) แล้วแต่งประโยคใหม่จากบล็อกที่ได้ 1 ประโยค',
    help: 'รับ 🛟 โทเคนช่วยเหลือ 1 อัน',
    owl: 'จั่วการ์ดครูฮูก ตอบคำถามชวนคิดให้เพื่อนฟัง รับ 🛟 1 อัน',
    gate: 'ต้องหยุด ผ่านได้เมื่อเล่นภารกิจของด่านครบ 4 ด้าน ถ้าครบแล้วและแผงปัญหาได้ 4 ช่อง รับเหรียญหมู่บ้าน',
    finish: 'เมื่อทุกคนมาถึง ช่วยกันเล่าเรื่องการผจญภัยทั้ง 3 ด่านด้วยประโยคของตัวเองคนละ 2–3 ประโยค แล้วนับดาวและเหรียญ',
  };
  return page(`<h1>ช่องบนกระดาน</h1>
<table><tr><th style="width:12mm"></th><th style="width:34mm">ช่อง</th><th>ทำอะไร</th></tr>
${Object.entries(desc).map(([k, d]) => `<tr><td class="c"><span class="sp ${SPACE_KINDS[k].icon.length < 3 && /[★⇄]/.test(SPACE_KINDS[k].icon) ? '' : 'emoji'}">${SPACE_KINDS[k].icon}</span></td><td><b>${SPACE_KINDS[k].name}</b></td><td>${esc(d)}</td></tr>`).join('')}</table>
<h2>แผงสถานการณ์ปัญหาของแต่ละด่าน</h2>
<table><tr><th>ด่าน</th><th>แผง</th><th>เป้าหมาย</th></tr>${STAGES.map((s) => `<tr><td>${s.no} ${s.place}</td><td>${PROBLEM_PANEL[s.id].name}</td><td>แก้ได้ 4 ใน 6 ช่อง รับเหรียญ “${s.badge}”</td></tr>`).join('')}</table>
<h2>บล็อกคำ (เครื่องมือทางปัญญา)</h2>
<p>บล็อกแต่ละสีบอกหน้าที่ของคำ: <span class="blk r-S">ใคร</span> <span class="blk r-V">ทำอะไร</span> <span class="blk r-O">กับใครหรืออะไร</span> <span class="blk r-M">ส่วนขยาย</span> <span class="blk r-P">คำเสริม</span> วางบล็อกบนแท่นเรียงประโยคเพื่อทดลองสลับตำแหน่ง ดูว่าความหมายเปลี่ยนไหม และตรวจว่าครบ ใคร ทำอะไร หรือยัง ถ้าไม่มีคำที่ต้องการ ใช้บล็อกเปล่าเขียนเองด้วยปากกาไวท์บอร์ด</p>
<div class="note">ผู้เล่นที่ทำโทเคนหมด ยังเล่นได้ตามปกติ ครูฮูกคือเพื่อนทุกคนในวง: ใครเห็นเพื่อนติดอยู่ หยิบการ์ดครูฮูกมาถามได้เลย</div>`);
}

function rules3() {
  return page(`<h1>ภารกิจสร้างสรรค์ ★</h1>
<p>ภารกิจของแต่ละด่านเล่นตามลำดับ <span class="pill a-F">คิดให้มาก</span> → <span class="pill a-X">คิดให้หลาก</span> → <span class="pill a-O">คิดให้แปลก</span> → <span class="pill a-E">คิดให้ละเอียด</span> เพื่อให้ผู้เรียนเห็นกระบวนการคิดสร้างสรรค์ทีละขั้น</p>
<div class="step"><span class="n">1</span><div><b>เปิดการ์ด</b> อ่านภารกิจออกเสียง ดูภาพในการ์ด (ส่อง AR ที่มาร์กเกอร์มุมการ์ดได้ถ้ามีแอป)</div></div>
<div class="step"><span class="n">2</span><div><b>จับเวลา</b> ตามที่การ์ดกำหนด ทุกคนทำพร้อมกันบนไวท์บอร์ดหรือกระดาษ ใช้บล็อกคำ ผังจัดความคิด และการ์ดฐานช่วยเหลือได้</div></div>
<div class="step"><span class="n">3</span><div><b>วงแลกเปลี่ยน</b> อ่านคำตอบให้กันฟังทีละคน เพื่อนตอบกลับด้วยประโยคชวนคิด เช่น “ฉันชอบตรงที่…” “ลองเพิ่ม… ดูไหม”</div></div>
<div class="step"><span class="n">4</span><div><b>ให้ดาว</b> พลิกการ์ดดูเกณฑ์ด้านหลัง ช่วยกันตัดสิน 0–3 ดาว หรือครูเป็นผู้ตัดสิน ระบายดาวในช่องของภารกิจบนแผ่นผู้เล่น</div></div>
<div class="step"><span class="n">5</span><div><b>บันทึก</b> วางตัวบอกภารกิจบนแผงของด่าน ติดคำตอบที่ชอบบนกระดานแลกเปลี่ยน</div></div>
<h2>เกณฑ์ให้ดาวของแต่ละด้าน</h2>
<table><tr><th>ด้าน</th>${[0, 1, 2, 3].map((n) => `<th>${n} ดาว</th>`).join('')}</tr>
${AREA_ORDER.map((a) => `<tr><td><span class="pill a-${a}">${AREAS[a].name}</span></td>${RUBRIC[a].map((t) => `<td>${esc(t)}</td>`).join('')}</tr>`).join('')}</table>
<div class="note"><b>การคิดริเริ่ม:</b> ใช้โทเคนโหวต “แปลกใหม่” คนละ 2 อัน ให้คำตอบของเพื่อน (ห้ามโหวตตัวเอง) คำตอบที่ครบถ้วนแต่ได้ 0 โหวต = 1 ดาว · 1–2 โหวต = 2 ดาว · 3 โหวตขึ้นไป = 3 ดาว ครูปรับได้ถ้าคำตอบไม่สอดคล้องกับสถานการณ์</div>`);
}

function teacher1() {
  return page(`<p class="eyebrow">คู่มือครู</p><h1>องค์ประกอบ 7 ด้านในบอร์ดเกม</h1>
<p>บอร์ดเกมออกแบบเป็นสิ่งแวดล้อมการเรียนรู้ตามแนวคอนสตรัคติวิสต์ ตารางนี้โยงแต่ละองค์ประกอบกับข้อคำถามในแบบประเมินคุณภาพด้านการออกแบบ (ข้อ 1–28) และชิ้นส่วนในชุด</p>
<table><tr><th style="width:38mm">องค์ประกอบ</th><th style="width:18mm">ข้อประเมิน</th><th>ชิ้นส่วนและกลไกในบอร์ดเกม</th></tr>
${BOARD_COMPONENTS.map(([a, b, c], i) => `<tr><td><b>${i + 1}) ${a}</b></td><td>${b}</td><td>${c}</td></tr>`).join('')}</table>
<h2>บทบาทของครูระหว่างเล่น</h2>
<ul><li>เดินดูแต่ละวง ใช้คำถามแบบการ์ดครูฮูก กระตุ้นให้คิดต่อแทนการบอกคำตอบ</li>
<li>ให้คำแนะนำเมื่อทั้งวงตัดสินดาวไม่ได้ และเป็นผู้ตัดสินดาวการคิดริเริ่มเมื่อจำเป็น</li>
<li>ให้คำปรึกษาเป็นรายคนกับผู้เรียนที่ใช้โทเคนช่วยเหลือบ่อย และสรุปความคิดรวบยอดท้ายคาบ</li></ul>`);
}
const BOARD_COMPONENTS = [
  ['สถานการณ์ปัญหา', 'ข้อ 1–6', 'การ์ดเปิดด่าน 3 ใบ (เรื่องจริงในหมู่บ้าน บทบาท คำถามชวนคิด เป้าหมาย) การ์ดสถานการณ์ปัญหา 18 ใบ และแผงปัญหาบนกระดานที่ผู้เรียนรับผิดชอบร่วมกัน ภารกิจ 4 ระดับในแต่ละด่าน'],
  ['ศูนย์การเรียนรู้', 'ข้อ 7–11', `ช่องฐานเรียนรู้และการ์ดฐานเรียนรู้ ${COUNTS.learn} ใบ (15 ฐาน) แผนผังความรู้ ภาพสถานการณ์บนการ์ดพร้อมมาร์กเกอร์ AR สีและตัวหนาเน้นคำสำคัญ`],
  ['เครื่องมือทางปัญญา', 'ข้อ 12–14', 'บล็อกคำ 5 สี แท่นเรียงประโยคบนแผ่นผู้เล่น (เรียงคำ ทดลองสลับ และตรวจด้วยเกณฑ์ 4 ข้อ) และผังจัดความคิด'],
  ['ศูนย์แลกเปลี่ยนเรียนรู้', 'ข้อ 15–18', 'เกมแบบร่วมมือ ทุกคนเล่นภารกิจพร้อมกัน วงแลกเปลี่ยนหลังภารกิจ ช่องตลาดแลกคำ (ยืมบล็อกจากเพื่อน) กระดานแลกเปลี่ยนพร้อมประโยคชวนคิด'],
  ['ศูนย์ส่งเสริมการคิดสร้างสรรค์', 'ข้อ 19–20', 'การ์ดภารกิจสร้างสรรค์ 12 ใบ (4 ด้าน × 3 ด่าน) เล่นตามลำดับ คิดให้มาก → หลาก → แปลก → ละเอียด เคล็ดคิดและเกณฑ์อยู่ด้านหลังการ์ด'],
  ['ฐานการช่วยเหลือ', 'ข้อ 21–25', `ช่องฐานช่วยเหลือ โทเคนช่วยเหลือ และการ์ดฐานช่วยเหลือ ${COUNTS.help} ใบ แบ่ง 4 แบบ: ความคิดรวบยอด การคิด กระบวนการ กลยุทธ์`],
  ['การโค้ช', 'ข้อ 26–28', `การ์ดครูฮูก ${COUNTS.coach} ใบ (คำถามชวนคิด ไม่บอกคำตอบ) เพื่อนใช้ถามกันเมื่อประโยคไม่ผ่านเกณฑ์ และบทบาทครูผู้ให้คำแนะนำและคำปรึกษา`],
];

function teacher2() {
  return page(`<p class="eyebrow">คู่มือครู</p><h1>กรอบการคิดสร้างสรรค์</h1>
<p>ใช้องค์ประกอบการคิดสร้างสรรค์ 4 ด้านตามแนวคิดของ Guilford (1967) ที่ จารุณี ซามาตย์ (2552) สรุปไว้ เป็นแนวทางกำหนดภารกิจ</p>
<table><tr><th>ด้าน</th><th>นิยาม</th><th>องค์ประกอบย่อย</th></tr>
${AREA_ORDER.map((a) => `<tr><td><span class="pill a-${a}">${AREAS[a].name}</span><br><small>${AREAS[a].en}</small></td><td>${esc(AREAS[a].def)}</td><td>${AREAS[a].sub.map(esc).join('<br>')}</td></tr>`).join('')}</table>
<h2>ภารกิจ 3 ด่าน × 4 ด้าน และตัวบ่งชี้</h2>
<table><tr><th>ด้าน</th>${STAGES.map((s) => `<th>ด่าน ${s.no} ${s.place}<br>${s.topic}</th>`).join('')}</tr>
${AREA_ORDER.map((a) => `<tr><td><span class="pill a-${a}">${AREAS[a].short}</span></td>${STAGES.map((s) => { const m = mOf(s.id, a); return `<td><b>${m.ind} ${esc(m.title)}</b><br><small>${esc(INDICATORS[m.ind])}</small></td>`; }).join('')}</tr>`).join('')}</table>`);
}

function record() {
  const ms = Object.keys(INDICATORS).map((i) => MISSIONS.find((m) => m.ind === i));
  return page(`<p class="eyebrow">คู่มือครู</p><h1>แบบบันทึกการคิดสร้างสรรค์ตามตัวบ่งชี้</h1>
<p>บันทึกดาว 0–3 ของแต่ละภารกิจ คะแนนเต็มด้านละ 9 รวม 36 · ห้อง ............ กลุ่ม ............ วันที่ ............</p>
<table class="rec"><tr><th>ชื่อ</th>${ms.map((m) => `<th class="v">${m.ind} ${esc(m.title)}</th>`).join('')}${AREA_ORDER.map((a) => `<th class="v">รวม${AREAS[a].short}</th>`).join('')}<th class="v">รวม</th></tr>
${Array.from({ length: 10 }, () => `<tr><td style="width:36mm"></td>${'<td></td>'.repeat(ms.length + 5)}</tr>`).join('')}</table>
<h2>สรุปของกลุ่ม</h2>
<table><tr><th>ด่าน</th><th>ภารกิจครบ 4 ด้าน</th><th>แผงปัญหา (ช่อง)</th><th>เหรียญหมู่บ้าน</th><th>หมายเหตุ</th></tr>${STAGES.map((s) => `<tr><td>${s.no} ${s.place}</td><td>☐</td><td>___ / 6</td><td>☐</td><td></td></tr>`).join('')}</table>
<p class="note">ข้อความนิยามเชิงปฏิบัติการและพฤติกรรมตัวบ่งชี้เป็นข้อความประยุกต์ ควรตรวจสอบความตรงเชิงเนื้อหาโดยผู้เชี่ยวชาญก่อนใช้จริง</p>`);
}

export function rulebookHtml() {
  return doc('คู่มือ', css, cover() + rules1() + rules2() + rules3() + teacher1() + teacher2() + record());
}
