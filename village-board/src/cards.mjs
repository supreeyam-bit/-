// การ์ดเกม: การ์ดเล็ก 63 × 88 มม. (9 ใบ/หน้า) และการ์ดใหญ่ 95 × 132 มม. (4 ใบ/หน้า)
// หน้าหน้า–หน้าหลังสลับกัน และกลับลำดับในแต่ละแถวของหน้าหลังไว้แล้ว สำหรับพิมพ์สองหน้าแบบพลิกขอบยาว
import { doc, esc, md, chunk, arMarker } from './lib.mjs';
import { TITLE, CONTENTS, SITUATIONS, MISSIONS, AREAS, RUBRIC, INDICATORS, SCENES, THINK_HELP, EVENTS, COACH_CARDS, CONTENT_OF_MISSION } from './data.mjs';

const css = `
@page{size:210mm 297mm;margin:0}
.page{width:210mm;height:297mm;display:flex;align-items:center;justify-content:center}
.sheet{display:grid}
.std{grid-template-columns:repeat(3,63mm);grid-auto-rows:88mm}
.lg{grid-template-columns:repeat(2,95mm);grid-auto-rows:132mm}
.c{position:relative;overflow:hidden;border:.25mm solid #bfc6b2;background:#fff;display:flex}
.c.blank{border-color:#eee}
.in{margin:2.6mm;flex:1;border-radius:3mm;display:flex;flex-direction:column;overflow:hidden;position:relative;border:.4mm solid var(--line)}
.band{padding:1.4mm 3mm;color:#fff;font:500 7.8pt/1.25 var(--display);display:flex;justify-content:space-between;align-items:center;gap:2mm;background:var(--s)}
.bd{padding:2.2mm 3mm;display:flex;flex-direction:column;gap:1.6mm;flex:1;min-height:0}
.q{font:500 10pt/1.35 var(--display)}
.opts{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:1.2mm;font-size:8.6pt;line-height:1.3}
.opts li{border:.3mm solid var(--line);border-radius:1.6mm;padding:.8mm 2mm}
.opts b{font-family:var(--display);font-weight:500;margin-right:1mm}
.blks{display:flex;flex-wrap:wrap;gap:1.4mm}
.scene{font-size:9mm;text-align:center;letter-spacing:1mm}
.key{margin-top:auto;transform:rotate(180deg);border-top:.3mm dashed var(--muted);padding-top:1.2mm;font-size:7pt;line-height:1.3;color:var(--muted)}
.key b{color:var(--ink);font-family:var(--display);font-weight:500}
.ev{font:500 10.2pt/1.4 var(--display)}
.task{background:var(--sunk);border-radius:2mm;padding:1.6mm 2.2mm;font-size:8.6pt;line-height:1.35}
.chk{margin:0;padding-left:4mm;font-size:7.4pt;line-height:1.35}
.back{align-items:center;justify-content:center;text-align:center;gap:2mm;color:#fff;background:var(--bg,var(--ink))}
.back .bi{font-size:16mm;line-height:1}
.back .bt{font:500 13pt/1.2 var(--display)}
.back .bs{font-size:8pt;opacity:.92;padding:0 3mm}
.back .bf{position:absolute;bottom:2.6mm;left:0;right:0;font:500 7pt var(--display);opacity:.8}
.coachq{font:500 11.5pt/1.45 var(--display);margin:auto 0}
.lgc .bd{padding:3.4mm 4mm;gap:2.4mm}
.lgc h2{font-size:15pt;line-height:1.15}
.lgc p,.lgc li{font-size:9pt;line-height:1.45}
.lgc .band{font-size:9pt;padding:2mm 4mm}
.mscene{position:relative;height:30mm;border-radius:2.4mm;overflow:hidden;background:linear-gradient(#cfe5f4,#e9f3f7 52%,#cfe2b2 52%)}
.mscene.rain{background:linear-gradient(#aeb9c6,#c9d2da 52%,#cfe2b2 52%)}
.mscene.dusk{background:linear-gradient(#f3bf86,#f8e1b9 52%,#cfe2b2 52%)}
.mscene span{position:absolute;transform:translate(-50%,-50%);font-size:7.5mm;line-height:1}
.prompt{font-size:9.6pt!important;line-height:1.5!important}
.prompt b{color:var(--a)}
.meta{display:flex;flex-wrap:wrap;gap:1.4mm;align-items:center}
.pill{display:inline-block;border-radius:9mm;padding:.2mm 2.4mm;font:500 7.4pt/1.5 var(--display);border:.3mm solid var(--line);background:#fff}
.pill.a{background:var(--a);color:#fff;border-color:var(--a)}
.tip{border:.4mm solid var(--a);border-radius:2mm;padding:1.6mm 2.4mm}
.tip b{font:500 8.4pt var(--display);color:var(--a)}
.tip ul,.lgc ul{margin:.6mm 0 0;padding-left:4mm}
.rub{width:100%;border-collapse:collapse;font-size:7.8pt;line-height:1.3}
.rub td{border:.3mm solid var(--line);padding:1mm 1.6mm;vertical-align:top}
.rub td:first-child{font:500 8pt var(--display);white-space:nowrap;color:var(--a)}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:2mm;font-size:7pt;color:var(--muted)}
.slips{display:flex;flex-wrap:wrap;gap:1.4mm}
.slip{border:.4mm dashed var(--bad);color:var(--bad);border-radius:1.2mm;padding:.4mm 2mm;font:500 8.4pt var(--display)}
.facts dt{font:500 8pt var(--display);color:var(--muted);margin-top:1mm}
.facts dd{margin:0;font-size:9.4pt;line-height:1.4}
.facts dd.qq{font:500 10.5pt/1.4 var(--display);color:var(--s)}
.helpm{border-left:1.2mm solid var(--a);padding:.6mm 0 .6mm 2.4mm}
.helpm b{font:500 8.6pt var(--display);color:var(--a)}
.helpm p{font-size:8.2pt!important;line-height:1.38!important}
`;

