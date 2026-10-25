// กระดานหลัก 594 × 420 มม. พิมพ์เป็น A3 แนวตั้ง 2 แผ่นต่อกัน
// ธีม Block World: ทางเดิน 36 ช่องวนรอบหอคอยความคิดสร้างสรรค์ ผ่าน 3 โซนเนื้อหา และหมู่บ้าน 7 องค์ประกอบด้านล่าง
import { doc, esc } from './lib.mjs';
import { PATH, SPACE_KINDS, WONDERS, CREATIVE, SPACE_VERBS } from './data.mjs';
const SHORT = { start: 'จั่วบล็อก 1', wood: 'ทอยประโยค → ไม้', brick: 'ทอยประโยค → อิฐ', stone: 'ทอยประโยค → หิน', glass: 'ทอยประโยค → แก้วสี', mission: 'ซ่อมป้าย ★–★★★', challenge: 'ภารกิจ ★★★ + ครูฮูก', creative: 'ทุกคนเล่นด่านถัดไป', market: 'แลก 1:1 · ธนาคาร 2:1', coop: 'ภารกิจร่วม', hint: 'โทเคนคำใบ้ 2', storm: 'เปิดการ์ดภัย', bigmarket: 'แลกไม่จำกัด', observatory: '★★★ + แก้วส้ม', cave: 'การ์ดภัย + มาตรวัด +1' };
import { ZONES, zoneOf, TOWER, VILLAGE } from './design.mjs';

const W = 594, H = 420;
// เส้นทางเดิน: สี่เหลี่ยมมุมมนรอบเกาะหอคอย เริ่มซ้ายล่าง เดินตามเข็มนาฬิกา
const PX0 = 205, PX1 = 389, PY0 = 66, PY1 = 318, R = 20, CELL = 20.5;

function pathPoints() {
  const sx = PX1 - PX0 - 2 * R, sy = PY1 - PY0 - 2 * R, arc = (Math.PI * R) / 2;
  const segs = [
    ['line', [PX0, PY1 - R], [PX0, PY0 + R], sy],
    ['arc', [PX0 + R, PY0 + R], Math.PI, arc],
    ['line', [PX0 + R, PY0], [PX1 - R, PY0], sx],
    ['arc', [PX1 - R, PY0 + R], -Math.PI / 2, arc],
    ['line', [PX1, PY0 + R], [PX1, PY1 - R], sy],
    ['arc', [PX1 - R, PY1 - R], 0, arc],
    ['line', [PX1 - R, PY1], [PX0 + R, PY1], sx],
    ['arc', [PX0 + R, PY1 - R], Math.PI / 2, arc],
  ];
  const total = segs.reduce((a, s) => a + s[3], 0);
  const at = (d) => {
    for (const s of segs) {
      if (d <= s[3]) {
        const t = d / s[3];
        if (s[0] === 'line') return [s[1][0] + (s[2][0] - s[1][0]) * t, s[1][1] + (s[2][1] - s[1][1]) * t];
        const a = s[2] + (Math.PI / 2) * t;
        return [s[1][0] + R * Math.cos(a), s[1][1] + R * Math.sin(a)];
      }
      d -= s[3];
    }
    return segs[0][1];
  };
  // เริ่มที่ด้านซ้าย ค่อนลงล่าง
  return PATH.map((_, i) => at((i * total) / PATH.length + sy * 0.12));
}

const KIND_TILE = {
  wood: '#5fae3a', brick: '#d8483a', stone: '#3c78d0', glass: '#f2b705',
  mission: '#ffffff', challenge: '#1f2a44', creative: '#e8a33d', market: '#fff3c4', coop: '#17767a',
  hint: '#dcebf7', storm: '#4a2a5e', start: '#ffffff', bigmarket: '#fff3c4', observatory: '#1f2a44', cave: '#4a2a5e',
};
const DARK = new Set(['wood', 'brick', 'stone', 'challenge', 'coop', 'storm', 'observatory', 'cave']);

