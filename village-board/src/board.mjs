// กระดานหลัก 594 × 420 มม. (พิมพ์ A3 แนวตั้ง 2 แผ่นต่อกัน)
// เส้นทางคดเคี้ยว 4 แถว = สถานการณ์ปัญหา 4 ด่านตามการคิดสร้างสรรค์ (คล่อง ยืดหยุ่น ริเริ่ม ละเอียดลออ)
// ใต้แต่ละแถวเป็นแผงของด่าน: แผงปัญหา ภารกิจครบเนื้อหา 3 ด้าน และเคล็ดคิด
import { doc, esc } from './lib.mjs';
import { TITLE, SUBTITLE, SITUATIONS, MISSIONS, AREAS, SPACE_KINDS, ZONE, PROBLEM_PANEL, CONTENT_OF_MISSION } from './data.mjs';

const W = 594, H = 420, M = 9, COLS = 11;
const CW = (W - 2 * M) / COLS, CH = 34, BAND = (H - 2 * M) / 4;

// ลำดับช่องของแต่ละแถว (คอลัมน์ 0–10): ขวา → ซ้าย สลับกัน
function rows() {
  const rev = ZONE.slice().reverse();
  return [['start', ...ZONE], ['link', ...rev], [...ZONE, 'link'], ['finish', ...rev]];
}
// หมายเลขช่องตามลำดับการเดิน
function numbering() {
  const n = {}; let k = 0;
  const run = (r, cols) => cols.forEach((c) => { n[`${r}-${c}`] = k++; });
  const asc = [...Array(11).keys()], desc = asc.slice().reverse();
  run(0, asc); run(1, desc); run(2, asc); run(3, desc);
  return n;
}

const css = `
@page{size:594mm 420mm;margin:0}
.page{width:594mm;height:420mm;background:var(--paper)}
.sp{position:absolute;width:${CW - 1.6}mm;height:${CH - 1.6}mm;border-radius:3mm;padding:1.2mm 2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:.4mm;background:var(--raised);border:.6mm solid var(--line);box-shadow:0 .6mm 0 var(--line)}
.sp .ic{font-size:9.5mm;line-height:1}
.sp .ic.t{font:600 10mm/1 var(--display)}
.sp .nm{font:500 9pt/1.1 var(--display)}
.sp .su{font:500 7pt/1.1 var(--display);color:var(--s)}
.sp .tx{font-size:6.2pt;line-height:1.2;color:var(--muted)}
.sp .no{position:absolute;top:.8mm;right:1.8mm;font-size:6.5pt;color:var(--muted)}
.sp.star{background:var(--gold);border-color:var(--gold)}.sp.star .tx{color:var(--on-gold)}
.sp.learn{border-color:var(--s);border-width:1mm}
.sp.problem{background:var(--a);border-color:var(--a);color:#fff}.sp.problem .tx,.sp.problem .no{color:rgba(255,255,255,.88)}
.sp.trade{border-style:dashed;border-color:var(--aX);border-width:.9mm}
.sp.owl{background:var(--sunk)}
.sp.gate{background:var(--ink);border-color:var(--ink);color:#fff}.sp.gate .tx,.sp.gate .no{color:rgba(255,255,255,.8)}
.sp.link{background:transparent;border-style:dashed;box-shadow:none}
.sp.corner{border-width:1mm;border-color:var(--ink)}
.conn{position:absolute;width:${CW - 1.6}mm;display:flex;align-items:center;justify-content:center}
.conn::before{content:"";position:absolute;top:0;bottom:0;left:50%;border-left:1.2mm dashed var(--line)}
.conn span{position:relative;background:var(--paper);font:600 12mm/1 var(--display);color:var(--muted)}
.panel{position:absolute;left:${M + CW + 1}mm;width:${9 * CW - 2}mm;height:${BAND - CH - 4}mm;background:#fff;border:.7mm solid var(--a);border-radius:5mm;display:grid;grid-template-columns:76mm 96mm 1fr 96mm;gap:3.4mm;padding:3mm 3.4mm;overflow:hidden}
.ph{background:var(--a);color:#fff;border-radius:3mm;padding:2.4mm 3.4mm;display:flex;flex-direction:column;gap:.6mm;position:relative}
.ph .no{font:500 8.4pt var(--display);opacity:.9}
.ph h2{font-size:15pt;line-height:1.1}
.ph .topic{font:500 10pt var(--display)}
.ph .em{position:absolute;right:3mm;bottom:2mm;font-size:12mm;line-height:1}
.ph .ttl{font:600 11pt/1.1 var(--display);border-bottom:.4mm solid rgba(255,255,255,.5);padding-bottom:1.2mm;margin-bottom:.6mm}
.box h3{font-size:9.6pt;color:var(--a);margin-bottom:1.2mm;display:flex;gap:1.6mm;align-items:center;line-height:1.2}
.box{display:flex;flex-direction:column;min-width:0}
.slots{display:grid;grid-template-columns:repeat(6,1fr);gap:1.8mm;flex:1}
.slot{border:.6mm dashed var(--a);border-radius:3mm;display:flex;align-items:center;justify-content:center;font:600 13pt var(--display);color:var(--line)}
.need{font-size:7pt;color:var(--muted);margin-top:1.2mm;line-height:1.3}
.mtrack{display:grid;grid-template-columns:repeat(3,1fr);gap:2.4mm;flex:1}
.mt{border:.6mm solid var(--s);border-radius:3mm;display:flex;align-items:stretch;overflow:hidden}
.mt .bd{flex:1;display:flex;flex-direction:column;min-width:0}
.mt .h{background:var(--s);color:#fff;font:500 8pt/1.2 var(--display);padding:1mm 2mm}
.mt .t{font:500 9pt/1.2 var(--display);padding:1.2mm 2mm 0}
.mt .i{font-size:6.8pt;color:var(--muted);padding:0 2mm}
.mt .mk{margin:auto 2.4mm;width:12mm;height:12mm;border-radius:50%;border:.6mm dashed var(--s);flex:none;align-self:center}
.tips ul{margin:0;padding-left:4mm;font-size:7.6pt;line-height:1.4}
.decks{display:flex;gap:2mm;margin-top:auto}
.deck{flex:1;height:13mm;border:.5mm dashed var(--muted);border-radius:2.4mm;display:flex;align-items:center;justify-content:center;text-align:center;font:500 7pt/1.2 var(--display);color:var(--muted);padding:1mm}
.join{position:absolute;top:0;bottom:0;width:0;border-left:.3mm dashed #999}
`;

