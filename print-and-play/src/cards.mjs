// การ์ดเกม: ขนาดมาตรฐาน 63 × 88 มม. (9 ใบ/หน้า) และการ์ดใหญ่ 95 × 132 มม. (4 ใบ/หน้า)
// หน้าหน้า–หน้าหลังสลับกัน กลับคอลัมน์ไว้แล้วสำหรับพิมพ์สองหน้าแบบพลิกขอบยาว
import { doc, esc, arMarker, chunk } from './lib.mjs';
import {
  TITLE, TYPES, RESOURCES, GLASS_PER_TYPE, MISSIONS, MISSION_REWARD, CHAOS, TEMPLATES, HINT_LEVELS,
  CREATIVE, STAGES, ELAB_BROKEN, WONDERS, ROLES_JIGSAW, COACH, STORY_CUBES, TIME_CARDS, EXTRA_CARDS, TENSES,
} from './data.mjs';
import { SCAFFOLDS, CREATIVE_PROCESS, PROCESS_RULE } from './design.mjs';

const css = `
@page{size:210mm 297mm;margin:0}
.page{width:210mm;height:297mm;display:flex;align-items:center;justify-content:center}
.sheet{display:grid;gap:0}
.std{grid-template-columns:repeat(3,63mm);grid-auto-rows:88mm}
.lg{grid-template-columns:repeat(2,95mm);grid-auto-rows:132mm}
.c{position:relative;overflow:hidden;border:.25mm solid #b9b0a0;background:#fff;display:flex;flex-direction:column}
.c.blank{background:#fff;border-color:#eee}
.in{margin:2.6mm;flex:1;border-radius:3mm;display:flex;flex-direction:column;overflow:hidden;position:relative}
.band{padding:1.6mm 3mm;color:#fff;font:500 8pt/1.25 var(--font-display);display:flex;justify-content:space-between;align-items:center;gap:2mm}
.bd{padding:2.4mm 3mm;display:flex;flex-direction:column;gap:1.6mm;flex:1}
h2{margin:0;font:500 14pt/1.15 var(--font-display)}
h3{margin:0;font:500 10.5pt/1.2 var(--font-display)}
p{margin:0;font-size:8.2pt;line-height:1.38}
.big{font-size:19mm;line-height:1;text-align:center;margin:1mm 0}
.sign{border:.6mm solid var(--chaos);border-radius:2mm;background:#f4eef8;color:var(--chaos);font:500 11.5pt/1.3 var(--font-display);text-align:center;padding:2mm}
.steps{margin:0;padding-left:4mm;font-size:7.6pt;line-height:1.35}
.foot{margin-top:auto;font-size:7.2pt;line-height:1.3;border-top:.3mm dashed var(--line);padding-top:1.4mm;display:flex;justify-content:space-between;gap:2mm;align-items:flex-end}
.ar{flex:none}
.pill{display:inline-block;border-radius:9mm;padding:.2mm 2.2mm;font-size:7pt;background:var(--paper);color:var(--ink)}
.back{align-items:center;justify-content:center;text-align:center;gap:2mm;color:#fff}
.back .t{font:500 13pt/1.2 var(--font-display)}
.back .s{font-size:8pt;opacity:.95}
.back .ttl{font:500 7.5pt var(--font-display);opacity:.85;position:absolute;bottom:3mm;left:0;right:0}
.lgc h2{font-size:16pt}.lgc p{font-size:9.6pt;line-height:1.45}
.lgc .big{font-size:28mm}
.task{font-size:10.2pt!important;line-height:1.5!important}
.crit{background:var(--paper);border-radius:2mm;padding:1.6mm 2.4mm;font-size:8pt;line-height:1.35}
.ladder{display:flex;flex-direction:column;gap:2mm}
.ladder div{border-left:0;background:var(--hint-sky);border-radius:2mm;padding:2mm 3mm;font-size:10pt;line-height:1.4}
.ladder b{font-family:var(--font-display);font-weight:500;color:var(--type-command)}
.lamp{letter-spacing:1mm}
`;

