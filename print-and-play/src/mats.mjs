// กระดานเมืองส่วนตัว 4 แผ่น + แท่นวางประโยค (ด้านมีสี/ด้านเปล่า) + แท่นยักษ์ร่วม — A4 แนวนอน
import { doc, esc, arMarker } from './lib.mjs';
import { TYPES, PLAYERS, COST } from './data.mjs';

const css = `
@page{size:297mm 210mm;margin:0}
.page{width:297mm;height:210mm;padding:9mm 10mm}
.head{display:flex;align-items:center;gap:5mm;margin-bottom:4mm}
.head .pawn{width:13mm;height:13mm;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8mm}
.head h1{margin:0;font:500 18pt/1.1 var(--font-display)}
.head .who{flex:1;border-bottom:.4mm solid var(--ink-muted);height:9mm;font-size:10pt;color:var(--ink-muted);display:flex;align-items:flex-end;padding-bottom:1mm}
.mat{display:flex;flex-direction:column}
.dists{flex:1;display:grid;grid-template-columns:repeat(5,1fr);gap:3mm}
.dist{border-radius:3mm;border:.5mm solid var(--line);overflow:hidden;display:flex;flex-direction:column}
.dh{color:#fff;padding:2mm 3mm;display:flex;gap:2mm;align-items:center}
.dh b{font:500 11pt/1.15 var(--font-display)}
.dh small{display:block;font-size:7pt;opacity:.95}
.dh .ar{margin-left:auto;flex:none}
.sym{font:600 14pt/1 var(--font-display);width:8mm;text-align:center}
.plot{flex:1;justify-content:space-between;padding:2.2mm 3mm;border-top:.4mm dashed var(--line);display:flex;flex-direction:column;gap:1.4mm}
.lv{display:flex;gap:1.4mm}
.lv span{flex:1;border:.4mm solid var(--line);border-radius:1.6mm;font-size:7pt;text-align:center;padding:.6mm 0;line-height:1.2}
.lv span i{display:block;font-style:normal;font:500 8pt/1.1 var(--font-display)}
.ln{border-bottom:.3mm solid #cfc6b2;height:7.5mm;font-size:6.5pt;color:var(--ink-muted)}
.broke{display:flex;justify-content:space-between;align-items:center;font-size:7pt;color:var(--ink-muted)}
.broke span{width:9mm;height:9mm;border-radius:50%;border:.4mm dashed var(--chaos)}
.foot{display:grid;grid-template-columns:1.25fr repeat(4,1fr) 1fr 1fr 1fr;gap:2mm;margin-top:3mm}
.foot div{border:.4mm solid var(--line);border-radius:2mm;padding:1.4mm 2mm;font-size:7.2pt;min-height:13mm;line-height:1.25}
.foot div b{font-family:var(--font-display);font-weight:500;display:block}
.foot .tot{background:var(--paper)}
/* แท่นวางประโยค */
.dock{height:92mm;border:.4mm dashed #999;border-radius:5mm;padding:6mm 7mm;display:flex;flex-direction:column;gap:3mm;margin-bottom:6mm;background:var(--paper)}
.dock .t{display:flex;justify-content:space-between;font:500 11pt/1.2 var(--font-display)}
.dock .t small{font:400 8pt var(--font-body);color:var(--ink-muted)}
.row{display:flex;align-items:stretch;gap:0;height:41mm}
.slot{width:60mm;border:.8mm dashed;border-radius:3mm;margin-right:-3mm;display:flex;flex-direction:column;align-items:center;justify-content:center;font:500 11pt/1.3 var(--font-display);background:#fff}
.slot small{font:400 8pt var(--font-body);color:var(--ink-muted)}
.flag{margin-left:9mm;width:38mm;border-radius:3mm;border:.8mm solid var(--ink-muted);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:8pt;text-align:center;background:#fff;gap:1.5mm}
.flag .hole{width:9mm;height:9mm;border-radius:50%;border:.6mm solid var(--ink-muted);background:var(--paper)}
.lvls{display:flex;gap:6mm;font-size:8.5pt;color:var(--ink-muted)}
.lvls b{color:var(--ink);font-family:var(--font-display);font-weight:500}
.plain .slot{border-color:#b7ad97!important;color:var(--ink-muted)}
.coop .slot{width:31mm;font-size:9pt}
`;

