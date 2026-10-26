// บล็อกคำ · แผ่นผู้เล่นและสื่อประกอบ · โทเคน
import { doc, esc, chunk } from './lib.mjs';
import { TITLE, CONTENTS, SITUATIONS, MISSIONS, AREAS, TILES, BLANK_TILES, ROLE_NAME, CHECK4, STARTERS, PROBLEM_PANEL } from './data.mjs';

const missionAt = (sid, cid) => MISSIONS.find((m) => m.area === sid && m.content === cid);

// ---------- บล็อกคำ 36 × 16 มม. ----------
const tileCss = `
@page{size:210mm 297mm;margin:0}
.page{width:210mm;height:297mm;padding:10mm 15mm}
.tiles{display:grid;grid-template-columns:repeat(5,36mm);grid-auto-rows:16mm}
.tile{border:.25mm solid #fff;background:var(--rc);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:2mm;outline:.2mm dashed #bfc6b2;outline-offset:-.1mm}
.tile.r-V{color:var(--on-rV)}
.tile b{font:500 11.5pt/1.1 var(--display)}
.tile small{font-size:5.6pt;opacity:.85}
.tile.blank b{opacity:.0}
.lg{display:flex;gap:4mm;flex-wrap:wrap;font:500 8pt var(--display);margin-bottom:3mm;align-items:center}
`;
export function tilesHtml() {
  const all = Object.entries(TILES).flatMap(([r, ws]) => [...ws.map((w) => [w, r]), ...Array(BLANK_TILES).fill(['', r])]);
  const pages = chunk(all, 80);
  return doc('บล็อกคำ', tileCss, pages.map((p, i) => `<div class="page">
<div class="lg">บล็อกคำ ${all.length} ชิ้น · ตัดตามเส้นประ · แนะนำกระดาษ 180–220 แกรม และเคลือบบล็อกเปล่าเพื่อเขียนด้วยปากกาไวท์บอร์ด
${Object.keys(TILES).map((r) => `<span class="blk r-${r}">${ROLE_NAME[r]}</span>`).join('')}</div>
<div class="tiles">${p.map(([w, r]) => `<div class="tile r-${r}${w ? '' : ' blank'}"><b>${esc(w || 'เขียนเอง')}</b><small>${w ? ROLE_NAME[r] : `${ROLE_NAME[r]} · เขียนเอง`}</small></div>`).join('')}</div>
<div class="pnote">บล็อกคำ แผ่นที่ ${i + 1}/${pages.length}</div></div>`).join(''));
}