const pageOf = (cls, cards, perRow, perPage, note) => {
  const fill = [...cards, ...Array(perPage - cards.length).fill('<div class="c blank"></div>')];
  return `<div class="page"><div class="sheet ${cls}">${fill.join('')}</div><div class="pnote">${note}</div></div>`;
};
// สร้างหน้าหน้า + หน้าหลัง (กลับลำดับในแต่ละแถว)
function sheets(items, front, back, cls, perRow, perPage, label) {
  return chunk(items, perPage).map((grp, i, all) => {
    const f = grp.map(front);
    const bk = grp.map(back);
    while (bk.length < perPage) bk.push('<div class="c blank"></div>');
    const mirrored = chunk(bk, perRow).flatMap((row) => row.reverse());
    return pageOf(cls, f, perRow, perPage, `${label} ${i + 1}/${all.length} · ด้านหน้า`) +
      pageOf(cls, mirrored, perRow, perPage, `${label} ${i + 1}/${all.length} · ด้านหลัง (พิมพ์สองหน้า พลิกขอบยาว)`);
  }).join('');
}
const card = (inner, extra = '') => `<div class="c ${extra}"><div class="in" style="${inner.style || ''}">${inner.html}</div></div>`;
const T = (id) => TYPES.find((t) => t.id === id);
const ROLE_COLOR = { subject: 'var(--role-subject)', verb: 'var(--role-verb)', object: 'var(--role-object)' };

// ---------- ทรัพยากร ----------
const resItems = [
  ...RESOURCES.flatMap((r) => Array.from({ length: r.count }, (_, k) => ({ kind: 'res', r, k }))),
  ...TYPES.flatMap((t) => Array.from({ length: GLASS_PER_TYPE }, (_, k) => ({ kind: 'glass', t, k }))),
];
function resFront(it) {
  if (it.kind === 'res') {
    const r = it.r;
    return card({ style: 'background:#fff;border:.4mm solid var(--line)', html: `<div class="band" style="background:${ROLE_COLOR[r.role]};${r.role === 'verb' ? 'color:var(--ink)' : ''}"><span>ทรัพยากร</span><span>สอน: ${r.teaches}</span></div>
<div class="bd"><div class="big emoji">${r.icon}</div><h2 style="text-align:center">${r.name}</h2><p style="text-align:center">${esc(r.chunk)}</p>
<div class="foot"><span>ใช้สร้างทุกระดับ<br>สแกนเพื่อดูภาพ 3 มิติ</span>${arMarker(r.id, '13mm')}</div></div>` });
  }
  const t = it.t;
  return card({ style: 'background:#fff;border:.4mm solid var(--line)', html: `<div class="band" style="background:${t.color}"><span>ทรัพยากร · แก้วสี</span><span>${t.sym}</span></div>
<div class="bd"><div class="big" style="display:flex;justify-content:center"><span style="width:20mm;height:20mm;border-radius:50%;background:${t.color};color:#fff;font:600 13mm/20mm var(--font-display);text-align:center">${t.sym}</span></div>
<h2 style="text-align:center">${t.glass}</h2><p style="text-align:center">สร้างได้ใน <b>${t.district}</b><br>${esc(TEMPLATES[t.id][0])}</p>
<div class="foot"><span>คำสังเกต: ${esc(t.cue)}</span>${arMarker('glass' + t.id, '13mm')}</div></div>` });
}
const resBack = () => card({ style: 'background:var(--ink)', html: `<div class="bd back"><div class="big emoji" style="font-size:11mm;white-space:nowrap">🪵🧱🪨🔮</div><div class="t">ทรัพยากร</div><div class="s">ไม้ · อิฐ · หิน · แก้วสี</div><div class="ttl">${TITLE}</div></div>` });

