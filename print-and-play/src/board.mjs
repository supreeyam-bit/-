// กระดานหลัก 594 × 420 มม. พิมพ์เป็น A3 แนวตั้ง 2 แผ่นต่อกัน
import { doc, esc } from './lib.mjs';
import { TITLE, PATH, SPACE_KINDS, WONDERS, CREATIVE } from './data.mjs';

const W = 594, H = 420, M = 10, COLS = 11, ROWS = 9;
const CW = (W - 2 * M) / COLS, CH = (H - 2 * M) / ROWS;

function cellPos(i) {
  if (i <= 10) return [i, 0];
  if (i <= 18) return [10, i - 10];
  if (i <= 28) return [10 - (i - 18), 8];
  return [0, 8 - (i - 28)];
}

const css = `
@page{size:594mm 420mm;margin:0}
.page{width:594mm;height:420mm}
.board{position:absolute;top:0;width:${W}mm;height:${H}mm;background:var(--paper)}
.sp{position:absolute;width:${CW - 1.6}mm;height:${CH - 1.6}mm;border-radius:3mm;padding:2.2mm 2.4mm;display:flex;flex-direction:column;justify-content:space-between;background:var(--paper-raised);border:.5mm solid var(--line);box-shadow:0 .6mm 0 var(--line)}
.sp .ic{font-size:17mm;line-height:1;text-align:center;margin-top:1mm}
.sp .ic.t{font-family:var(--font-display);font-weight:600;font-size:15mm}
.sp .nm{font:500 11pt/1.15 var(--font-display)}
.sp .tx{font-size:7.8pt;line-height:1.25}
.sp .no{position:absolute;top:1.6mm;right:2.4mm;font-size:7pt;color:var(--ink-muted)}
.sp.creative{background:var(--spark-gold);border-color:var(--spark-gold);color:var(--role-on-light)}
.sp.coop{background:var(--coop-teal);border-color:var(--coop-teal);color:#fff}
.sp.challenge{background:var(--type-command);border-color:var(--type-command);color:#fff}
.sp.chaos{background:var(--chaos);border-color:var(--chaos);color:#fff}
.sp.hint{background:var(--hint-sky);border-color:#b8d2ea}
.sp.market{border-color:var(--role-verb);border-width:1mm}
.sp.res .nm{color:var(--ink)}
.sp.corner{border-width:1mm}
.sp.corner .ic{font-size:20mm}
.sp .no{color:inherit;opacity:.75}
.inner{position:absolute;left:${M + CW + 4}mm;top:${M + CH + 4}mm;width:${W - 2 * M - 2 * CW - 8}mm;height:${H - 2 * M - 2 * CH - 8}mm;border-radius:6mm;background:#fff;border:.6mm solid var(--line);padding:7mm;display:grid;grid-template-rows:auto auto 1fr;gap:6mm}
.top{display:flex;justify-content:space-between;gap:8mm}
.title h1{margin:0;font:600 30pt/1.05 var(--font-display)}
.title p{margin:2mm 0 0;font-size:11pt;color:var(--ink-muted)}
.title .strip{display:flex;margin-top:4mm}
.title .strip span{display:inline-block;height:7mm;color:#fff;font:500 10pt/7mm var(--font-display);padding:0 6mm 0 4mm}
.turn{background:var(--paper);border-radius:4mm;padding:3mm 5mm;font-size:9.5pt;line-height:1.45;width:150mm}
.turn b{font-family:var(--font-display);font-weight:500}
.turn ol{margin:1mm 0 0;padding-left:5mm}
.meter h3,.panel h3{margin:0 0 2mm;font:500 12pt/1.2 var(--font-display)}
.track{display:flex;gap:1.6mm}
.track div{flex:1;height:22mm;border-radius:2.5mm;border:.5mm solid var(--line);background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;font:600 16pt/1 var(--font-display);color:var(--ink-muted)}
.track div small{font:400 6.8pt/1.2 var(--font-body);margin-top:1mm;text-align:center}
.track .atk{background:#e7dcef;border-color:var(--chaos);color:var(--chaos)}
.track .end{background:var(--chaos);border-color:var(--chaos);color:#fff}
.track .st{border-style:dashed;border-color:var(--ink-muted)}
.lower{display:grid;grid-template-columns:1fr 1fr 1fr 1.35fr;gap:5mm}
.panel{border-radius:4mm;padding:4mm;background:var(--paper);display:flex;flex-direction:column;gap:2mm}
.panel .big{font-size:16mm;line-height:1;text-align:center}
.panel .goal{font-size:8.5pt;color:var(--ink-muted);text-align:center;min-height:9mm}
.steps{display:flex;flex-direction:column;gap:2mm;flex:1}
.steps div{flex:1;border:.5mm dashed var(--coop-teal);border-radius:2.5mm;padding:2mm 3mm;font-size:8.6pt;line-height:1.35;display:flex;gap:2.5mm;align-items:flex-start;background:#fff}
.steps div b{white-space:nowrap}
.steps .mk{margin-left:auto;flex:none;width:10mm;height:10mm;border-radius:50%;border:.5mm dashed var(--coop-teal);align-self:center}
.steps div b{font-family:var(--font-display);font-weight:500;color:var(--coop-teal)}
.panel.w{border:.6mm solid var(--coop-teal)}
.panel.cr{border:.6mm solid var(--spark-gold)}
.grid4{display:grid;grid-template-columns:auto repeat(3,1fr);gap:2.4mm;flex:1;align-content:space-evenly;font-size:8pt;align-items:center}
.grid4 .h{font:500 8pt/1.1 var(--font-display);text-align:center}
.grid4 .c{height:24mm;border:.5mm dashed #c98a20;border-radius:2mm;background:#fff}
.grid4 .r{font:500 9.5pt/1.15 var(--font-display)}
.grid4 .h{font-size:9pt!important}
.reward{font-size:8pt;color:var(--ink);background:#fff;border-radius:2mm;padding:1.5mm 2.5mm}
.join{position:absolute;top:0;bottom:0;width:0;border-left:.3mm dashed #999}
`;

