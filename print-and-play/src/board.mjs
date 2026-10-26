// กระดานหลัก 594 × 420 มม. พิมพ์เป็น A3 แนวตั้ง 2 แผ่นต่อกัน
// ใช้ภาพต้นแบบ BLOCK WORLD เป็นภาพกระดาน แล้ววางเลขช่องและสัญลักษณ์ช่อง 36 ช่องทับบนช่องถนนในภาพ
// มาตรวัด สิ่งมหัศจรรย์ และตารางภารกิจสร้างสรรค์ย้ายไปอยู่ที่แผ่นติดตามเกม (trackerPage)
import { doc, esc } from './lib.mjs';
import { PATH, SPACE_KINDS, WONDERS, CREATIVE, SPACE_VERBS, LOOP_START } from './data.mjs';
import { BOARD_ART, TOWER } from './design.mjs';

const W = 594, H = 420;
const S = H / BOARD_ART.h; // มม. ต่อ px
const OX = (W - BOARD_ART.w * S) / 2;
const mm = (px) => px * S;

export const KIND_TILE = {
  wood: '#5fae3a', brick: '#d8483a', stone: '#3c78d0', glass: '#f2b705',
  mission: '#ffffff', challenge: '#1f2a44', creative: '#e8a33d', market: '#fff3c4', coop: '#17767a',
  hint: '#dcebf7', storm: '#4a2a5e', start: '#ffffff', gate: '#ffffff', bigmarket: '#fff3c4', observatory: '#1f2a44', cave: '#4a2a5e',
};
export const DARK = new Set(['wood', 'brick', 'stone', 'challenge', 'coop', 'storm', 'observatory', 'cave']);
export const SHORT = { start: 'จุดเริ่ม จั่วบล็อก 1', gate: 'ผ่าน/หยุด จั่วบล็อก 1 · จุดวนรอบ', wood: 'ทอยประโยค → ไม้', brick: 'ทอยประโยค → อิฐ', stone: 'ทอยประโยค → หิน', glass: 'ทอยประโยค → แก้วสี + คำเปลี่ยนร่าง', mission: 'ซ่อมป้าย โซน1 ★ · โซน2 ★★ · โซน3 ★★★', challenge: 'ภารกิจ ★★★ + ครูฮูก', creative: 'ทุกคนเล่นด่านถัดไป', market: 'แลก 1:1 · ธนาคาร 2:1', coop: 'ภารกิจร่วม', hint: 'โทเคนคำใบ้ 2', storm: 'เปิดการ์ดภัย', bigmarket: 'แลกไม่จำกัด', observatory: '★★★ + แก้วส้ม', cave: 'การ์ดภัย + มาตรวัด +1' };

const css = `
@page{size:594mm 420mm;margin:0}
.page{width:594mm;height:420mm;background:#fff}
.art{position:absolute;left:${OX}mm;top:0;width:${mm(BOARD_ART.w)}mm;height:${H}mm}
.art img{width:100%;height:100%;display:block}
.sp{position:absolute;width:12mm;height:12mm;transform:translate(-50%,-50%);border-radius:50%;border:1.1mm solid #fff;box-shadow:0 .8mm 1.4mm rgba(0,0,0,.45);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--ink);z-index:2}
.sp.dk{color:#fff}
.sp .ic{font-size:5.8mm;line-height:1}
.sp .ic.t{font:600 6.2mm/1 var(--font-display)}
.sp .no{position:absolute;bottom:-3.2mm;left:50%;transform:translateX(-50%);background:#2a2233;color:#fff;border-radius:2mm;padding:0 1.4mm;font:600 6.4pt/1.4 var(--font-display)}
.sp .vb{position:absolute;top:-4.6mm;left:50%;transform:translateX(-50%);background:var(--role-verb);color:var(--ink);border:.4mm solid #b88a00;border-radius:1.6mm;padding:0 1.6mm;font:600 7pt/1.35 var(--font-display);white-space:nowrap}
.fix{position:absolute;display:flex;align-items:center;justify-content:center;text-align:center;border-radius:1.4mm;font-family:var(--font-display);font-weight:600;line-height:1.12;white-space:pre-line;z-index:1}
.boat{position:absolute;z-index:2;background:#fff;border:.5mm solid #1f2a44;border-radius:3mm;padding:.8mm 2.4mm;font:500 7.4pt/1.3 var(--font-display);box-shadow:0 .6mm 0 #1f2a44}
.join{position:absolute;top:0;bottom:0;width:0;border-left:.3mm dashed #999;z-index:9}
`;