// ---------- ภารกิจซ่อมป้าย ----------
const stars = (n) => '★'.repeat(n);
const missionFront = (m) => card({ style: 'background:#fff;border:.4mm solid var(--line)', html: `<div class="band" style="background:var(--ink)"><span>ภารกิจซ่อมป้าย</span><span>${stars(m.level)}</span></div>
<div class="bd"><h3>📜 ${esc(m.place)}</h3><div class="sign">${esc(m.broken)}</div><p><b>${esc(m.task)}</b></p>
<ol class="steps"><li>ต่อบล็อกบนแท่นวางประโยค (หรือพูด/เขียน)</li><li>ปักธงประเภทประโยค อ่านออกเสียง</li><li>ผู้ตรวจป้ายถาม: ใคร? ทำอะไร? กับอะไร?</li></ol>
<div class="foot"><span>รางวัล: ${esc(MISSION_REWARD[m.level])}</span><span class="pill">#${m.id}</span></div></div>` });
const missionBack = (m) => card({ style: 'background:#3a3145', html: `<div class="bd back"><div class="big emoji">📜</div><div class="t">ภารกิจซ่อมป้าย</div><div style="font:600 16pt var(--font-display);color:var(--spark-gold)">${stars(m.level)}</div><div class="s">${['', 'เรียงลำดับใหม่', 'เติมส่วนที่ขาด · ธงผิด', 'แปลงประเภท · ขยาย · สุภาพ'][m.level]}</div><div class="ttl">${TITLE}</div></div>` });

// ---------- ภัยยุ่งเหยิง ----------
const meterTxt = (n) => (n > 0 ? `มาตรวัด +${n}` : n < 0 ? `มาตรวัด −${-n}` : 'มาตรวัดไม่เปลี่ยน');
const chaosFront = (c) => card({ style: 'background:var(--chaos);color:#fff', html: `<div class="band" style="background:rgba(0,0,0,.25)"><span>ภัยยุ่งเหยิง</span><span>#${c.id}</span></div>
<div class="bd"><div class="big emoji">🌀</div><h2 style="text-align:center">${esc(c.title)}</h2><p style="font-size:8.8pt;text-align:center">${esc(c.text)}</p>
<div class="foot" style="border-color:rgba(255,255,255,.4)"><span>เปิดแล้ววางทิ้ง</span><span class="pill">${meterTxt(c.meter)}</span></div></div>` });
const chaosBack = () => card({ style: 'background:var(--chaos)', html: `<div class="bd back"><div class="big emoji">👾</div><div class="t">ภัยยุ่งเหยิง</div><div class="s">สัตว์ประหลาดความสับสน</div><div class="ttl">${TITLE}</div></div>` });

// ---------- คำใบ้ ----------
const hintItems = TYPES.flatMap((t) => [0, 1, 2].map((lv) => ({ t, lv })));
const hintFront = ({ t, lv }) => card({ style: 'background:var(--hint-sky)', html: `<div class="band" style="background:${t.color}"><span>${t.sym} ประโยค${t.name}</span><span class="lamp">${'💡'.repeat(lv + 1)}</span></div>
<div class="bd"><h3>ขั้น ${lv + 1} ${HINT_LEVELS[lv]}</h3>
<p style="font-size:${lv === 1 ? '10pt' : '8.8pt'};${lv === 1 ? 'font-family:var(--font-display);background:#fff;border-radius:2mm;padding:2mm' : ''}">${esc(TEMPLATES[t.id][lv])}</p>
${lv === 1 ? '<p>วางบล็อกลงร่องตามแม่แบบ ร่องสีบนแท่นวางช่วยได้</p>' : ''}${lv === 2 ? '<p><b>อย่าลอกตัวอย่าง!</b> ใช้โครงเดียวกันกับคำของเราเอง</p>' : ''}
<div class="foot"><span>ใช้โทเคนคำใบ้ 1 · เปิดทีละขั้นจากขั้น 1</span>${arMarker('hint' + t.id + lv, '11mm')}</div></div>` });
const hintBack = ({ t, lv }) => card({ style: 'background:var(--hint-sky);color:var(--ink)', html: `<div class="bd back" style="color:var(--ink)"><div class="t">💡 การ์ดคำใบ้</div><div style="background:${t.color};color:#fff;border-radius:2mm;padding:1mm 3mm;font:500 10pt var(--font-display)">${t.sym} ${t.name} · ขั้น ${lv + 1}</div>
<p style="font-size:8.4pt;margin-top:2mm"><b>ก่อนเปิด ถามตัวเองก่อน:</b><br>ตอนนี้เราติดตรงไหน?<br>☐ หาคำไม่เจอ ☐ เรียงไม่ถูก<br>☐ ไม่รู้ว่าเป็นประโยคประเภทไหน</p></div>` });