const css = `
@page{size:594mm 420mm;margin:0}
.page{width:594mm;height:420mm}
.board{position:absolute;top:0;width:${W}mm;height:${H}mm;background-color:var(--water);background-image:radial-gradient(ellipse 9mm 2.2mm at 50% 100%,transparent 70%,var(--water-wave) 72%,var(--water-wave) 84%,transparent 86%);background-size:26mm 13mm;overflow:hidden}
.isl{position:absolute;border-radius:14mm;background:var(--grass);border:1mm solid var(--grass-edge);box-shadow:0 0 0 2.6mm var(--sand),0 3.4mm 0 2.6mm var(--sand-edge)}
.plaza{position:absolute;border-radius:7mm;background:var(--plaza);border:.8mm solid var(--grass-edge);box-shadow:0 1.8mm 0 var(--grass-edge)}
.moat{position:absolute;border-radius:16mm;background-color:var(--water);background-image:radial-gradient(ellipse 7mm 1.8mm at 50% 100%,transparent 70%,var(--water-wave) 72%,var(--water-wave) 84%,transparent 86%);background-size:20mm 10mm;border:1mm solid var(--sand-edge)}
.road{position:absolute;inset:0;width:${W}mm;height:${H}mm;z-index:1}
.zh{position:absolute;left:50%;top:-6mm;transform:translateX(-50%);display:flex;align-items:center;gap:2mm;white-space:nowrap}
.zh .tag{background:#fff;border:.7mm solid;border-radius:3mm;padding:.4mm 3mm;font:600 11pt/1.3 var(--font-display)}
.zh .ban{color:#fff;border-radius:3mm;padding:1mm 6mm;font:600 17pt/1.25 var(--font-display);box-shadow:0 1.2mm 0 rgba(0,0,0,.25)}
.zcards{position:absolute;left:5mm;right:5mm;bottom:5mm;top:20mm;display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}
.zc{background:#fffaf0;border:.6mm solid var(--sand-edge);border-radius:3mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:1.6mm;box-shadow:0 1mm 0 var(--sand-edge)}
.zc .e{font-size:13mm;line-height:1}
.zc span{font:500 11pt/1.2 var(--font-display);margin-top:1.4mm}
.guide{position:absolute;font-size:15mm;line-height:1}
.sign{position:absolute;left:${W / 2 - 98}mm;top:5mm;width:196mm;height:46mm;border-radius:6mm;background:#8a5a2b;border:1.2mm solid #5e3a17;box-shadow:0 2mm 0 #5e3a17;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:3}
.sign .crown{position:absolute;top:-8mm;font-size:12mm}
.sign .bw{font:600 34pt/1 var(--font-display);letter-spacing:.6mm;-webkit-text-stroke:.5mm #3b2410}
.sign .sub{margin-top:2mm;background:#fbe6c2;border-radius:3mm;padding:.6mm 6mm;font:600 14pt/1.3 var(--font-display);color:#5e3a17}
.tw{position:absolute;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center}
.tw .star{font-size:16mm;line-height:1;filter:drop-shadow(0 0 2mm #ffe27a)}
.tw .blk{border:.7mm solid #6b4fa0;border-radius:2mm;background:linear-gradient(#d9c9f2,#b9a3e6);box-shadow:inset 0 -2mm 0 rgba(0,0,0,.12)}
.tw .door{width:9mm;height:11mm;border-radius:4.5mm 4.5mm 0 0;background:#6b4a2a;margin:0 auto}
.tname{position:absolute;left:50%;transform:translateX(-50%);background:#fbe6c2;border:.6mm solid #8a5a2b;border-radius:3mm;padding:.6mm 4mm;font:600 11pt/1.3 var(--font-display);color:#5e3a17;white-space:nowrap}
.badge{position:absolute;width:30mm;border-radius:4mm;background:#fffaf0;border:.6mm solid var(--sand-edge);text-align:center;padding:1.2mm .8mm}
.badge .e{display:block;width:13mm;height:13mm;margin:0 auto;border-radius:50%;font-size:8mm;line-height:13mm}
.badge b{display:block;font:500 8pt/1.15 var(--font-display);margin-top:.6mm}
.badge small{display:block;font-size:6.6pt;color:var(--ink-muted)}
.sp{position:absolute;width:${CELL}mm;height:${CELL}mm;transform:translate(-50%,-50%);border-radius:3mm;border:.5mm solid rgba(0,0,0,.25);box-shadow:0 1.3mm 0 rgba(0,0,0,.28);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:2;color:var(--ink)}
.sp.dk{color:#fff}
.sp .zb{position:absolute;left:0;right:0;top:0;height:1.6mm;border-radius:2.6mm 2.6mm 0 0}
.sp .ic{font-size:8.6mm;line-height:1;margin-top:1mm}
.sp .ic.t{font:600 8mm/1 var(--font-display)}
.sp .nm{font:500 6.2pt/1.1 var(--font-display);margin-top:.6mm}
.sp .no{position:absolute;bottom:.6mm;right:1.2mm;font-size:5.6pt;opacity:.8}
.sp .vb{position:absolute;top:-3.4mm;left:50%;transform:translateX(-50%);background:var(--role-verb);color:var(--ink);border:.4mm solid #b88a00;border-radius:1.6mm;padding:0 1.6mm;font:600 7pt/1.35 var(--font-display);white-space:nowrap}
.bridge{position:absolute;height:9mm;background:repeating-linear-gradient(90deg,#b07a42 0 3mm,#8a5a2b 3mm 3.6mm);border:.5mm solid #5e3a17;border-radius:1mm;z-index:1}
.panel{position:absolute;background:#fffaf0;border:.6mm solid var(--sand-edge);border-radius:4mm;padding:3mm}
.panel h3{margin:0 0 1.6mm;font:500 10.5pt/1.2 var(--font-display)}
.track{display:flex;gap:1mm}
.track div{flex:1;height:12mm;border-radius:1.6mm;border:.4mm solid var(--line);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font:600 10pt/1 var(--font-display);color:var(--ink-muted)}
.track div small{font:400 4.8pt/1.1 var(--font-body);margin-top:.4mm}
.track .atk{background:#e7dcef;border-color:var(--chaos);color:var(--chaos)}
.track .end{background:var(--chaos);border-color:var(--chaos);color:#fff}
.track .st{border-style:dashed;border-color:var(--ink-muted)}
.won{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm}
.won div{border:.5mm solid var(--coop-teal);border-radius:2mm;padding:1.2mm;text-align:center;font:500 7.4pt/1.2 var(--font-display)}
.won .e{font-size:7mm;line-height:1}
.won .mk{display:flex;justify-content:center;gap:1.2mm;margin-top:1mm}
.won .mk span{width:6mm;height:6mm;border-radius:50%;border:.4mm dashed var(--coop-teal)}
.grid4{display:grid;grid-template-columns:auto repeat(3,1fr);gap:1.4mm;align-items:center;font-size:6.6pt}
.grid4 .h{font:500 6.8pt/1.1 var(--font-display);text-align:center}
.grid4 .r{font:500 7.4pt/1.1 var(--font-display);white-space:nowrap}
.grid4 .c{height:9mm;border:.4mm dashed #c98a20;border-radius:1.4mm;background:#fff}
.vil{position:absolute;display:flex;flex-direction:column;align-items:center;text-align:center}
.vil .roof{width:0;height:0;border-left:19mm solid transparent;border-right:19mm solid transparent;border-bottom:13mm solid}
.vil .house{width:32mm;height:19mm;background:#fffaf0;border:.6mm solid #8a5a2b;border-top:0;display:flex;align-items:center;justify-content:center;font-size:12mm}
.vil .lab{margin-top:1.6mm;color:#fff;border-radius:2mm;padding:.8mm 2.6mm;font:500 9.6pt/1.2 var(--font-display);max-width:44mm;box-shadow:0 .8mm 0 rgba(0,0,0,.25)}
.vil .no{position:absolute;top:-1mm;left:-1mm;width:6mm;height:6mm;border-radius:50%;background:#fff;border:.4mm solid #8a5a2b;font:600 7pt/5.4mm var(--font-display)}
.leg{display:grid;grid-template-columns:repeat(3,1fr);gap:1mm 2mm;font-size:6.4pt;line-height:1.2}
.leg div{display:flex;gap:1.2mm;align-items:center}
.leg i{flex:none;width:5.4mm;height:5.4mm;border-radius:1.2mm;border:.3mm solid rgba(0,0,0,.3);font-style:normal;font-size:3.6mm;line-height:5mm;text-align:center}
.deco{position:absolute;font-size:9mm;line-height:1}
.join{position:absolute;top:0;bottom:0;width:0;border-left:.3mm dashed #999;z-index:9}
`;