// ---------- แผ่นผู้เล่น · ผังจัดความคิด · กระดานแลกเปลี่ยน · แผนผังความรู้ (A4 แนวนอน) ----------
const matCss = `
@page{size:297mm 210mm;margin:0}
.page{width:297mm;height:210mm;padding:10mm 12mm;display:flex;flex-direction:column;gap:5mm}
.hd{display:flex;justify-content:space-between;align-items:flex-end;gap:6mm}
.hd h1{font-size:20pt}
.hd .nm{font:500 11pt var(--display);border-bottom:.4mm solid var(--ink);min-width:80mm;padding-bottom:1mm}
.mat{display:grid;grid-template-columns:1.4fr 1.3fr 1.1fr 1.4fr 1.4fr 1.6fr;gap:2.4mm;height:44mm}
.mslot{border:.8mm dashed var(--rc);border-radius:3mm;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:1.6mm;font:500 9pt var(--display);color:var(--rc);background:#fff}
.mslot.r-V{color:#9a7400}
.mat-l{font:500 10pt var(--display);color:var(--muted)}
.row2{display:grid;grid-template-columns:1fr 1.7fr;gap:5mm;flex:1;min-height:0}
.box{border:.5mm solid var(--line);border-radius:4mm;padding:3.4mm 4mm;display:flex;flex-direction:column;gap:2mm;background:#fff}
.box h2{font-size:12pt}
.chk{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2mm;font:500 10pt var(--display)}
.chk li{display:flex;gap:2.4mm;align-items:center}.chk li::before{content:"";width:5mm;height:5mm;border:.5mm solid var(--ink);border-radius:1mm;flex:none}
.stg{display:grid;grid-template-columns:36mm repeat(3,1fr);gap:1.6mm;font-size:7.6pt;flex:1}
.stg .h{font:500 8.4pt/1.2 var(--display);text-align:center;color:#fff;background:var(--s);border-radius:1.6mm;padding:1mm}
.stg .s{font:500 8.4pt/1.2 var(--display);color:var(--a);display:flex;align-items:center}
.stg .c{border:.4mm solid var(--s);border-radius:2mm;display:flex;flex-direction:column;justify-content:space-between;padding:1mm 1.6mm}
.stg .c span{line-height:1.2}
.stg .c i{font-style:normal;letter-spacing:1.6mm;font-size:12pt;color:#c9cdbf;text-align:center}
.tok{display:flex;gap:4mm}
.tok>div{flex:1;border:.5mm dashed var(--line);border-radius:3mm;padding:2mm;font:500 9pt var(--display);display:flex;flex-direction:column;gap:1mm;min-height:26mm}
.tok small{font:400 7.6pt var(--body);color:var(--muted)}
.org{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;gap:4mm;flex:1}
.org div{border:.6mm solid var(--line);border-radius:4mm;padding:3mm;font:500 12pt var(--display)}
.org div small{display:block;font:400 8.5pt var(--body);color:var(--muted)}
.org .wide{grid-column:span 4;background:var(--sunk)}
.ex{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;flex:1}
.ex .col{border:.7mm solid var(--a);border-radius:4mm;display:flex;flex-direction:column;overflow:hidden}
.ex .col h2{background:var(--a);color:#fff;font-size:10.5pt;padding:2mm 3mm;line-height:1.25}
.ex .cell{flex:1;border-top:.4mm dashed var(--line);padding:1.4mm 3mm;font:500 8.4pt var(--display);color:var(--s)}
.starters{display:flex;flex-wrap:wrap;gap:2.4mm}
.starters span{border:.4mm solid var(--line);border-radius:9mm;padding:.6mm 3.4mm;font:500 9.5pt var(--display)}
.mm{display:flex;flex-direction:column;align-items:center;gap:6mm;flex:1}
.mm .root{background:var(--ink);color:#fff;border-radius:5mm;padding:4mm 10mm;text-align:center}
.mm .root b{font:600 18pt var(--display);display:block}
.mm .br{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm;width:100%;flex:1}
.mm .node{background:var(--s);color:#fff;border-radius:4mm;padding:3mm;text-align:center}
.mm .node b{font:500 14pt var(--display);display:block}
.mm ol{margin:3mm 0 0;padding:0 0 0 6mm;border-left:1mm solid var(--s);display:flex;flex-direction:column;gap:2mm}
.mm li{font:500 11pt var(--display);list-style:none;border:.5mm solid var(--line);border-radius:2.4mm;padding:2mm 3mm}
.mm .cr{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;width:100%}
.mm .cr div{border:.5mm solid var(--a);border-top:2.4mm solid var(--a);border-radius:3mm;padding:2mm 3mm;font-size:8.4pt;line-height:1.35}
.mm .cr b{font:500 10.5pt var(--display);color:var(--a);display:block}
`;
function playerMat(n) {
  return `<div class="page">
<div class="hd"><div><p class="mat-l">${TITLE} · แผ่นผู้เล่น ${n}</p><h1>แท่นเรียงประโยคของฉัน</h1></div><div class="nm">ชื่อ</div></div>
<div class="mat">${[['S', 'ใคร'], ['M', 'ใครแบบไหน'], ['P', 'คำเสริม (ไม่ ช่วย โปรด)'], ['V', 'ทำอะไร'], ['O', 'กับใครหรืออะไร'], ['M', 'อย่างไร ที่ไหน เมื่อไร · คำลงท้าย']].map(([r, l]) => `<div class="mslot r-${r}">${l}</div>`).join('')}</div>
<div class="row2">
<div class="box"><h2>เกณฑ์ตรวจประโยค 4 ข้อ</h2><ul class="chk">${CHECK4.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
<div class="tok"><div>🛟 โทเคนช่วยเหลือ<small>ใช้อ่านการ์ดฐานช่วยเหลือ 1 ใบ</small></div><div>🌾 เมล็ดข้าว<small>ครบ 2 เมล็ด แลกโทเคนช่วยเหลือ 1</small></div></div></div>
<div class="box"><h2>ดาวความคิดสร้างสรรค์ (ระบายดาวที่ได้)</h2>
<div class="stg"><span></span>${CONTENTS.map((c) => `<span class="h c-${c.id}">${c.topic}</span>`).join('')}
${SITUATIONS.map((st) => `<span class="s a-${st.area}">${st.no}. ${esc(st.title)}<br>${AREAS[st.area].name}</span>${CONTENTS.map((c) => { const m = missionAt(st.id, c.id); return `<div class="c c-${c.id}"><span>${m.ind} ${esc(m.title)}</span><i>★★★</i></div>`; }).join('')}`).join('')}</div></div>
</div></div>`;
}
function organizer() {
  const cells = [['ใคร', 'ผู้ทำ'], ['ใครแบบไหน', 'ขยายผู้ทำ: ลักษณะ'], ['ทำอะไร', 'การกระทำ'], ['กับใครหรืออะไร', 'กรรม'], ['อย่างไร', 'ขยายการกระทำ'], ['ที่ไหน', 'สถานที่'], ['เมื่อไร', 'เวลา'], ['รู้สึกอย่างไร', 'ความรู้สึก']];
  return `<div class="page"><div class="hd"><div><p class="mat-l">${TITLE} · เครื่องมือทางปัญญา</p><h1>ผังจัดความคิด</h1></div><div class="nm">ชื่อ</div></div>
<p>เขียนความคิดลงทีละช่อง แล้วรวมเป็นประโยคเต็มในช่องล่างสุด ใช้วางแผนก่อนเล่นภารกิจหรือแก้สถานการณ์ปัญหา</p>
<div class="org">${cells.map(([a, b]) => `<div>${a}<small>${b}</small></div>`).join('')}<div class="wide">ประโยคเต็มของฉัน<small>อ่านทวน แล้วตรวจด้วยเกณฑ์ 4 ข้อ</small></div></div></div>`;
}
function exchangeBoard() {
  return `<div class="page"><div class="hd"><div><p class="mat-l">${TITLE} · ศูนย์แลกเปลี่ยนเรียนรู้</p><h1>กระดานแลกเปลี่ยน</h1></div></div>
<p>หลังภารกิจแต่ละครั้ง เขียนคำตอบที่ชอบลงกระดาษโน้ตกาว ติดในช่องของภารกิจ แล้วเขียนตอบเพื่อนด้วยประโยคชวนคิด</p>
<div class="starters">${STARTERS.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
<div class="ex">${SITUATIONS.map((st) => `<div class="col a-${st.area}"><h2>ด่านที่ ${st.no} ${esc(st.title)}</h2>${CONTENTS.map((c) => { const m = missionAt(st.id, c.id); return `<div class="cell c-${c.id}">${c.topic} · ${esc(m.title)}</div>`; }).join('')}</div>`).join('')}</div></div>`;
}
function mindmap() {
  return `<div class="page"><div class="hd"><div><p class="mat-l">${TITLE} · ศูนย์การเรียนรู้</p><h1>แผนผังความรู้ เรื่อง การแต่งประโยค</h1></div></div>
<div class="mm"><div class="root"><b>การแต่งประโยค</b>ตามตัวชี้วัด ท 4.1 ป.3/4</div>
<div class="br">${CONTENTS.map((s) => `<div class="c-${s.id}"><div class="node"><b>${s.topic}</b>เนื้อหาด้านที่ ${s.no}</div><ol>${s.lessons.map((l, i) => `<li>${i + 1}. ${esc(l.title)}</li>`).join('')}</ol></div>`).join('')}</div>
<div class="cr">${SITUATIONS.map((st) => `<div class="a-${st.area}"><b>ด่านที่ ${st.no} ${AREAS[st.area].name}</b>${esc(st.title)} · ${esc(AREAS[st.area].def)}</div>`).join('')}</div></div></div>`;
}
export function matsHtml() {
  return doc('แผ่นผู้เล่นและสื่อประกอบ', matCss, [1, 2, 3, 4].map(playerMat).join('') + organizer() + exchangeBoard() + mindmap());
}