// ---------- การ์ดเวลา 4 กาล + การ์ดขยายเพิ่ม (ทอยประโยค) ----------
const timeFront = (c) => {
  const t = TENSES[c.tense];
  return card({ style: 'background:#fff;border:.4mm solid var(--line)', html: `<div class="band" style="background:${t.color}"><span>🕒 การ์ดเวลา · เมื่อไร?</span><span>${t.name}</span></div>
<div class="bd" style="justify-content:center;text-align:center"><span class="pill" style="align-self:center">${t.name}</span>
<h2 style="font-size:19pt;margin:2mm 0">${esc(c.word)}</h2>
${c.aux ? `<p style="background:#fbe9cc;border-radius:2mm;padding:1.6mm 2mm">ใส่คำช่วย <b style="font-family:var(--font-display);font-size:12pt">${esc(c.aux)}</b> หน้ากริยา<br>ฉัน<b>${esc(c.aux)}</b>ปลูกต้นไม้${esc(c.word)}</p>` : `<p style="background:var(--paper);border-radius:2mm;padding:1.6mm 2mm">ไม่ต้องใส่คำช่วย<br>ฉันปลูกต้นไม้${esc(c.word)}</p>`}
<p style="font-size:7.4pt;color:var(--ink-muted)">${c.tense === 'past' || c.tense === 'now' ? 'คำสั่ง/ขอร้อง: จั่วการ์ดใหม่' : 'คำสั่ง/ขอร้อง: ใช้ได้ ไม่ต้องใส่คำช่วย'}</p>
<div class="foot"><span>ต้องใช้ทุกครั้งที่ทอยประโยค</span><span class="pill">#${c.id}</span></div></div>` });
};
const timeBack = () => card({ style: 'background:#1d4a9e', html: `<div class="bd back"><div class="big emoji">🕒</div><div class="t">การ์ดเวลา</div><div class="s">ทำไปแล้ว · ทำเป็นประจำ<br>กำลังทำ · จะทำ</div><div class="ttl">${TITLE}</div></div>` });
const EX_COLOR = { 'สถานที่': '#2e7d4f', 'อย่างไร': '#b03a72' };
const extraFront = (c) => card({ style: 'background:#fff;border:.4mm solid var(--line)', html: `<div class="band" style="background:${EX_COLOR[c.kind]}"><span>➕ การ์ดขยายเพิ่ม</span><span>${c.kind === 'สถานที่' ? 'ที่ไหน?' : 'อย่างไร?'}</span></div>
<div class="bd" style="justify-content:center;text-align:center"><span class="pill" style="align-self:center">ส่วนขยายบอก${c.kind === 'อย่างไร' ? 'ลักษณะ' : 'สถานที่'}</span>
<h2 style="font-size:19pt;margin:3mm 0">${esc(c.word)}</h2><p>ใส่คำนี้ลงในประโยคที่ทอยได้<br>ให้ประโยคยาวขึ้นและชัดขึ้น</p>
<div class="foot"><span>โบนัส: ใส่ได้ถูกต้อง = บล็อกคำเพิ่ม 1</span><span class="pill">#${c.id}</span></div></div>` });
const extraBack = () => card({ style: 'background:#2e7d4f', html: `<div class="bd back"><div class="big emoji">➕</div><div class="t">การ์ดขยายเพิ่ม</div><div class="s">ที่ไหน? · อย่างไร?</div><div class="ttl">${TITLE}</div></div>` });