const blank = '<div class="c blank"></div>';
const pageOf = (cls, cards, perPage, note) => `<div class="page"><div class="sheet ${cls}">${[...cards, ...Array(perPage - cards.length).fill(blank)].join('')}</div><div class="pnote">${note}</div></div>`;
function sheets(items, front, back, cls, perRow, perPage, label) {
  return chunk(items, perPage).map((grp, i, all) => {
    const bk = grp.map(back);
    while (bk.length < perPage) bk.push(blank);
    const mirrored = chunk(bk, perRow).flatMap((row) => row.reverse());
    return pageOf(cls, grp.map(front), perPage, `${label} ${i + 1}/${all.length} · ด้านหน้า`) +
      pageOf(cls, mirrored, perPage, `${label} ${i + 1}/${all.length} · ด้านหลัง (พิมพ์สองหน้า พลิกขอบยาว)`);
  }).join('');
}
const card = (cls, html, extra = '') => `<div class="c ${extra}"><div class="in ${cls}">${html}</div></div>`;
const backCard = (bg, icon, title, sub) => card('back', `<div class="bi emoji">${icon}</div><div class="bt">${title}</div><div class="bs">${sub}</div><div class="bf">${TITLE}</div>`).replace('class="in back"', `class="in back" style="--bg:${bg}"`);
const blk = (spec) => { const [w, r] = spec.split(':'); return `<span class="blk r-${r}">${esc(w)}</span>`; };
const LETTER = ['ก', 'ข', 'ค', 'ง'];

