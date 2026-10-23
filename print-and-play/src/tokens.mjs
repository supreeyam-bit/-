// โทเคนวงกลม 22 มม. ดาวสร้างสรรค์ 4 รูปทรง หมุดผู้เล่น ธงประเภทประโยค และลูกเต๋าประเภทประโยค
import { doc, esc, chunk } from './lib.mjs';
import { TYPES, PLAYERS } from './data.mjs';

const css = `
@page{size:210mm 297mm;margin:0}
.page{width:210mm;height:297mm;padding:12mm 9mm 0}
h2{margin:0 0 3mm;font:500 12pt var(--font-display)}
.grid{display:grid;grid-template-columns:repeat(8,22mm);grid-auto-rows:22mm;gap:2.5mm;justify-content:center}
.tk{width:22mm;height:22mm;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.tk svg{position:absolute;inset:0;width:100%;height:100%}
.tk .i{position:relative;font-size:8mm;line-height:1}
.tk .l{position:relative;font:500 6.6pt/1.1 var(--font-display);margin-top:.6mm}
.row{display:flex;gap:6mm;align-items:flex-start;flex-wrap:wrap}
.pawn{width:30mm;height:84mm;border:.3mm dashed #999;display:grid;grid-template-rows:38mm 38mm 8mm;text-align:center}
.pawn div{display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font:500 8pt var(--font-display)}
.pawn .e{font-size:14mm;line-height:1}
.pawn .up{transform:rotate(180deg)}
.pawn .base{background:#eee;color:var(--ink-muted);font:400 6pt var(--font-body)}
.flag{width:46mm;height:16mm;display:grid;grid-template-columns:1fr 1fr;border:.3mm dashed #999}
.flag div{display:flex;align-items:center;justify-content:center;gap:1mm;color:#fff;font:500 8pt var(--font-display)}
.flag div:first-child{transform:rotate(180deg)}
.flags{display:grid;grid-template-columns:repeat(4,46mm);gap:2mm;justify-content:center}
.net{display:grid;grid-template-columns:repeat(4,20mm);grid-template-rows:repeat(3,20mm)}
.face{border:.3mm solid #2a2233;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font:600 12pt/1 var(--font-display)}
.face small{font:500 6pt var(--font-display);margin-top:1mm}
.glue{border:.3mm dashed #999;background:#f3f3f3;color:#999;font-size:6pt;display:flex;align-items:center;justify-content:center}
.note{font-size:8pt;color:var(--ink-muted);margin:2mm 0 4mm}
`;

const circle = (bg, ink, icon, label, emoji = true) => `<div class="tk" style="color:${ink}"><svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="10.6" fill="${bg}" stroke="#2a2233" stroke-width=".35"/></svg>
<span class="i ${emoji ? 'emoji' : 'disp'}">${icon}</span><span class="l">${esc(label)}</span></div>`;

const STAR_SHAPES = [
  ['คล่อง', '<circle cx="11" cy="11" r="10.4"/>'],
  ['ยืดหยุ่น', '<rect x=".8" y=".8" width="20.4" height="20.4" rx="2"/>'],
  ['ริเริ่ม', '<polygon points="11,.6 21.4,20.6 .6,20.6"/>'],
  ['ละเอียดลออ', '<polygon points="11,.5 20.1,5.75 20.1,16.25 11,21.5 1.9,16.25 1.9,5.75"/>'],
];
const star = ([label, shape]) => `<div class="tk" style="color:var(--ink)"><svg viewBox="0 0 22 22"><g fill="#f7d48f" stroke="#2a2233" stroke-width=".35">${shape}</g></svg>
<span class="i disp" style="font-size:6mm;${label === 'ริเริ่ม' ? 'margin-top:3mm' : ''}">★</span><span class="l">${label}</span></div>`;

export function tokensHtml() {
  const tokens = [
    ...Array(30).fill(circle('#e8a33d', '#2a2233', '✨', 'ประกายคิด')),
    ...Array(20).fill(circle('#dcebf7', '#2a2233', '💡', 'คำใบ้')),
    ...Array(16).fill(circle('#17767a', '#fff', '🤝', 'มือช่วย')),
    ...Array(8).fill(circle('#fff', '#b03a72', 'ว้าว!', 'ชื่นชมเพื่อน', false)),
    ...STAR_SHAPES.flatMap((s) => Array(10).fill(star(s))),
    ...Array(12).fill(circle('#4a2a5e', '#fff', '💥', 'พัง')),
    circle('#4a2a5e', '#fff', '👾', 'มาตรวัด'),
    ...Array(9).fill(circle('#fff', '#17767a', '✓', 'มหัศจรรย์', false)),
    ...Array(12).fill(circle('#fff', '#b47513', '✓', 'สร้างสรรค์', false)),
  ];
  const tokenPages = chunk(tokens, 88).map((p, i, a) => `<div class="page"><h2>โทเคน ${i + 1}/${a.length}</h2><div class="grid">${p.join('')}</div>
<div class="pnote">ตัดตามวงกลม/รูปทรง · ติดบนกระดาษแข็งหรือใช้ตัวเจาะกระดาษ 1 นิ้ว</div></div>`);

  const pawns = PLAYERS.map((p) => `<div class="pawn"><div class="up" style="background:${p.hex}"><span class="e emoji">${p.animal}</span>${esc(p.name)}</div><div style="background:${p.hex}"><span class="e emoji">${p.animal}</span>${esc(p.name)}</div><div class="base">พับ + เสียบฐานดินน้ำมัน</div></div>`).join('');
  const flags = TYPES.flatMap((t) => Array(6).fill(`<div class="flag"><div style="background:${t.color}">${t.sym} ${t.name}</div><div style="background:${t.color}">${t.sym} ${t.name}</div></div>`));
  const face = (t) => (t ? `<div class="face" style="background:${t.color}">${t.sym}<small>${t.name}</small></div>` : '<div class="face" style="background:#e8a33d;color:#2a2233">★<small>เลือกเอง</small></div>');
  const [a, b, c, d, e] = TYPES;
  const net = `<div class="net"><div></div>${face(a)}<div></div><div></div>${face(b)}${face(c)}${face(d)}${face(e)}<div></div>${face(null)}<div></div><div></div></div>`;
  const extra = `<div class="page"><h2>หมุดผู้เล่น</h2><div class="note">ตัด พับครึ่งตามเส้นกลาง ทากาวสองด้านเข้าหากัน แล้วเสียบฐานด้วยดินน้ำมันหรือคลิปหนีบกระดาษ</div><div class="row">${pawns}</div>
<h2 style="margin-top:6mm">ลูกเต๋าประเภทประโยค</h2><div class="note">ตัดตามเส้นนอก พับตามขอบหน้าแต่ละช่อง แล้วติดเทปเป็นลูกบาศก์ (หรือติดสติกเกอร์บนลูกเต๋าจริง)</div>${net}
<div class="pnote">หมุด และลูกเต๋า</div></div>
<div class="page"><h2>ธงประเภทประโยค (5 ประเภท × 6 ผืน)</h2><div class="note">ตัดเป็นแถบ พับครึ่ง หุ้มไม้จิ้มฟันหรือไม้ลูกชิ้นไว้ตรงรอยพับ แล้วทากาว — ใช้ปักบนแท่นวางประโยค</div>
<div class="flags">${flags.join('')}</div><div class="pnote">ธงประเภทประโยค</div></div>`;
  return doc('โทเคน ธง หมุด', css, tokenPages.join('') + extra);
}