function spaces() {
  const num = numbering();
  return rows().map((row, ri) => {
    const st = SITUATIONS[ri];
    const top = M + ri * BAND;
    return row.map((k, c) => {
      const s = SPACE_KINDS[k];
      const text = s.icon === '★' || s.icon === '⇄' || s.icon === '↓';
      return `<div class="sp ${s.cls} a-${st.area}" style="left:${M + c * CW + 0.8}mm;top:${top + 0.8}mm">
<span class="no">${k === 'start' ? '' : num[`${ri}-${c}`]}</span><div class="ic ${text ? 't' : 'emoji'}">${s.icon}</div>
<div class="nm">${esc(s.name)}</div>${s.sub ? `<div class="su">${esc(s.sub)}</div>` : ''}<div class="tx">${esc(s.text)}</div></div>`;
    }).join('');
  }).join('');
}
function connectors() {
  const seg = (col, ri) => `<div class="conn" style="left:${M + col * CW + 0.8}mm;top:${M + ri * BAND + CH}mm;height:${BAND - CH}mm"><span>↓</span></div>`;
  return seg(10, 0) + seg(0, 1) + seg(10, 2);
}
function panel(st, ri) {
  const pp = PROBLEM_PANEL[st.id]; const A = AREAS[st.area];
  const ms = st.missions.map((id) => MISSIONS.find((m) => m.id === id));
  return `<div class="panel a-${st.area}" style="top:${M + ri * BAND + CH + 1.5}mm">
<div class="ph">${ri === 0 ? `<div class="ttl">${TITLE}</div>` : ''}
<span class="no">ด่านที่ ${st.no} · ${A.name}</span><h2>${esc(st.title)}</h2><span class="topic">${A.motto}</span><span class="em emoji">${st.emoji}</span></div>
<div class="box"><h3><span class="emoji">${pp.icon}</span>แผงปัญหา: ${esc(pp.name)}</h3>
<div class="slots">${[1, 2, 3, 4, 5, 6].map((n) => `<div class="slot">${n}</div>`).join('')}</div>
<p class="need">แก้การ์ด ❗ ได้ 1 ใบ วางหมุด 1 ช่อง · ครบ ${pp.need} ช่อง รับเหรียญ “${esc(st.badge)}”</p></div>
<div class="box"><h3>ภารกิจ★ ${A.name} · ครบเนื้อหา 3 ด้าน</h3>
<div class="mtrack">${ms.map((m) => { const c = CONTENT_OF_MISSION(m); return `<div class="mt c-${c.id}"><div class="bd"><div class="h">${c.topic}</div><div class="t">${esc(m.title)}</div><div class="i">ตัวบ่งชี้ ${m.ind}</div></div><div class="mk"></div></div>`; }).join('')}</div></div>
<div class="box tips"><h3>เคล็ดคิด · ${A.motto}</h3><ul>${A.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
<div class="decks"><div class="deck">การ์ดสถานการณ์ ❗<br>${esc(st.title)}</div></div></div>
</div>`;
}

export function boardHtml() {
  return doc('กระดานหลัก', css, `<div class="page">${spaces()}${connectors()}${SITUATIONS.map(panel).join('')}
<div class="join" style="left:297mm"></div>
<div class="pnote" style="bottom:.6mm;left:0;width:297mm">กระดานแผ่นที่ 1 (ซ้าย) · ต่อขอบขวากับแผ่นที่ 2 · ${esc(SUBTITLE)}</div>
<div class="pnote" style="bottom:.6mm;left:297mm;width:297mm">กระดานแผ่นที่ 2 (ขวา) · ต่อขอบซ้ายกับแผ่นที่ 1</div></div>`);
}