// ---------- การ์ดฐานเรียนรู้ 📘 ----------
const learnItems = CONTENTS.flatMap((s) => s.lessons.flatMap((l, li) => l.items.map((it) => ({ s, l, li, it }))));
function learnFront({ s, l, li, it }) {
  let body = '', key = '';
  if (it.scene) body += `<div class="scene emoji">${it.scene}</div>`;
  body += `<div class="q">${esc(it.q)}</div>`;
  if (it.t === 'choice') {
    body += `<ol class="opts">${it.opts.map((o, i) => `<li><b>${LETTER[i]}.</b>${esc(o)}</li>`).join('')}</ol>`;
    key = `<b>เฉลย ${LETTER[it.a]}</b> ${esc(it.why)}`;
  } else if (it.t === 'build') {
    body += `<div class="blks">${it.blocks.map(blk).join('')}</div><p style="font-size:7.6pt;color:var(--muted)">หยิบบล็อกคำจากกองกลางมาเรียงบนแท่นเรียงประโยค</p>`;
    key = `<b>เฉลย</b> ${esc(it.answers.join(' / '))} · ${esc(it.why)}`;
  } else {
    body += `<div class="blks">${it.items.map(([w]) => `<span class="pill">${esc(w)}</span>`).join('')}</div><p style="font-size:7.8pt">แยกเป็น 2 กลุ่ม: <b>${it.bins.map(esc).join('</b> กับ <b>')}</b></p>`;
    key = it.bins.map((b, i) => `<b>${esc(b)}</b> ${it.items.filter((x) => x[1] === i).map((x) => esc(x[0])).join(' ')}`).join(' · ');
  }
  return card(`c-${s.id}`, `<div class="band"><span>📘 ฐานที่ ${li + 1} · ${esc(l.title)}</span><span>${s.topic}</span></div>
<div class="bd">${body}<div class="key">คนอ่านดูเฉลย: ${key}</div></div>`);
}
const CCOL = { build: 'var(--school)', use: 'var(--market)', expand: 'var(--field)' };
const learnBack = ({ s }) => backCard(CCOL[s.id], s.emoji, 'ฐานเรียนรู้', `เนื้อหาด้านที่ ${s.no} · ${s.topic}`);

// ---------- การ์ดสถานการณ์ปัญหา ❗ ----------
const eventItems = SITUATIONS.flatMap((s) => EVENTS[s.id].map((e, i) => ({ s, e, i, c: CONTENTS.find((x) => x.id === e[0]) })));
const eventFront = ({ s, c, e: [, sit, task, ex] }) => card(`sit a-${s.area}`, `<div class="band"><span>❗ ${esc(s.title)}</span><span>${s.no}</span></div>
<div class="bd"><span class="pill c-${c.id}" style="background:var(--s);color:#fff;border-color:var(--s);align-self:flex-start">${c.topic}</span><div class="ev">${esc(sit)}</div><div class="task"><b>ภารกิจ:</b> ${esc(task)}</div>
<p style="font-size:7.4pt;color:var(--muted)">ใช้บล็อกคำเรียงบนแท่น ยืมคำจากเพื่อนได้ 1 ชิ้น · คนทางซ้ายตรวจด้วยเกณฑ์ 4 ข้อ</p>
<div class="key">ตัวอย่างคำตอบ (คำตอบอื่นที่ผ่านเกณฑ์ก็ได้): <b>${esc(ex)}</b></div></div>`);
const eventBack = ({ s }) => backCard(`var(--a${s.area})`, '❗', 'สถานการณ์ปัญหา', `ด่านที่ ${s.no} ${esc(s.title)}`);

// ---------- การ์ดครูฮูก 🦉 ----------
const coachFront = ([kind, q]) => card('', `<div class="band" style="background:var(--ink)"><span>🦉 ครูฮูกถาม</span><span>${esc(kind)}</span></div>
<div class="bd"><div class="coachq">${esc(q)}</div><p style="font-size:7.4pt;color:var(--muted)">ตอบแล้วรับโทเคนช่วยเหลือ 1 อัน · ใช้ถามเพื่อนที่ติดอยู่ได้ทุกเมื่อ</p></div>`);
const coachBack = () => backCard('var(--ink)', '🦉', 'ครูฮูก', 'คำถามชวนคิด ไม่บอกคำตอบ');

export function cardsHtml() {
  return doc('การ์ดเล็ก', css,
    sheets(learnItems, learnFront, learnBack, 'std', 3, 9, 'การ์ดฐานเรียนรู้') +
    sheets(eventItems, eventFront, eventBack, 'std', 3, 9, 'การ์ดสถานการณ์ปัญหา') +
    sheets(COACH_CARDS, coachFront, coachBack, 'std', 3, 9, 'การ์ดครูฮูก'));
}