function spaces() {
  return PATH.map((k, i) => {
    const s = SPACE_KINDS[k];
    const [px, py] = BOARD_ART.spaces[i];
    const isText = s.icon === '?' || s.icon === '★' || s.icon === '⇄';
    return `<div class="sp${DARK.has(k) ? ' dk' : ''}" style="left:${OX + mm(px)}mm;top:${mm(py)}mm;background:${KIND_TILE[k]}">
${SPACE_VERBS[i] ? `<span class="vb">➜ ${esc(SPACE_VERBS[i][0])}</span>` : ''}<span class="ic ${isText ? 't' : 'emoji'}">${s.icon}</span><span class="no">${i === 0 ? 'เริ่ม' : i}</span></div>`;
  }).join('');
}

function fixes() {
  return BOARD_ART.fixes.map(([x0, y0, x1, y1, t, bg, c]) => `<div class="fix" style="left:${OX + mm(x0)}mm;top:${mm(y0)}mm;width:${mm(x1 - x0)}mm;height:${mm(y1 - y0)}mm;background:${bg};color:${c};font-size:${t.includes('\n') ? 8.2 : (y1 - y0 > 40 ? 24 : 9.2)}pt">${esc(t)}</div>`).join('');
}

export function boardHtml() {
  // พิมพ์เป็นหน้าเดียว 594 × 420 มม. แล้ว build.mjs ตัดเป็น A3 สองแผ่นด้วย split-a3.py
  const boat = `<div class="boat" style="left:${OX + mm(20)}mm;top:${mm(1000)}mm">⚓ เริ่มที่ท่าเรือ (ช่อง 0) → 🚩 ลานกลาง (ช่อง ${LOOP_START}) → วนรอบเกาะ ${LOOP_START}–${PATH.length - 1} ซ้ำ</div>`;
  return doc('กระดาน A3', css, `<div class="page"><div class="art"><img src="../assets/board-art.jpg" alt=""></div>${fixes()}${spaces()}${boat}
<div class="join" style="left:297mm"></div>
<div class="pnote" style="bottom:1.5mm;left:0;width:297mm;z-index:9">กระดานแผ่นที่ 1 (ซ้าย) · ต่อขอบขวากับแผ่นที่ 2</div>
<div class="pnote" style="bottom:1.5mm;left:297mm;width:297mm;z-index:9">กระดานแผ่นที่ 2 (ขวา) · ต่อขอบซ้ายกับแผ่นที่ 1</div></div>`);
}