// ---------- โทเคนและหมุด ----------
const tokCss = `
@page{size:210mm 297mm;margin:0}
.page{width:210mm;height:297mm;padding:10mm 12mm;display:flex;flex-direction:column;gap:4mm}
h2{font-size:12pt}
.grid{display:flex;flex-wrap:wrap;gap:2mm}
.tk{width:20mm;height:20mm;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;border:.5mm solid var(--bc,var(--line));background:var(--bg,#fff);color:var(--fg,var(--ink));font:500 6.4pt/1.1 var(--display);text-align:center}
.tk .e{font-size:8mm;line-height:1}
.pawn{width:26mm;height:60mm;border:.3mm dashed #999;display:flex;flex-direction:column}
.pawn div{flex:1;display:flex;align-items:center;justify-content:center;font-size:13mm;background:var(--bg)}
.pawn div:first-child{transform:rotate(180deg)}
.pawn .base{flex:.45;background:#fff;font:500 7pt var(--display);color:var(--muted)}
.medal{width:40mm;height:40mm;border-radius:50%;background:var(--s);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font:500 9pt/1.2 var(--display);border:1.2mm double #fff;outline:.6mm solid var(--s)}
.medal .e{font-size:12mm}
`;
const tok = (n, icon, label, style = '') => Array.from({ length: n }, () => `<div class="tk" style="${style}"><span class="e emoji">${icon}</span>${label}</div>`).join('');
export function tokensHtml() {
  const PAWNS = [['🐃', '#f3d9cf'], ['🦋', '#dbe4f5'], ['🐓', '#f7ebc8'], ['🐟', '#d9ecd6']];
  return doc('โทเคน', tokCss, `<div class="page">
<h2>🛟 โทเคนช่วยเหลือ (30)</h2><div class="grid">${tok(30, '🛟', 'ช่วยเหลือ', '--bg:#e3eef8;--bc:#b6cde4')}</div>
<h2>🌾 เมล็ดข้าว (30)</h2><div class="grid">${tok(30, '🌾', 'เมล็ดข้าว', '--bg:#faf1d6;--bc:var(--gold)')}</div>
<h2>💡 โทเคนโหวตแปลกใหม่ (คนละ 2 อัน · 10)</h2><div class="grid">${tok(10, '💡', 'แปลกใหม่', '--bg:var(--aO);--bc:var(--aO);--fg:#fff')}</div>
<div class="pnote">โทเคน แผ่นที่ 1/2 · ตัดเป็นวงกลม แนะนำกระดาษแข็ง</div></div>
<div class="page">
<h2>📍 หมุดแผงสถานการณ์ปัญหา (ด่านละ 6)</h2><div class="grid">${SITUATIONS.map((s) => tok(6, PROBLEM_PANEL[s.id].icon, `ด่าน ${s.no}`, `--bg:var(--a${s.area});--bc:var(--a${s.area});--fg:#fff`)).join('')}</div>
<h2>✔ ตัวบอกภารกิจที่เล่นแล้ว (12)</h2><div class="grid">${MISSIONS.map((m) => `<div class="tk c-${m.content}" style="--bg:var(--s);--bc:var(--s);--fg:#fff"><span class="e">✔</span>${m.ind}</div>`).join('')}</div>
<h2>ตัวเดิน (พับเป็นสามเหลี่ยมตั้งได้)</h2><div class="grid">${PAWNS.map(([e, bg]) => `<div class="pawn" style="--bg:${bg}"><div class="emoji">${e}</div><div class="emoji">${e}</div><div class="base">ฐาน · ทากาว</div></div>`).join('')}</div>
<h2>เหรียญหมู่บ้าน (แก้ปัญหาของด่านได้)</h2><div class="grid" style="gap:4mm">${SITUATIONS.map((s) => `<div class="medal sit a-${s.area}"><span class="e emoji">${PROBLEM_PANEL[s.id].icon}</span>${s.badge}<br>ด่านที่ ${s.no}</div>`).join('')}</div>
<div class="pnote">โทเคน แผ่นที่ 2/2</div></div>`);
}