const plaza = (x, y, w, h, inner = '') => `<div class="plaza" style="left:${x}mm;top:${y}mm;width:${w}mm;height:${h}mm">${inner}</div>`;
const island = (x, y, w, h, inner = '') => `<div class="isl" style="left:${x}mm;top:${y}mm;width:${w}mm;height:${h}mm">${inner}</div>`;

function zoneIsland(z, x, y, w, h, guideAt) {
  const cards = z.items.map(([e, t]) => `<div class="zc"><span class="e emoji">${e}</span><span>${esc(t)}</span></div>`).join('');
  return plaza(x, y, w, h, `<div class="zh"><span class="tag" style="border-color:${z.color};color:${z.color}">โซน ${z.n}</span><span class="ban" style="background:${z.color}">${esc(z.name)}</span></div>
<div class="zcards">${cards}<div class="zc" style="background:${z.color};color:#fff;border-color:${z.color}"><span class="e emoji">${z.icon}</span><span>${esc(z.place)}<br>ช่อง ${(z.n - 1) * 12}–${z.n * 12 - 1}</span></div></div>
<span class="guide emoji" style="${guideAt}">${z.guide}</span>`);
}

function spaces() {
  const pts = pathPoints();
  return PATH.map((k, i) => {
    const s = SPACE_KINDS[k];
    const [x, y] = pts[i];
    const isText = s.icon === '?' || s.icon === '★' || s.icon === '⇄';
    const z = zoneOf(i);
    return `<div class="sp${DARK.has(k) ? ' dk' : ''}" style="left:${x}mm;top:${y}mm;background:${KIND_TILE[k]}" title="${esc(s.text)}">
<span class="zb" style="background:${z.color}"></span>${SPACE_VERBS[i] ? `<span class="vb">➜ ${esc(SPACE_VERBS[i][0])}</span>` : ''}
<span class="ic ${isText ? 't' : 'emoji'}">${s.icon}</span><span class="nm">${esc(i === 0 ? 'เริ่ม · ' + s.name : s.name)}</span><span class="no">${i}</span></div>`;
  }).join('');
}