// ---------- การ์ดใหญ่ ----------
const sceneBox = (id) => { const sc = SCENES[id]; return `<div class="mscene ${sc.sky === 'day' ? '' : sc.sky}">${sc.items.map(([e, x, y]) => `<span class="emoji" style="left:${x}%;top:${y}%">${e}</span>`).join('')}</div>`; };
const sitOf = (m) => SITUATIONS.find((s) => s.id === m.area);

function problemFront(s) {
  const A = AREAS[s.area];
  return card(`lgc sit a-${s.area}`, `<div class="band"><span>สถานการณ์ปัญหา · ด่านที่ ${s.no}</span><span>${A.name}</span></div>
<div class="bd">${sceneBox(s.scene)}<h2>${esc(s.title)}</h2><p>${esc(s.story)}</p><div class="slips">${s.broken.map((b) => `<span class="slip">“${esc(b)}”</span>`).join('')}</div>
<div class="foot"><span>อ่านออกเสียงตอนเริ่มด่าน · ส่องภาพเพื่อดูคำ</span>${arMarker('problem-' + s.id)}</div></div>`);
}
function problemBack(s) {
  const ms = s.missions.map((id) => MISSIONS.find((m) => m.id === id));
  return card(`lgc sit a-${s.area}`, `<div class="band"><span>ภารกิจของด่านที่ ${s.no}</span><span>${AREAS[s.area].motto}</span></div>
<div class="bd"><dl class="facts" style="margin:0"><dt>บทบาทของเรา</dt><dd>${esc(s.role)}</dd><dt>คำถามชวนคิด</dt><dd class="qq">${esc(s.question)}</dd><dt>เป้าหมาย</dt><dd>${esc(s.goal)}</dd></dl>
<div class="task"><b>ภารกิจครบเนื้อหา 3 ด้าน</b><br>${ms.map((m) => `${CONTENT_OF_MISSION(m).topic}: ${esc(m.title)}`).join('<br>')}</div>
<div class="task"><b>ผ่านด่านได้เมื่อ</b> เล่นภารกิจครบ 3 ใบ · แก้สถานการณ์ปัญหาได้ 4 ช่อง รับเหรียญ “${esc(s.badge)}”</div></div>`);
}

function missionFront(m) {
  const s = sitOf(m), A = AREAS[m.area], c = CONTENT_OF_MISSION(m);
  return card(`lgc c-${c.id} a-${m.area}`, `<div class="band" style="background:var(--a)"><span>★ ด่านที่ ${s.no} ${esc(s.title)}</span><span>${A.name}</span></div>
<div class="bd">${sceneBox(m.scene)}<h2>${esc(m.title)}</h2>
<div class="meta"><span class="pill" style="background:var(--s);color:#fff;border-color:var(--s)">${c.topic}</span><span class="pill a">${A.motto}</span><span class="pill">ตัวบ่งชี้ ${m.ind}</span><span class="pill">${esc(m.sub)}</span>${m.timer ? `<span class="pill">⏱ ${m.timer / 60} นาที</span>` : '<span class="pill">⏱ ไม่เกิน 5 นาที</span>'}</div>
<p class="prompt">${md(m.prompt)}</p>
<div class="foot"><span>ทุกคนทำพร้อมกันบนไวท์บอร์ดหรือกระดาษ · ${m.area === 'O' ? 'มีภาพวาดได้' : 'ใช้บล็อกคำช่วยคิดได้'}</span>${arMarker(m.id)}</div></div>`);
}
function missionBack(m) {
  const A = AREAS[m.area], c = CONTENT_OF_MISSION(m);
  return card(`lgc c-${c.id} a-${m.area}`, `<div class="band" style="background:var(--a)"><span>ตรวจและให้ดาว · ${c.topic}</span><span>ตัวบ่งชี้ ${m.ind}</span></div>
<div class="bd"><p style="font-size:8.4pt!important;color:var(--muted)">${esc(INDICATORS[m.ind])}</p>
<table class="rub">${RUBRIC[m.area].map((t, n) => `<tr><td>${'★'.repeat(n) || '–'} ${n}</td><td>${esc(t)}</td></tr>`).join('')}</table>
${m.area === 'O' ? '<div class="task"><b>วงแลกเปลี่ยน:</b> ทุกคนอ่านคำตอบ แล้วแจกโทเคนโหวต “แปลกใหม่” ให้เพื่อน คนละ 2 อัน (ห้ามโหวตตัวเอง) ได้ 0 โหวต = 1 ดาว (ถ้าครบ) · 1–2 โหวต = 2 ดาว · 3 โหวตขึ้นไป = 3 ดาว</div>' : ''}
<div class="tip"><b>เคล็ดคิด · ${A.motto}</b><ul>${A.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
<p style="font-size:8pt!important"><b>ครูฮูกถาม:</b> ${esc(m.coach)}</p></div>`);
}