function spaces() {
  return PATH.map((k, i) => {
    const s = SPACE_KINDS[k];
    const [c, r] = cellPos(i);
    const isText = s.icon === '?' || s.icon === '★' || s.icon === '⇄';
    return `<div class="sp ${s.cls}" style="left:${M + c * CW + 0.8}mm;top:${M + r * CH + 0.8}mm">
<span class="no">${i === 0 ? 'เริ่ม' : i}</span>
<div class="ic ${isText ? 't disp' : 'emoji'}">${s.icon}</div>
<div><div class="nm">${esc(s.name)}</div><div class="tx">${esc(s.text)}</div></div></div>`;
  }).join('');
}

function inner() {
  const strip = [['ประธาน ▲', 'var(--role-subject)'], ['กริยา ➜', 'var(--role-verb)'], ['กรรม ●', 'var(--role-object)']]
    .map(([t, c], i) => `<span style="background:${c};${i === 1 ? 'color:var(--ink)' : ''};clip-path:polygon(${i ? '3mm 50%,' : ''}0 0,calc(100% - 3mm) 0,100% 50%,calc(100% - 3mm) 100%,0 100%${i ? '' : ''});margin-left:${i ? '-2.4mm' : 0}">${t}</span>`).join('');
  const track = Array.from({ length: 13 }, (_, n) => {
    const cls = n === 12 ? 'end' : (n === 4 || n === 8) ? 'atk' : n === 2 ? 'st' : '';
    const lab = n === 12 ? 'ทุกคนแพ้!' : (n === 4 || n === 8) ? 'ยุ่งเหยิงโจมตี' : n === 2 ? 'เริ่มเกม' : '';
    return `<div class="${cls}">${n}<small>${lab}</small></div>`;
  }).join('');
  const wonders = WONDERS.map((w) => `<div class="panel w"><h3>${esc(w.name)}</h3><div class="big emoji">${w.icon}</div><div class="goal">${esc(w.goal)}</div>
<div class="steps">${w.stages.map((t, n) => `<div><b>ด่าน ${n + 1}</b><span>${esc(t)}</span><span class="mk"></span></div>`).join('')}</div>
<div class="reward">ครบ 3 ด่าน: มาตรวัด −3 · ผู้ร่วมได้ 2 แต้ม</div></div>`).join('');
  const crGrid = `<div class="grid4"><span></span>${['ด่าน 1 สร้าง', 'ด่าน 2 ขยาย', 'ด่าน 3 ใช้ภาษา'].map((h) => `<span class="h">${h}</span>`).join('')}
${CREATIVE.map((c) => `<span class="r">${c.id}. ${esc(c.area.replace('การคิด', ''))}<br><small style="font:400 7.5pt var(--font-body);color:var(--ink-muted)">${esc(c.scene)}</small></span><span class="c"></span><span class="c"></span><span class="c"></span>`).join('')}</div>`;
  return `<div class="inner">
<div class="top"><div class="title"><h1>${TITLE}</h1><p>ซ่อมป้าย สร้างเมือง และขับไล่ยุ่งเหยิงด้วยประโยคที่ถูกต้อง</p><div class="strip">${strip}</div></div>
<div class="turn"><b>ลำดับเทิร์น</b><ol><li><b>สำรวจ</b> ทอยเต๋าเดินตามเข็มนาฬิกา ทำตามช่องที่หยุด</li><li><b>สร้าง/อัปเกรด</b> ต่อบล็อกบนแท่นวาง ปักธง อ่านออกเสียง</li><li><b>ตรวจป้าย</b> คนทางซ้ายถาม: ใคร? ทำอะไร? กับอะไร? ธงถูกไหม?</li><li><b>จ่ายทรัพยากร</b> เขียนประโยคลงที่ดินในกระดานเมือง</li><li><b>จบเทิร์น</b> ทอยเต๋าได้ 1 → มาตรวัดความสับสน +1</li></ol></div></div>
<div class="meter"><h3>มาตรวัดความสับสน</h3><div class="track">${track}</div></div>
<div class="lower">${wonders}<div class="panel cr"><h3>ภารกิจสร้างสรรค์ ★</h3>${crGrid}<div class="reward">ผ่านด่าน: ประกายคิด 1 + ดาวของด้านนั้น · ผู้หยุดที่ ★ ได้ประกายคิดเพิ่ม 1 · ครบ 3 ด่าน +2 แต้มเมือง</div></div></div>
</div>`;
}

export function boardHtml() {
  // พิมพ์เป็นหน้าเดียว 594 × 420 มม. แล้ว build.mjs ตัดเป็น A3 สองแผ่นด้วย split-a3.py (ภาพเวกเตอร์ไม่เสียความคม)
  return doc('กระดาน A3', css, `<div class="page"><div class="board" style="left:0">${spaces()}${inner()}</div>
<div class="join" style="left:297mm"></div>
<div class="pnote" style="bottom:1.5mm;left:0;width:297mm">กระดานแผ่นที่ 1 (ซ้าย) · ต่อขอบขวากับแผ่นที่ 2</div>
<div class="pnote" style="bottom:1.5mm;left:297mm;width:297mm">กระดานแผ่นที่ 2 (ขวา) · ต่อขอบซ้ายกับแผ่นที่ 1</div></div>`);
}