function tower() {
  // เกาะกลาง: หอคอย + ป้ายการคิดสร้างสรรค์ 4 ด้าน + ตารางความก้าวหน้าภารกิจสร้างสรรค์
  const cx = W / 2, top = 84;
  const blocks = [[22, 13], [30, 15], [38, 17], [46, 16]].map(([w, h], i) => `<div class="blk" style="width:${w}mm;height:${h}mm;${i === 3 ? 'display:flex;align-items:flex-end' : ''}">${i === 3 ? '<div class="door"></div>' : ''}</div>`).join('');
  const pos = [[cx - 66, top + 6], [cx + 36, top + 6], [cx - 66, top + 46], [cx + 36, top + 46]];
  const badges = TOWER.badges.map(([e, en, th, c], i) => `<div class="badge" style="left:${pos[i][0]}mm;top:${pos[i][1]}mm"><span class="e emoji" style="background:${c}">${e}</span><b>${en}</b><small>${th}</small></div>`).join('');
  const grid = `<div class="grid4"><span></span>${['ด่าน 1 สร้าง', 'ด่าน 2 ขยาย', 'ด่าน 3 ใช้ภาษา'].map((t) => `<span class="h">${t}</span>`).join('')}
${CREATIVE.map((c) => `<span class="r">${TOWER.badges[c.id - 1][0] ? `<span class="emoji">${TOWER.badges[c.id - 1][0]}</span>` : ''} ${esc(c.area.replace('การคิด', 'คิด'))}</span><span class="c"></span><span class="c"></span><span class="c"></span>`).join('')}</div>`;
  return `<div class="tw" style="top:${top - 2}mm"><span class="star emoji">⭐</span>${blocks}</div>
<div class="tname" style="top:${top + 82}mm">${TOWER.name}</div>${badges}
<div class="panel" style="left:${cx - 68}mm;top:${top + 94}mm;width:136mm"><h3>★ ภารกิจสร้างสรรค์ (วางเครื่องหมาย ✓)</h3>${grid}</div>`;
}

function panels() {
  const track = Array.from({ length: 13 }, (_, n) => {
    const cls = n === 12 ? 'end' : (n === 4 || n === 8) ? 'atk' : n === 2 ? 'st' : '';
    const lab = n === 12 ? 'ทุกคนแพ้' : (n === 4 || n === 8) ? 'โจมตี' : n === 2 ? 'เริ่ม' : '';
    return `<div class="${cls}">${n}<small>${lab}</small></div>`;
  }).join('');
  const won = WONDERS.map((w) => `<div><span class="e emoji">${w.icon}</span><br>${esc(w.name)}<div class="mk"><span></span><span></span><span></span></div></div>`).join('');
  return `<div class="panel" style="left:16mm;top:204mm;width:176mm;padding:2.4mm 3mm"><h3>👾 มาตรวัดความสับสน</h3><div class="track">${track}</div>
<h3 style="margin-top:2.4mm">🤝 สิ่งก่อสร้างมหัศจรรย์ (ด่าน 1–3) · ครบ 3 ด่าน มาตรวัด −3</h3><div class="won">${won}</div>
<h3 style="margin-top:2.4mm">ช่องบนทางเดิน</h3><div class="leg">${Object.entries(SPACE_KINDS).map(([k, sp]) => `<div><i class="${['?', '★', '⇄'].includes(sp.icon) ? '' : 'emoji'}" style="background:${KIND_TILE[k]};${DARK.has(k) ? 'color:#fff' : ''}">${sp.icon}</i><span><b>${esc(sp.name)}</b> ${SHORT[k]}</span></div>`).join('')}</div></div>`;
}