// แผ่นติดตามเกม (A4 แนวนอน ในไฟล์ 02): มาตรวัด · สิ่งมหัศจรรย์ · ภารกิจสร้างสรรค์ · คำอธิบายช่อง
export const trackerCss = `
.trk{display:grid;grid-template-columns:1.1fr 1fr;gap:5mm;height:176mm}
.tp{border:.6mm solid var(--sand-edge);border-radius:4mm;background:#fffaf0;padding:3.4mm}
.tp h3{margin:0 0 2mm;font:500 12pt/1.2 var(--font-display)}
.track{display:flex;gap:1.2mm}
.track div{flex:1;height:15mm;border-radius:2mm;border:.4mm solid var(--line);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font:600 12pt/1 var(--font-display);color:var(--ink-muted)}
.track div small{font:400 5.6pt/1.1 var(--font-body);margin-top:.6mm}
.track .atk{background:#e7dcef;border-color:var(--chaos);color:var(--chaos)}
.track .end{background:var(--chaos);border-color:var(--chaos);color:#fff}
.track .st{border-style:dashed;border-color:var(--ink-muted)}
.won{display:grid;grid-template-columns:repeat(3,1fr);gap:2.4mm}
.won div{border:.5mm solid var(--coop-teal);border-radius:2mm;padding:1.6mm;text-align:center;font:500 8.6pt/1.2 var(--font-display)}
.won .e{font-size:9mm;line-height:1}
.won .mk{display:flex;justify-content:center;gap:1.6mm;margin-top:1.2mm}
.won .mk span{width:8mm;height:8mm;border-radius:50%;border:.4mm dashed var(--coop-teal)}
.grid4{display:grid;grid-template-columns:auto repeat(3,1fr);gap:1.8mm;align-items:center}
.grid4 .h{font:500 8.4pt/1.1 var(--font-display);text-align:center}
.grid4 .r{font:500 9pt/1.1 var(--font-display);white-space:nowrap}
.grid4 .c{height:13mm;border:.4mm dashed #c98a20;border-radius:1.6mm;background:#fff}
.leg{display:grid;grid-template-columns:1fr 1fr;gap:1.6mm 3mm;font-size:8pt;line-height:1.25}
.leg div{display:flex;gap:1.6mm;align-items:center}
.leg i{flex:none;width:7mm;height:7mm;border-radius:50%;border:.5mm solid #fff;box-shadow:0 0 0 .3mm rgba(0,0,0,.35);font-style:normal;font-size:4.2mm;line-height:6mm;text-align:center}
`;
export function trackerPage() {
  const track = Array.from({ length: 13 }, (_, n) => {
    const cls = n === 12 ? 'end' : (n === 4 || n === 8) ? 'atk' : n === 2 ? 'st' : '';
    const lab = n === 12 ? 'ทุกคนแพ้' : (n === 4 || n === 8) ? 'โจมตี' : n === 2 ? 'เริ่ม' : '';
    return `<div class="${cls}">${n}<small>${lab}</small></div>`;
  }).join('');
  const won = WONDERS.map((w) => `<div><span class="e emoji">${w.icon}</span><br>${esc(w.name)}<div class="mk"><span></span><span></span><span></span></div></div>`).join('');
  const grid = `<div class="grid4"><span></span>${['ด่าน 1 สร้าง', 'ด่าน 2 ขยาย', 'ด่าน 3 ใช้ภาษา'].map((t) => `<span class="h">${t}</span>`).join('')}
${CREATIVE.map((c) => `<span class="r"><span class="emoji">${TOWER.badges[c.id - 1][0]}</span> ${esc(c.area.replace('การคิด', 'คิด'))}</span><span class="c"></span><span class="c"></span><span class="c"></span>`).join('')}</div>`;
  const leg = Object.entries(SPACE_KINDS).map(([k, sp]) => `<div><i class="${['?', '★', '⇄'].includes(sp.icon) ? '' : 'emoji'}" style="background:${KIND_TILE[k]};${DARK.has(k) ? 'color:#fff' : ''}">${sp.icon}</i><span><b>${esc(sp.name)}</b> · ${SHORT[k]}</span></div>`).join('');
  return `<div class="page"><div class="head"><h1>แผ่นติดตามเกม</h1><div class="who" style="border:0">วางข้างกระดาน BLOCK WORLD · ใช้โทเคนวางบนช่อง</div></div>
<div class="trk"><div style="display:flex;flex-direction:column;gap:4mm">
<div class="tp"><h3>👾 มาตรวัดความสับสน</h3><div class="track">${track}</div></div>
<div class="tp"><h3>🤝 สิ่งก่อสร้างมหัศจรรย์ (ด่าน 1–3) · ครบ 3 ด่าน มาตรวัด −3</h3><div class="won">${won}</div></div>
<div class="tp" style="flex:1"><h3>⭐ ${TOWER.name}: ภารกิจสร้างสรรค์ (วางเครื่องหมาย ✓)</h3>${grid}</div></div>
<div class="tp"><h3>ช่องบนถนน (${PATH.length} ช่อง)</h3><div class="leg">${leg}</div>
<p style="font-size:8.4pt;margin:3mm 0 0">เดินตามเลขช่อง เริ่มที่ท่าเรือ (ช่อง 0) ผ่านหมู่บ้านไปลานกลาง 🚩 (ช่อง ${LOOP_START}) แล้ววนรอบเกาะหอคอย ${LOOP_START}–${PATH.length - 1} ซ้ำ · ผ่านลานกลางจั่วบล็อก 1 · ภารกิจซ่อมป้าย: โซน 1 ★ · โซน 2 ★★ · โซน 3 ★★★ · ป้ายเหลือง ➜ คือกริยาสำหรับทอยประโยค</p></div></div>
<div class="pnote">แผ่นติดตามเกม — มาตรวัด สิ่งมหัศจรรย์ ภารกิจสร้างสรรค์ และคำอธิบายช่อง</div></div>`;
}