// ---------- ฐานการช่วยเหลือ 4 ด้าน + กระบวนการคิดสร้างสรรค์ 4 ขั้น ----------
const scItems = SCAFFOLDS.flatMap((sc) => sc.cards.map(([title, body], k) => ({ sc, title, body, k })));
const scFront = ({ sc, title, body, k }) => card({ style: 'background:#fff;border:.4mm solid var(--line)', html: `<div class="band" style="background:${sc.color}"><span>🛟 ฐานการช่วยเหลือ</span><span>${k + 1}/${sc.cards.length}</span></div>
<div class="bd"><span class="pill" style="align-self:flex-start">${sc.icon} ${esc(sc.name)}</span><h2>${esc(title)}</h2>
<p style="font-size:9.4pt;line-height:1.5">${body.split(' · ').map(esc).join('<br>')}</p>
<div class="foot"><span>หยิบอ่านได้ทุกเมื่อ ไม่ต้องใช้โทเคน</span><span class="pill">${sc.en.split(' ')[0]}</span></div></div>` });
const scBack = ({ sc }) => card({ style: `background:${sc.color}`, html: `<div class="bd back"><div class="big emoji">${sc.icon}</div><div class="t">ฐานการช่วยเหลือ</div><div class="s">${esc(sc.name)}</div><div class="ttl">${TITLE}</div></div>` });
const prFront = (c, i) => card({ style: 'background:#fff;border:.4mm solid var(--line)', html: `<div class="band" style="background:${c.color}"><span>★ กระบวนการคิดสร้างสรรค์</span><span>ขั้น ${i + 1}/4</span></div>
<div class="bd"><span class="pill" style="align-self:flex-start">${c.shape} ${esc(c.area)}</span><h2>${esc(c.step)}</h2>
<p style="font-size:7.6pt;color:var(--ink-muted)">${esc(c.def)}</p>
<ol class="steps" style="font-size:8.6pt">${c.ask.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>
<div class="foot"><span>${esc(PROCESS_RULE.split(':')[0])}</span><span class="pill">Guilford · จารุณี</span></div></div>` });
const prBack = (c) => card({ style: 'background:var(--spark-gold)', html: `<div class="bd back" style="color:var(--ink)"><div class="big" style="font:600 22mm/1 var(--font-display)">${c.shape}</div><div class="t">กระบวนการคิดสร้างสรรค์</div><div class="s">${esc(c.step)}</div><div class="ttl">${TITLE}</div></div>` });

export function cardsHtml() {
  return doc('การ์ดเกม', css,
    sheets(resItems, resFront, resBack, 'std', 3, 9, 'การ์ดทรัพยากร') +
    sheets(MISSIONS, missionFront, missionBack, 'std', 3, 9, 'การ์ดภารกิจซ่อมป้าย') +
    sheets(CHAOS, chaosFront, chaosBack, 'std', 3, 9, 'การ์ดภัยยุ่งเหยิง') +
    sheets(hintItems, hintFront, hintBack, 'std', 3, 9, 'การ์ดคำใบ้') +
    sheets(TIME_CARDS, timeFront, timeBack, 'std', 3, 9, 'การ์ดเวลา') +
    sheets(EXTRA_CARDS, extraFront, extraBack, 'std', 3, 9, 'การ์ดขยายเพิ่ม') +
    sheets(scItems, scFront, scBack, 'std', 3, 9, 'การ์ดฐานการช่วยเหลือ') +
    sheets(CREATIVE_PROCESS, prFront, prBack, 'std', 3, 9, 'การ์ดกระบวนการคิดสร้างสรรค์'));
}