function village() {
  const y = 342, gap = (W - 40) / VILLAGE.length;
  return plaza(14, 338, W - 28, 66) + VILLAGE.map(([e, name, c], i) => `<div class="vil" style="left:${20 + i * gap + gap / 2 - 22}mm;top:${y}mm;width:44mm">
<span class="no">${i + 1}</span><div class="roof" style="border-bottom-color:${c}"></div><div class="house emoji">${e}</div><div class="lab" style="background:${c}">${esc(name)}</div></div>`).join('');
}

function deco() {
  return [['⛵', 1, 196], ['⛵', 584, 300], ['🌴', 196, 322], ['🌴', 390, 322], ['🌳', 196, 192], ['🌳', 388, 160], ['🐟', 236, 270], ['🦆', 344, 112]]
    .map(([e, x, y]) => `<span class="deco emoji" style="left:${x}mm;top:${y}mm">${e}</span>`).join('');
}

function bridges() {
  // สะพานเชื่อมทางเดินกับเกาะ
  return [[W / 2 - 9, 81, 18, 90], [W / 2 - 9, 300, 18, 90]]
    .map(([x, y, w, rot]) => `<div class="bridge" style="left:${x}mm;top:${y}mm;width:${w}mm;transform:rotate(${rot}deg)"></div>`).join('');
}

function sign() {
  const cols = ['#f2b705', '#e0457b', '#2f6fd1', '#2e9e4f', '#e8701a', '#f2b705', '#2f6fd1', '#e0457b', '#2e9e4f', '#e8701a'];
  const letters = [...'BLOCK WORLD'].map((ch, i) => (ch === ' ' ? '&nbsp;' : `<span style="color:${cols[i % cols.length]}">${ch}</span>`)).join('');
  return `<div class="sign"><span class="crown emoji">👑</span><div class="bw">${letters}</div><div class="sub">อาณาจักรนักสร้างโลกแห่งคำ</div></div>`;
}

export function boardHtml() {
  // พิมพ์เป็นหน้าเดียว 594 × 420 มม. แล้ว build.mjs ตัดเป็น A3 สองแผ่นด้วย split-a3.py (ภาพเวกเตอร์ไม่เสียความคม)
  const [z1, z2, z3] = ZONES;
  const road = `<svg class="road" viewBox="0 0 ${W} ${H}"><rect x="${PX0}" y="${PY0}" width="${PX1 - PX0}" height="${PY1 - PY0}" rx="${R}" fill="none" stroke="#d2a862" stroke-width="27"/><rect x="${PX0}" y="${PY0}" width="${PX1 - PX0}" height="${PY1 - PY0}" rx="${R}" fill="none" stroke="#f6e6bf" stroke-width="24"/></svg>`;
  const body = island(9, 9, W - 18, H - 18) + road
    + zoneIsland(z1, 16, 24, 176, 172, 'right:-4mm;top:-14mm')
    + zoneIsland(z2, 402, 24, 176, 140, 'left:-6mm;top:-14mm')
    + zoneIsland(z3, 402, 178, 176, 142, 'right:-4mm;top:-14mm')
    + `<div class="moat" style="left:219mm;top:80mm;width:156mm;height:228mm"></div>` + island(231, 92, 132, 204) + panels() + village() + bridges() + deco() + tower() + spaces() + sign();
  return doc('กระดาน A3', css, `<div class="page"><div class="board" style="left:0">${body}</div>
<div class="join" style="left:297mm"></div>
<div class="pnote" style="bottom:1.5mm;left:0;width:297mm;z-index:9">กระดานแผ่นที่ 1 (ซ้าย) · ต่อขอบขวากับแผ่นที่ 2</div>
<div class="pnote" style="bottom:1.5mm;left:297mm;width:297mm;z-index:9">กระดานแผ่นที่ 2 (ขวา) · ต่อขอบซ้ายกับแผ่นที่ 1</div></div>`);
}