function cityMat(p, i) {
  const dists = TYPES.map((t) => {
    const plot = (n) => `<div class="plot"><div class="lv">${COST.map((c) => `<span><i>${c.name}</i>${c.points} แต้ม</span>`).join('')}</div>
<div class="ln">ประโยค:</div><div class="ln"></div><div class="ln"></div><div class="ln"></div>
<div class="broke"><span></span>วางโทเคน "พัง" ที่นี่ · ที่ดินแปลง ${n}</div></div>`;
    return `<div class="dist"><div class="dh" style="background:${t.color}"><span class="sym">${t.sym}</span><div><b>${esc(t.district)}</b><small>ประโยค${esc(t.name)} · ${esc(t.glass)}</small></div>${arMarker(t.id + i, '9mm')}</div>${plot(1)}${plot(2)}</div>`;
  }).join('');
  const foot = `<div class="foot"><div><b>แต้มสิ่งก่อสร้าง</b>กระท่อม 1 · บ้าน 3 · หอคอย 6</div>
<div><b>● คล่อง</b>ดาว ×</div><div><b>■ ยืดหยุ่น</b>ดาว ×</div><div><b>▲ ริเริ่ม</b>ดาว ×</div><div><b>⬢ ละเอียดลออ</b>ดาว ×</div>
<div><b>มือช่วย</b>× 1 แต้ม</div><div><b>สิ่งมหัศจรรย์</b>× 2 แต้ม · นิทาน (≤3)</div><div class="tot"><b>รวมแต้มเมือง</b></div></div>`;
  return `<div class="page mat"><div class="head"><div class="pawn emoji" style="background:${p.hex}">${p.animal}</div><h1>เมืองของ${esc(p.name)}</h1><div class="who">ชื่อนักสำรวจ</div>
<div style="font-size:8pt;color:var(--ink-muted);max-width:70mm">สร้างให้ครบ 5 ย่าน = ประโยคครบ 5 ประเภท · เขียนด้วยปากกาไวท์บอร์ดหลังเคลือบพลาสติก</div></div>
<div class="dists">${dists}</div>${foot}<div class="pnote">กระดานเมือง ${i + 1}/4</div></div>`;
}

function dock(plain, n) {
  const slots = plain
    ? ['ร่องที่ 1', 'ร่องที่ 2', 'ร่องที่ 3', 'ร่องที่ 4']
    : [['▲ ประธาน', 'ใคร? อะไร?', 'var(--role-subject)'], ['➜ กริยา', 'ทำอะไร?', '#c99700'], ['● กรรม', 'ทำกับใคร/อะไร?', 'var(--role-object)'], ['● ส่วนขยาย', 'อย่างไร? ที่ไหน? เมื่อไร?', '#6f8fc9']];
  const s = slots.map((x) => (plain ? `<div class="slot">${x}</div>` : `<div class="slot" style="border-color:${x[2]};color:${x[2]}">${x[0]}<small>${x[1]}</small></div>`)).join('');
  return `<div class="dock ${plain ? 'plain' : ''}"><div class="t">แท่นวางประโยค ${n}${plain ? ' — ด้านไม่มีสี (เมื่อเก่งขึ้น)' : ''}<small>${plain ? 'พลิกใช้ด้านนี้หลังสร้างบ้านระดับ 2 สำเร็จ 3 หลัง รับประกายคิด 1' : 'คำเปลี่ยนร่างวางแทรกได้ตามที่การ์ดบอก · ส่วนขยายต่อได้มากกว่า 1 ใบ'}</small></div>
<div class="row">${s}<div class="flag"><div class="hole"></div>ปักธงประเภทประโยคที่นี่</div></div>
<div class="lvls"><span><b>2 ร่อง</b> = กระท่อม</span><span><b>3 ร่อง</b> = บ้าน</span><span><b>3 ร่อง + ส่วนขยาย 2</b> = หอคอย</span><span>ตรวจป้าย: ใคร? ทำอะไร? กับอะไร? ธงถูกไหม?</span></div></div>`;
}

function coopDock(part) {
  const labels = part === 1 ? ['ประโยคที่ 1', '', '', ''] : ['ประโยคที่ 2', '', '', ''];
  const slots = labels.map((l, k) => `<div class="slot" style="border-color:var(--coop-teal);color:var(--coop-teal)">${l || 'ร่อง ' + ((part - 1) * 4 + k + 1)}</div>`).join('');
  return `<div class="dock coop"><div class="t">แท่นยักษ์ร่วม — ส่วนที่ ${part}/2<small>ตัดแล้วต่อส่วนที่ 1 กับ 2 ให้เป็นแถวยาว 8 ร่อง ใช้กับภารกิจร่วม 🤝</small></div>
<div class="row" style="gap:0">${slots}${slots}</div>
<div class="lvls"><span>บทบาท: <b>นักหาประธาน · นักหากริยา · นักหากรรม · ผู้ตรวจธง</b> (หมุนเวียนทุกภารกิจ)</span></div></div>`;
}

export function matsHtml() {
  const mats = PLAYERS.map(cityMat).join('');
  const docks = [1, 3].map((n) => `<div class="page">${dock(false, n)}${dock(false, n + 1)}<div class="pnote">แท่นวางประโยค ด้านมีสี — พิมพ์สองหน้าคู่กับหน้าถัดไป (พลิกขอบยาว) หรือพิมพ์แยกแล้วติดหลังชนกัน</div></div>
<div class="page">${dock(true, n)}${dock(true, n + 1)}<div class="pnote">แท่นวางประโยค ด้านไม่มีสี (ด้านหลัง)</div></div>`).join('');
  return doc('กระดานเมืองและแท่นวางประโยค', css, mats + docks + `<div class="page">${coopDock(1)}${coopDock(2)}<div class="pnote">แท่นยักษ์ร่วม</div></div>`);
}