// ---------- การ์ดใหญ่ ----------
const lg = (inner) => card(inner, 'lgc');
// ลูกเต๋าเรื่องเล่าที่ต้องทอยในด่านนั้น
const CUBE_COL = { S: '#c8322b', V: '#f2b705', O: '#1d4a9e', M: '#4f74b8' };
function cubeChips(codes) {
  return codes.map((code) => {
    const cube = STORY_CUBES.find((x) => x.id === code);
    const role = cube ? cube.role : code === 'R' ? 'S' : 'V';
    const label = cube ? cube.name : code === 'R' ? 'แดง 1 ลูก (ลูกใดก็ได้)' : 'เหลือง 1 ลูก (ลูกใดก็ได้)';
    return `<span style="display:inline-flex;align-items:center;gap:1mm;margin:0 2mm .8mm 0;white-space:nowrap"><span style="width:3.4mm;height:3.4mm;border-radius:.8mm;background:${CUBE_COL[role]};display:inline-block"></span>${esc(label)}</span>`;
  }).join('');
}
const crItems = CREATIVE.flatMap((c) => [{ c, s: -1 }, ...[0, 1, 2].map((s) => ({ c, s }))]);
function crFront({ c, s }) {
  const band = `<div class="band" style="background:var(--spark-gold);color:var(--ink)"><span>★ ภารกิจที่ ${c.id} ${c.area} (${c.en})</span><span>ดาว${c.shape}</span></div>`;
  if (s < 0) {
    return lg({ style: 'background:#fff;border:.5mm solid var(--spark-gold)', html: `${band}<div class="bd"><span class="pill" style="align-self:flex-start">การ์ดภาพสถานการณ์</span>
<div class="big emoji" style="font-size:${c.emoji.split(" ").length > 3 ? 14 : 17}mm;display:flex;justify-content:center;gap:3mm">${c.emoji.split(" ").map((e) => `<span>${e}</span>`).join("")}</div><h2 style="text-align:center">${esc(c.scene)}</h2><p style="text-align:center">${esc(c.sceneText)}</p>
${c.roll ? `<div class="crit"><b>🎲 ลูกเต๋าเรื่องเล่า 9 ลูก</b> แดง = ใคร/อะไร · เหลือง = ทำอะไร · น้ำเงิน = สิ่งของ ที่ไหน/เมื่อไร อย่างไร<br>ภาพหนึ่งตีความได้หลายแบบ ตีความพลิกแพลงและอธิบายได้ = ประกายคิด +1</div>` : ''}
<div class="crit"><b>เรื่องเดียวกันทั้ง 3 ด่าน</b><br>${STAGES.map((x) => esc(x)).join('<br>')}</div>
<div class="foot"><span>วางกลางโต๊ะตลอดภารกิจ<br>สแกนเพื่อดูภาพเคลื่อนไหว</span>${arMarker('scene' + c.id, '16mm')}</div></div>` });
  }
  const [task, ind] = c.stages[s];
  const timed = task.includes('5 นาที');
  const extra = c.id === 4 && s === 0 ? `<div class="sign" style="font-size:10pt">${ELAB_BROKEN.map(esc).join('<br>')}</div>` : '';
  return lg({ style: 'background:#fff;border:.5mm solid var(--spark-gold)', html: `${band}<div class="bd"><h3>${esc(STAGES[s])}</h3>
<p class="task"${c.roll ? ' style="font-size:9.4pt!important"' : ''}>${esc(task)}</p>${extra}${c.roll ? `<div class="crit" style="background:#fbe9cc"><b>🎲 ทอย:</b> ${cubeChips(c.roll[s])}</div>` : ''}
<div class="crit"><b>ถูกก่อน แล้วค่อยแปลก</b> — นับเฉพาะประโยคที่มีภาคประธานและภาคแสดงครบ และสื่อความหมายได้ถูกต้องสมบูรณ์<br>ผ่านด่าน: ประกายคิด 1 + ดาว${c.shape} 1 · ${esc(c.reward)}</div>
<div class="foot"><span>${timed ? '⏳ นาฬิกาทราย 5 นาที · ' : ''}ทุกคนเขียนพร้อมกันบนไวท์บอร์ด</span><span class="pill">ตัวบ่งชี้ ${ind}</span></div></div>` });
}
const crBack = ({ c, s }) => lg({ style: 'background:var(--spark-gold)', html: `<div class="bd back" style="color:var(--ink)"><div class="big" style="font:600 30mm/1 var(--font-display)">★</div><div class="t">ภารกิจสร้างสรรค์</div>
<div class="s">ภารกิจที่ ${c.id} ${c.area}<br>${s < 0 ? 'การ์ดภาพสถานการณ์' : esc(STAGES[s])}</div><div class="ttl">${TITLE}</div></div>` });