const HELP_TYPES = [
  ['concept', '💡', 'ความคิดรวบยอด', (m) => m.help.concept],
  ['think', '🤔', 'การคิด', (m) => THINK_HELP[m.area].join(' · ')],
  ['process', '🧭', 'กระบวนการ', (m) => PROCESS_TEXT[m.area]],
  ['strategy', '♟️', 'กลยุทธ์', (m) => m.help.strategy],
];
const PROCESS_TEXT = {
  F: 'จับเวลา เขียนทีละข้อลงไวท์บอร์ด ใส่เลขข้อ ไม่ต้องลบข้อที่ไม่แน่ใจ หมดเวลาแล้วค่อยตรวจด้วยเกณฑ์ 4 ข้อ',
  X: 'เขียนคำตอบแรก แล้ววางบล็อกคำบนแท่น สลับเปลี่ยนทีละบล็อก (ผู้ทำ การกระทำ ผู้ฟัง หรือส่วนขยาย) จดแต่ละแบบที่ได้',
  O: 'จดความคิดแรกไว้มุมกระดาน ขีดฆ่าทิ้ง แล้วคิดต่ออีก 2 ความคิด เลือกความคิดที่คิดว่าไม่ซ้ำเพื่อน วาดภาพประกอบได้',
  E: 'เขียนประโยคหลักก่อน ใช้ผังจัดความคิดถาม ใคร ทำอะไร ที่ไหน เมื่อไร อย่างไร รู้สึกอย่างไร แล้วเติมทีละช่อง',
};
const helpItems = SITUATIONS.flatMap((s) => HELP_TYPES.map((t) => ({ s, t })));
function helpFront({ s, t: [, icon, name, get] }) {
  const ms = s.missions.map((id) => MISSIONS.find((m) => m.id === id));
  return card(`lgc sit a-${s.area}`, `<div class="band"><span>${icon} ฐานช่วยเหลือ${name}</span><span>ด่านที่ ${s.no}</span></div>
<div class="bd">${ms.map((m) => `<div class="helpm c-${m.content}" style="--a:var(--s)"><b>${CONTENT_OF_MISSION(m).topic} · ${esc(m.title)}</b><p>${esc(get(m))}</p></div>`).join('')}
<div class="foot"><span>จ่ายโทเคนช่วยเหลือ 1 อัน เพื่ออ่านการ์ดนี้</span></div></div>`);
}
const helpBack = ({ s, t: [, icon, name] }) => backCard('#3b6a94', icon, `ฐานช่วยเหลือ${name}`, `ด่านที่ ${s.no} ${esc(s.title)}`);

export function largeCardsHtml() {
  const ms = SITUATIONS.flatMap((s) => s.missions.map((id) => MISSIONS.find((m) => m.id === id)));
  return doc('การ์ดใหญ่', css,
    sheets(SITUATIONS, problemFront, problemBack, 'lg', 2, 4, 'การ์ดสถานการณ์ปัญหาเปิดด่าน') +
    sheets(ms, missionFront, missionBack, 'lg', 2, 4, 'การ์ดภารกิจสร้างสรรค์') +
    sheets(helpItems, helpFront, helpBack, 'lg', 2, 4, 'การ์ดฐานช่วยเหลือ'));
}
export const COUNTS = { learn: learnItems.length, event: eventItems.length, coach: COACH_CARDS.length, help: helpItems.length };
