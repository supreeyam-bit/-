// กระดานหลัก 594 × 420 มม. (พิมพ์ A3 แนวตั้ง 2 แผ่นต่อกัน)
// เส้นทางคดเคี้ยว 3 แถว: โรงเรียน (ซ้าย→ขวา) · ตลาด (ขวา→ซ้าย) · ทุ่งนา (ซ้าย→ขวา) ใต้แต่ละแถวเป็นแผงของด่าน
import { doc, esc } from './lib.mjs';
import { TITLE, SUBTITLE, STAGES, MISSIONS, AREAS, AREA_ORDER, SPACE_KINDS, ZONE, PROBLEM_PANEL } from './data.mjs';

const W = 594, H = 420, M = 9, COLS = 11;
const CW = (W - 2 * M) / COLS, CH = 37, BAND = (H - 2 * M) / 3;

// ลำดับช่องของแต่ละแถว (คอลัมน์ 0–10)
function rows() {
  const r1 = ['start', ...ZONE];
  const r2 = ['link', ...ZONE.slice().reverse()]; // คอลัมน์ 0 = ทางเดินลง, ช่องแรกของตลาดอยู่ขวาสุด
  const r3 = [...ZONE, 'finish'];
  return [r1, r2, r3];
}
// หมายเลขช่องตามลำดับการเดิน
function numbering() {
  const n = {}; let k = 0;
  n['0-0'] = k++;
  for (let c = 1; c <= 10; c++) n[`0-${c}`] = k++;
  for (let c = 10; c >= 0; c--) n[`1-${c}`] = k++;
  for (let c = 0; c <= 10; c++) n[`2-${c}`] = k++;
  return n;
}

const css = `
@page{size:594mm 420mm;margin:0}
.page{width:594mm;height:420mm;background:var(--paper)}
.sp{position:absolute;width:${CW - 1.6}mm;height:${CH - 1.6}mm;border-radius:3mm;padding:1.6mm 2.2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:.6mm;background:var(--raised);border:.6mm solid var(--line);box-shadow:0 .6mm 0 var(--line)}
.sp .ic{font-size:11mm;line-height:1}
.sp .ic.t{font:600 12mm/1 var(--display)}
.sp .nm{font:500 9.5pt/1.1 var(--display)}
.sp .tx{font-size:6.6pt;line-height:1.2;color:var(--muted)}
.sp .no{position:absolute;top:1mm;right:2mm;font-size:6.5pt;color:var(--muted)}
.sp.star{background:var(--gold);border-color:var(--gold)}.sp.star .tx{color:var(--on-gold)}
.sp.learn{border-color:var(--s);border-width:.9mm}
.sp.problem{background:var(--s);border-color:var(--s);color:#fff}.sp.problem .tx,.sp.problem .no{color:rgba(255,255,255,.88)}
.sp.trade{border-style:dashed;border-color:var(--aX);border-width:.9mm}
.sp.help{background:#e3eef8;border-color:#b6cde4}
.sp.owl{background:var(--sunk)}
.sp.gate{background:var(--ink);border-color:var(--ink);color:#fff}.sp.gate .tx,.sp.gate .no{color:rgba(255,255,255,.8)}
.sp.link{background:transparent;border-style:dashed;box-shadow:none}
.sp.corner{border-width:1mm;border-color:var(--ink)}
.conn{position:absolute;width:${CW - 1.6}mm;display:flex;align-items:center;justify-content:center}
.conn::before{content:"";position:absolute;top:0;bottom:0;left:50%;border-left:1.2mm dashed var(--line)}
.conn span{position:relative;background:var(--paper);font:600 14mm/1 var(--display);color:var(--muted)}
.panel{position:absolute;left:${M + CW + 1}mm;width:${9 * CW - 2}mm;height:${BAND - CH - 5}mm;background:#fff;border:.7mm solid var(--s);border-radius:5mm;display:grid;grid-template-columns:78mm 112mm 1fr 92mm;gap:4mm;padding:4mm;overflow:hidden}
.ph{background:var(--s);color:#fff;border-radius:3mm;padding:3mm 4mm;display:flex;flex-direction:column;gap:1mm}
.ph .no{font:500 9pt var(--display);opacity:.85}
.ph h2{font-size:22pt;line-height:1.05}
.ph .topic{font:500 12pt var(--display)}
.ph .em{font-size:15mm;line-height:1;margin-top:auto}
.ph .ttl{font:600 13pt/1.1 var(--display);border-bottom:.4mm solid rgba(255,255,255,.5);padding-bottom:1.6mm;margin-bottom:1mm}
.ph .sub{font-size:7pt;opacity:.9;line-height:1.3}
.box h3{font-size:11pt;color:var(--s);margin-bottom:1.6mm;display:flex;gap:2mm;align-items:center}
.box{display:flex;flex-direction:column;min-width:0}
.slots{display:grid;grid-template-columns:repeat(3,1fr);gap:2.4mm;flex:1}
.slot{border:.6mm dashed var(--s);border-radius:3mm;display:flex;align-items:center;justify-content:center;font:600 15pt var(--display);color:var(--line)}
.need{font-size:7.6pt;color:var(--muted);margin-top:1.6mm;line-height:1.3}
.mtrack{display:grid;grid-template-columns:repeat(4,1fr);gap:2.4mm;flex:1}
.mt{border:.6mm solid var(--a);border-radius:3mm;display:flex;flex-direction:column;overflow:hidden}
.mt .h{background:var(--a);color:#fff;font:500 8.6pt/1.2 var(--display);padding:1.2mm 2mm;text-align:center}
.mt .t{font:500 9pt/1.2 var(--display);padding:1.6mm 2mm 0;text-align:center}
.mt .i{font-size:6.8pt;color:var(--muted);text-align:center;padding:0 1.6mm}
.mt .mk{margin:auto auto 2mm;width:13mm;height:13mm;border-radius:50%;border:.6mm dashed var(--a)}
.ls ol{margin:0;padding-left:4.5mm;font:500 8.6pt/1.45 var(--display)}
.decks{display:flex;gap:2.4mm;margin-top:auto}
.deck{flex:1;height:24mm;border:.5mm dashed var(--muted);border-radius:2.4mm;display:flex;align-items:center;justify-content:center;text-align:center;font:500 7.6pt/1.25 var(--display);color:var(--muted);padding:1mm}
.join{position:absolute;top:0;bottom:0;width:0;border-left:.3mm dashed #999}
`;