const coopItems = WONDERS.flatMap((w) => [{ w, s: -1 }, ...[0, 1, 2].map((s) => ({ w, s }))]);
function coopFront({ w, s }) {
  const band = `<div class="band" style="background:var(--coop-teal)"><span>🤝 ภารกิจร่วม · ${esc(w.name)}</span><span>${s < 0 ? 'สิ่งก่อสร้างมหัศจรรย์' : 'ด่าน ' + (s + 1) + '/3'}</span></div>`;
  if (s < 0) {
    return lg({ style: 'background:#fff;border:.5mm solid var(--coop-teal)', html: `${band}<div class="bd"><div class="big emoji">${w.icon}</div><h2 style="text-align:center">${esc(w.name)}</h2>
<p style="text-align:center"><b>เป้าหมาย:</b> ${esc(w.goal)}<br>ภาพ: ${esc(w.scene)}</p>
<div class="crit"><b>บทบาทจิ๊กซอว์ (หมุนเวียน)</b><br>${ROLES_JIGSAW.map(([n, d]) => `• <b>${n}</b> ${d}`).join('<br>')}<br>เล่น 2 คน: คนละ 2 บทบาท</div>
<div class="foot"><span>ครบ 3 ด่าน: มาตรวัด −3 · ผู้ร่วมทุกคนได้ 2 แต้มเมือง</span>${arMarker('wonder' + w.id, '16mm')}</div></div>` });
  }
  return lg({ style: 'background:#fff;border:.5mm solid var(--coop-teal)', html: `${band}<div class="bd"><div class="big emoji" style="font-size:16mm">${w.icon}</div><h3>${esc(w.name)} — ด่าน ${s + 1}</h3>
<p class="task">${esc(w.stages[s])}</p>
<div class="crit">ต่อบน <b>แท่นยักษ์ร่วม</b> · ทุกคนต้องวางบล็อกอย่างน้อย 1 ใบ · ผู้ตรวจธงตรวจประเภทประโยค<br>สำเร็จ: วางเครื่องหมายบนกระดาน ด่าน ${s + 1} ของ${esc(w.name)}</div>
<div class="foot"><span>ไม่สำเร็จ: ลองใหม่เมื่อมีคนหยุดที่ 🤝 ครั้งหน้า</span><span class="pill">ภารกิจร่วม</span></div></div>` });
}
const coopBack = ({ w }) => lg({ style: 'background:var(--coop-teal)', html: `<div class="bd back"><div class="big emoji">🤝</div><div class="t">ภารกิจร่วม</div><div class="s">${esc(w.name)}</div><div class="ttl">${TITLE}</div></div>` });

const coachFront = ([err, a]) => lg({ style: 'background:#fff;border:.5mm solid var(--type-command)', html: `<div class="band" style="background:var(--type-command)"><span>🦉 การ์ดคำถามโค้ช (ครูฮูก)</span><span>ขั้น 1–2</span></div>
<div class="bd"><span class="pill" style="align-self:flex-start">เมื่อเพื่อน…</span><h2>${esc(err)}</h2>
<div class="ladder">${a.map((q, i) => `<div><b>ขั้น ${i + 1}</b> ${esc(q)}</div>`).join('')}</div>
<div class="crit"><b>ถาม → รอ 5 วินาที → ทวนสิ่งที่เพื่อนพูด → ถามต่อ</b><br>ห้ามบอกคำตอบ! ถ้ายังติด พลิกไปขั้น 3–4</div>
<div class="foot"><span>ช่วยเพื่อนสำเร็จ = โทเคนมือช่วย 1</span><span class="pill">ด้านหลัง: ขั้น 3–4</span></div></div>` });
const coachBack = ([err, , b]) => lg({ style: 'background:#fff;border:.5mm solid var(--type-command)', html: `<div class="band" style="background:var(--type-command)"><span>🦉 ${esc(err)}</span><span>ขั้น 3–4</span></div>
<div class="bd"><div class="ladder">${b.map((q, i) => `<div><b>ขั้น ${i + 3}</b> ${esc(q)}</div>`).join('')}</div>
<div class="crit">ยังติดอยู่? ชวนเพื่อนเปิด <b>การ์ดคำใบ้ขั้น 2 (แม่แบบ)</b> หรือขั้น 3 (ตัวอย่างคู่ขนาน) — ไม่เฉลยประโยคของภารกิจ</div>
<div class="foot"><span>ชมที่ความพยายามและวิธีคิด ไม่ชมที่ความฉลาด</span></div></div>` });

export function largeCardsHtml() {
  return doc('การ์ดใหญ่', css,
    sheets(crItems, crFront, crBack, 'lg', 2, 4, 'การ์ดภารกิจสร้างสรรค์') +
    sheets(coopItems, coopFront, coopBack, 'lg', 2, 4, 'การ์ดภารกิจร่วม') +
    sheets(COACH, coachFront, coachBack, 'lg', 2, 4, 'การ์ดคำถามโค้ช'));
}