function spaces() {
  const num = numbering();
  return rows().map((row, ri) => {
    const st = STAGES[ri];
    const top = M + ri * BAND;
    return row.map((k, c) => {
      const s = SPACE_KINDS[k];
      const cls = `${s.cls} s-${k === 'finish' || k === 'start' ? 'school' : st.id}`;
      const text = s.icon === '★' || s.icon === '⇄' || s.icon === '↓';
      const no = num[`${ri}-${c}`];
      return `<div class="sp ${cls}" style="left:${M + c * CW + 0.8}mm;top:${top + 0.8}mm">
<span class="no">${k === 'start' ? '' : no}</span><div class="ic ${text ? 't' : 'emoji'}">${s.icon}</div>
<div class="nm">${esc(s.name)}</div><div class="tx">${esc(s.text)}</div></div>`;
    }).join('');
  }).join('');
}
function connectors() {
  // แถว 1 → แถว 2 ทางขวา · แถว 2 → แถว 3 ทางซ้าย
  const seg = (col, ri, label) => `<div class="conn" style="left:${M + col * CW + 0.8}mm;top:${M + ri * BAND + CH}mm;height:${BAND - CH}mm"><span>${label}</span></div>`;
  return seg(10, 0, '↓') + seg(0, 1, '↓');
}
function panel(st, ri) {
  const pp = PROBLEM_PANEL[st.id];
  const ms = AREA_ORDER.map((a) => MISSIONS.find((m) => m.stage === st.id && m.area === a));
  return `<div class="panel s-${st.id}" style="top:${M + ri * BAND + CH + 2}mm">
<div class="ph">${ri === 0 ? `<div class="ttl">${TITLE}</div><div class="sub">${esc(SUBTITLE)}</div>` : ''}
<span class="no">ด่านที่ ${st.no}</span><h2>${st.place}</h2><span class="topic">${st.topic}</span><span class="em emoji">${st.emoji}</span></div>
<div class="box"><h3><span class="emoji">${pp.icon}</span>สถานการณ์ปัญหา: ${pp.name}</h3>
<div class="slots">${[1, 2, 3, 4, 5, 6].map((n) => `<div class="slot">${n}</div>`).join('')}</div>
<p class="need">แก้การ์ดสถานการณ์ ❗ ได้ 1 ใบ วางหมุด 1 ช่อง · ครบ ${pp.need} ช่อง = แก้ปัญหาของด่านได้ รับเหรียญหมู่บ้าน</p></div>
<div class="box"><h3>ภารกิจสร้างสรรค์ ★ เล่นตามลำดับ คิดให้มาก → หลาก → แปลก → ละเอียด</h3>
<div class="mtrack">${ms.map((m) => `<div class="mt a-${m.area}"><div class="h">${AREAS[m.area].name}</div><div class="t">${esc(m.title)}</div><div class="i">ตัวบ่งชี้ ${m.ind}</div><div class="mk"></div></div>`).join('')}</div></div>
<div class="box ls"><h3>ฐานเรียนรู้ 📘</h3><ol>${st.lessons.map((l) => `<li>${esc(l.title)}</li>`).join('')}</ol>
<div class="decks"><div class="deck">การ์ดฐานเรียนรู้<br>${st.place}</div><div class="deck">การ์ดสถานการณ์<br>${st.place}</div></div></div>
</div>`;
}

export function boardHtml() {
  return doc('กระดานหลัก', css, `<div class="page">${spaces()}${connectors()}${STAGES.map(panel).join('')}
<div class="join" style="left:297mm"></div>
<div class="pnote" style="bottom:1mm;left:0;width:297mm">กระดานแผ่นที่ 1 (ซ้าย) · ต่อขอบขวากับแผ่นที่ 2</div>
<div class="pnote" style="bottom:1mm;left:297mm;width:297mm">กระดานแผ่นที่ 2 (ขวา) · ต่อขอบซ้ายกับแผ่นที่ 1</div></div>`);
}
