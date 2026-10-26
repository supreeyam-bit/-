'use strict';
// ====================== ตัวช่วย ======================
const $ = (s, el = document) => el.querySelector(s);
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const band = (n, a, b, c) => (n >= c ? 3 : n >= b ? 2 : n >= a ? 1 : 0);
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
function toast(msg) {
  const t = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(t); setTimeout(() => t.remove(), 2600);
}
async function copyText(text, fallbackEl) {
  try { await navigator.clipboard.writeText(text); toast('คัดลอกแล้ว'); }
  catch {
    if (fallbackEl) { fallbackEl.hidden = false; fallbackEl.value = text; fallbackEl.select(); }
    toast('คัดลอกอัตโนมัติไม่ได้ เลือกข้อความแล้วกดคัดลอกเองได้');
  }
}
const stars = (n, max = 3) => h('span', { class: 'stars', 'aria-label': n == null ? 'ยังไม่ส่ง' : `${n} จาก ${max} ดาว` },
  Array.from({ length: max }, (_, i) => h('i', { class: n != null && i < n ? 'on' : '' }, '★')));

// ====================== สถานะ ======================
const KEY = 'sentence-village-v2';
const DB = Object.assign({ groups: [], cur: null, unlockAll: false, board: [], consult: [], teacher: false }, store.get(KEY) || {});
let ui = { view: 'home' };
let saveT = 0;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => store.set(KEY, DB), 250); };
const G = () => DB.groups.find((g) => g.id === DB.cur);
const CONTENT = (id) => CONTENTS.find((c) => c.id === id);
const SIT = (id) => SITUATIONS.find((s) => s.id === id);
const MISSION = (id) => MISSIONS.find((m) => m.id === id);
const sitMissions = (sid) => SIT(sid).missions.map(MISSION);
function rec(g, mid) { return (g.missions[mid] ||= { data: {}, submitted: 0, auto: null, teacher: null, helps: {} }); }
function finalScore(r) { if (!r || !r.submitted) return null; return r.teacher != null ? r.teacher : (r.auto ? r.auto.score : 0); }
function sitUnlocked(g, i) { return i === 0 || DB.unlockAll || sitMissions(SITUATIONS[i - 1].id).every((m) => g.missions[m.id] && g.missions[m.id].submitted); }
const lessonKey = (sid, i) => `${sid}-${i}`;
const newId = () => Math.random().toString(36).slice(2, 9);

function go(view, extra = {}) {
  stopTimer();
  ui = { view, ...extra };
  render();
  window.scrollTo({ top: 0 });
}

// ====================== การให้คะแนนอัตโนมัติ (ครูปรับได้) ======================
function othersAnswers(mid, k, g) {
  return DB.groups.filter((x) => x.id !== g.id).map((x) => ({ name: x.name, text: ((x.missions[mid] || {}).data || {})[k] })).filter((x) => typeof x.text === 'string' && x.text.trim());
}
function novelty(m, k, d, g) {
  const t = norm(d[k]);
  if (!t) return null;
  const common = (m.common || []).find((c) => { const n = norm(c); return t === n || (t.length < n.length + 6 && t.includes(n)); });
  if (common) return { ok: false, label: `คล้ายความคิดที่หลายคนคิด ("${common}") ลองคิดให้แปลกกว่านี้`, k };
  const dup = othersAnswers(m.id, k, g).find((o) => { const n = norm(o.text); return n === t || (n.length > 8 && (n.includes(t) || t.includes(n))); });
  if (dup) return { ok: false, label: `คล้ายคำตอบของกลุ่ม ${dup.name} ลองดัดแปลงให้ต่างออกไป`, k };
  return { ok: true, label: 'ไม่ซ้ำความคิดทั่วไปและไม่ซ้ำกลุ่มอื่นในเครื่องนี้', k };
}
const lines = (s) => (s || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
const hasVerb = (s) => structure(makeItem(s || '')).V;

const SCORE = {
  'build-F'(d) {
    const seen = new Set(); let good = 0, nonStmt = 0, dup = 0, noStruct = 0;
    for (const it of d.items || []) {
      const n = norm(it.text); if (seen.has(n)) { dup++; continue; } seen.add(n);
      if (!structure(it).ok) { noStruct++; continue; }
      if (sType(it.text) !== 'statement') { nonStmt++; continue; }
      good++;
    }
    return { score: band(good, 1, 3, 5), checks: [
      { ok: good >= 5, label: `ประโยคบอกเล่าที่มี ใคร + ทำอะไร ${good} ประโยค (เป้าหมาย 5 ประโยคขึ้นไป)` },
      { ok: !noStruct, label: noStruct ? `มี ${noStruct} ประโยคที่ยังขาด "ใคร" หรือ "ทำอะไร"` : 'ทุกประโยคมีภาคประธานและภาคแสดง' },
      { ok: !nonStmt, label: nonStmt ? `มี ${nonStmt} ประโยคที่ไม่ใช่ประโยคบอกเล่า` : 'เป็นประโยคบอกเล่าทั้งหมด' },
      { ok: !dup, label: dup ? `มีประโยคซ้ำกัน ${dup} ประโยค` : 'ไม่มีประโยคซ้ำ' },
    ] };
  },
  'build-X'(d) {
    const checks = []; let pts = 0;
    const keys = new Set();
    for (const k of ['v1', 'v2', 'v3']) {
      const it0 = d[k]; if (!it0 || !it0.text.trim()) { checks.push({ ok: false, label: 'ยังไม่ได้เขียน', k }); continue; }
      const it = makeItem(it0.text, it0); const st = structure(it);
      if (!st.ok) { checks.push({ ok: false, label: 'ยังขาด ใคร หรือ ทำอะไร', k }); continue; }
      if (!/แมว|ปลา|ยาย/.test(it.text)) { checks.push({ ok: false, label: 'ใช้คำว่า แมว ปลา หรือ ยาย อย่างน้อย 1 คำ', k }); continue; }
      const key = it.ws.filter((w, i) => it.tags[i] === 'S').join('') + '|' + it.ws.filter((w, i) => it.tags[i] === 'V').join('');
      if (keys.has(key)) { checks.push({ ok: false, label: 'ผู้ทำและการกระทำเหมือนแบบก่อนหน้า ลองเปลี่ยนอย่างใดอย่างหนึ่ง', k }); continue; }
      keys.add(key); pts++; checks.push({ ok: true, label: 'เป็นแบบใหม่ ผู้ทำหรือการกระทำต่างจากแบบอื่น', k });
    }
    const p2 = d.p2 && structure(d.p2), p3 = d.p3 && structure(d.p3);
    checks.push({ ok: !!(p2 && p2.parts === 2), label: p2 && p2.parts === 3 ? 'มีกรรมแล้ว กลายเป็น 3 ส่วน ลองเอากรรมออก' : 'ประโยค 2 ส่วน: มีแค่ ใคร + ทำอะไร', k: 'p2' });
    checks.push({ ok: !!(p3 && p3.parts === 3), label: 'ประโยค 3 ส่วน: ใคร + ทำอะไร + กับใครหรืออะไร', k: 'p3' });
    pts += (p2 && p2.parts === 2 ? 1 : 0) + (p3 && p3.parts === 3 ? 1 : 0);
    for (const f of MISSION('build-X').fields.filter((x) => x.want)) {
      const it = d[f.k]; const t = it && it.text.trim() ? sType(it.text) : null;
      const ok = !!t && structure(it).V && (f.want === 'request' ? (t === 'request' || t === 'command') : t === f.want);
      if (ok) pts++;
      checks.push({ ok, label: t ? `ระบบอ่านว่าเป็นประโยค${TYPE_NAME[t]}${ok ? '' : ` ยังไม่ใช่ประโยค${f.label.replace('ประโยค', '')}`}` : 'ยังไม่ได้เขียน', k: f.k });
    }
    return { score: band(pts, 2, 5, 8), checks: [{ ok: pts >= 8, label: `ทำได้ ${pts} จาก 9 จุด` }, ...checks] };
  },
  'build-O'(d, g, m) {
    const nv = novelty(m, 'sentence', d, g);
    const checks = [
      { ok: !!d.draw, label: 'วาดภาพผีเสื้อของหนูแล้ว', k: 'draw' },
      { ok: hasVerb(d.sentence), label: hasVerb(d.sentence) ? 'ประโยคมีการกระทำ' : 'ประโยคควรบอกว่าผีเสื้อทำอะไร', k: 'sentence' },
      { ok: RX.reason.test(d.reason || '') || (d.reason || '').trim().length >= 12, label: 'อธิบายเหตุผล (ใช้คำว่า เพราะ หรือ เพื่อ)', k: 'reason' },
    ];
    if (nv) checks.push(nv);
    return { score: checks.slice(0, 3).every((c) => c.ok) ? 1 : 0, pending: true, checks };
  },
  'build-E'(d) {
    const s = d.story || ''; const n = lines(s).length;
    const cats = [['time', 'บอกเวลา'], ['place', 'บอกสถานที่'], ['manner', 'บอกอาการ (ทำอย่างไร)'], ['feeling', 'บอกความรู้สึก']].map(([k, l]) => ({ ok: RX[k].test(s), label: l, k: 'story' }));
    const checks = [{ ok: !!(d.title || '').trim(), label: 'ตั้งชื่อเรื่องแล้ว', k: 'title' }, ...cats,
      { ok: n >= 5 && n <= 7, label: `ความยาว ${n} บรรทัด (5–7 บรรทัด)`, k: 'story' },
      { ok: /เด็กหญิง/.test(s) && /รด/.test(s), label: 'ยังมีประโยคหลัก เด็กหญิง…รดน้ำ…ต้นไม้', k: 'story' }];
    const pts = cats.filter((c) => c.ok).length + (checks[0].ok ? 1 : 0) + (n >= 5 && n <= 7 ? 1 : 0);
    return { score: band(pts, 2, 4, 5), checks };
  },
  'use-F'(d) {
    const seen = new Set(); let good = 0, polite = 0, rude = 0, dup = 0, notHelp = 0;
    for (const it of d.items || []) {
      const n = norm(it.text); if (seen.has(n)) { dup++; continue; } seen.add(n);
      if (RX.rude.test(it.text)) { rude++; continue; }
      if (!RX.help.test(it.text)) { notHelp++; continue; }
      good++; if (RX.polite.test(it.text)) polite++;
    }
    return { score: band(good, 1, 3, 5), checks: [
      { ok: good >= 5, label: `ถ้อยคำขอความช่วยเหลือ ${good} ข้อ (เป้าหมาย 5 ข้อขึ้นไป)` },
      { ok: good > 0 && polite === good, label: `มีคำลงท้ายสุภาพ ${polite} จาก ${good} ข้อ` },
      { ok: !notHelp, label: notHelp ? `${notHelp} ข้อยังไม่ได้ขอความช่วยเหลือ (ลองใช้ ช่วย รบกวน หน่อย ได้ไหม)` : 'ทุกข้อเป็นการขอความช่วยเหลือ' },
      { ok: !rude, label: rude ? `${rude} ข้อมีคำไม่สุภาพ` : 'ไม่มีคำไม่สุภาพ' },
      { ok: !dup, label: dup ? `ซ้ำกัน ${dup} ข้อ` : 'ไม่มีข้อซ้ำ' },
    ] };
  },
  'use-X'(d, g, m) {
    const seen = new Set(); let pass = 0; const checks = [];
    for (const f of m.fields) {
      const t = (d[f.k] || '').trim();
      if (!t) { checks.push({ ok: false, label: 'ยังไม่ได้เขียน', k: f.k }); continue; }
      const why = [];
      if (!RX.help.test(t)) why.push('ยังไม่ได้ขอความช่วยเหลือ');
      if (RX.rude.test(t)) why.push('มีคำไม่สุภาพ');
      if (f.listener.startsWith('adult') && !RX.polite.test(t)) why.push('พูดกับผู้ใหญ่ควรมีคำลงท้าย ครับ ค่ะ หรือ เด้อ');
      if (f.listener === 'adult-std' && RX.dialect.test(t)) why.push('ครูใหญ่เป็นผู้ใหญ่ในงานทางการ ควรใช้ภาษามาตรฐาน');
      if (f.listener === 'kid' && !/(นะ|จ้ะ|จ้า|จ๊ะ|หน่อย|เด้อ)/.test(t)) why.push('พูดกับน้องใช้คำอ่อนโยน เช่น นะ จ้ะ');
      const n = norm(t); if (seen.has(n)) why.push('เหมือนคำพูดกับคนอื่น ลองปรับให้เข้ากับผู้ฟังคนนี้'); seen.add(n);
      if (!why.length) pass++;
      const extra = f.listener === 'adult' && RX.dialect.test(t) ? ' ใช้ภาษาถิ่นอย่างสุภาพ เยี่ยม!' : '';
      checks.push({ ok: !why.length, label: why.length ? why.join(' · ') : `เหมาะกับผู้ฟังคนนี้${extra}`, k: f.k });
    }
    return { score: band(pass, 1, 2, 3), checks: [{ ok: pass >= 3, label: `ปรับถ้อยคำได้เหมาะกับผู้ฟัง ${pass} คน (อย่างน้อย 3 คน)` }, ...checks] };
  },
  'use-O'(d, g, m) {
    const t = d.speech || '';
    const checks = [
      { ok: RX.help.test(t), label: 'เป็นการขอความช่วยเหลือ', k: 'speech' },
      { ok: RX.polite.test(t) && RX.address.test(t), label: 'มีคำเรียกและคำลงท้ายสุภาพ เหมาะกับลุง', k: 'speech' },
      { ok: (d.reason || '').trim().length >= 6, label: 'บอกว่าแปลกใหม่ตรงไหน', k: 'reason' },
    ];
    const nv = novelty(m, 'speech', d, g); if (nv) checks.push(nv);
    return { score: checks.slice(0, 3).every((c) => c.ok) ? 1 : 0, pending: true, checks };
  },
  'use-E'(d) {
    const a = d.fix1 || '', b = d.fix2 || '';
    const c1 = [[RX.address.test(a), 'มีคำเรียกผู้ฟัง (ป้า แม่ค้า…)'], [RX.polite.test(a), 'มีคำลงท้ายสุภาพ'], [RX.help.test(a), 'ใช้คำขอ เช่น ขอซื้อ ได้ไหม'], [/ส้ม/.test(a), 'บอกว่าต้องการอะไร (ส้ม)'], [RX.amount.test(a), 'บอกจำนวน (กี่กิโล กี่ลูก)']];
    const c2 = [[RX.address.test(b), 'มีคำเรียกผู้ฟัง (พี่…)'], [RX.polite.test(b), 'มีคำลงท้ายสุภาพ'], [/(ขาด|รั่ว|ซึม|หยด|แตก)/.test(b), 'บอกปัญหา (ถุงรั่ว)'], [RX.help.test(b) || /เปลี่ยน/.test(b), 'ขอให้ช่วย เช่น ขอเปลี่ยนถุงใหม่']];
    const pts = [...c1, ...c2].filter((x) => x[0]).length;
    return { score: band(pts, 3, 6, 8), checks: [...c1.map(([ok, label]) => ({ ok, label, k: 'fix1' })), ...c2.map(([ok, label]) => ({ ok, label, k: 'fix2' }))] };
  },
  'expand-F'(d) {
    const b = d.buckets || [[], [], []];
    const all = new Set(b.flat().map(norm)); const nb = b.filter((x) => x.length).length;
    const odd = [...b[1].filter((w) => !RX.time.test(w)), ...b[2].filter((w) => !RX.place.test(w))];
    const total = all.size;
    const score = total >= 9 && nb === 3 ? 3 : total >= 5 && nb >= 2 ? 2 : total >= 1 ? 1 : 0;
    return { score, checks: [
      { ok: total >= 9, label: `คำขยายทั้งหมด ${total} คำ (เป้าหมาย 9 คำขึ้นไป)` },
      { ok: nb === 3, label: `มีคำครบทั้ง 3 กลุ่ม (${nb}/3)` },
      { ok: !odd.length, label: odd.length ? `ลองตรวจอีกครั้ง: ${odd.slice(0, 3).join(', ')} อยู่ถูกกลุ่มไหม` : 'คำอยู่ถูกกลุ่ม' },
    ] };
  },
  'expand-X'(d, g, m) {
    const seen = new Set(); let pass = 0; const checks = [];
    const test = {
      subj: (t) => /ควาย(.+)หาย/.test(t) && /ควาย(.+)หาย/.exec(t)[1].trim().length > 0,
      act: (t) => /หาย(.+)/.test(t),
      time: (t) => RX.time.test(t),
      place: (t) => RX.place.test(t.replace(/ควาย|หาย/g, '')),
    };
    const hint = { subj: 'เติมคำบอกลักษณะระหว่าง "ควาย" กับ "หาย"', act: 'เติมคำบอกว่าหายอย่างไร หลังคำว่า "หาย"', time: 'เติมคำบอกเวลา เช่น ตอนเย็น', place: 'เติมคำบอกสถานที่ เช่น ริมหนองน้ำ' };
    for (const f of m.fields) {
      const t = (d[f.k] || '').trim();
      if (!t) { checks.push({ ok: false, label: 'ยังไม่ได้เขียน', k: f.k }); continue; }
      let why = '';
      if (!/ควาย/.test(t) || !/หาย/.test(t)) why = 'ยังต้องมีคำว่า ควาย และ หาย';
      else if (!test[f.k](t)) why = hint[f.k];
      else if (seen.has(norm(t))) why = 'เหมือนแบบอื่น';
      seen.add(norm(t));
      if (!why) pass++;
      checks.push({ ok: !why, label: why || 'ขยายถูกส่วนแล้ว', k: f.k });
    }
    return { score: band(pass, 1, 2, 3), checks: [{ ok: pass >= 3, label: `ขยายได้ ${pass} แบบ (อย่างน้อย 3 แบบ)` }, ...checks] };
  },
  'expand-O'(d, g, m) {
    const t = d.ann || ''; const ls = lines(t); const n = ls.length > 1 ? ls.length : t.split(/\s+/).filter((x) => x.length >= 6).length;
    const checks = [
      { ok: n >= 2 && n <= 4, label: `เขียนได้ ${n} ประโยค (2–3 ประโยค)`, k: 'ann' },
      { ok: /ควาย/.test(t), label: 'เกี่ยวกับการตามหาควาย', k: 'ann' },
    ];
    const nv = novelty(m, 'ann', d, g); if (nv) checks.push(nv);
    return { score: checks.slice(0, 2).every((c) => c.ok) ? 1 : 0, pending: true, checks };
  },
  'expand-E'(d, g) {
    const t = d.ann || ''; const base = (((g.missions['expand-O'] || {}).data || {}).ann || '').trim();
    const checks = [
      { ok: RX.trait.test(t), label: 'บอกลักษณะของควาย', k: 'ann' },
      { ok: RX.time.test(t), label: 'บอกเวลาที่หาย', k: 'ann' },
      { ok: RX.place.test(t.replace(/ควาย|หาย/g, '')), label: 'บอกสถานที่', k: 'ann' },
      { ok: RX.contact.test(t), label: 'บอกว่าถ้าพบให้ติดต่อใคร', k: 'ann' },
      { ok: !base || t.trim().length > base.length + 5, label: base ? 'ยาวและละเอียดกว่าประกาศเดิม' : 'เขียนประกาศ', k: 'ann' },
      { ok: RX.reason.test(d.reason || '') && (d.reason || '').trim().length >= 10, label: 'อธิบายเหตุผล (ใช้คำว่า เพราะ หรือ เพื่อ)', k: 'reason' },
    ];
    return { score: band(checks.filter((c) => c.ok).length, 2, 4, 5), checks };
  },
};
function scoreOf(m, g) { return SCORE[m.id](rec(g, m.id).data, g, m); }

// ====================== ส่วนประกอบหน้าจอ ======================
function owl(text, kind = 'ครูฮูก') {
  return h('div', { class: 'owl' }, h('span', { class: 'owl-face emoji', 'aria-hidden': 'true' }, '🦉'),
    h('p', {}, h('b', {}, `${kind}: `), text));
}
function sceneEl(id, opts = {}) {
  const sc = SCENES[id];
  let showAll = false;
  const box = h('div', { class: `scene sky-${sc.sky}${opts.small ? ' small' : ''}`, role: 'group', 'aria-label': 'ภาพสถานการณ์ แตะสิ่งต่าง ๆ เพื่อดูคำ' });
  const tags = [];
  sc.items.forEach(([e, x, y, label, act], i) => {
    const tag = h('span', { class: 'stag', hidden: true }, h('b', {}, label), act ? h('small', {}, act) : null);
    tags.push(tag);
    const it = h('button', { type: 'button', class: 'sitem', style: `left:${x}%;top:${y}%;animation-delay:${(i % 5) * -0.7}s`, 'aria-label': `${label} ${act || ''}`,
      onclick: () => { tag.hidden = !tag.hidden; } }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, e), tag);
    box.append(it);
  });
  const lens = h('button', { type: 'button', class: 'lens', onclick: () => { showAll = !showAll; tags.forEach((t) => (t.hidden = !showAll)); lens.textContent = showAll ? 'ซ่อนคำ' : '🔍 ส่องภาพ'; } }, '🔍 ส่องภาพ');
  box.append(lens);
  return box;
}
function blockEl(spec, opts = {}) {
  const [w, r] = Array.isArray(spec) ? spec : spec.split(':');
  return h(opts.button ? 'button' : 'span', { class: `blk r-${r}`, type: opts.button ? 'button' : null, onclick: opts.onclick, title: ROLE[r] ? ROLE[r].full : '' }, w);
}
function chipRow(item, onChange) {
  const row = h('div', { class: 'chips' });
  if (!item || !item.ws || !item.ws.length) return row;
  item.ws.forEach((w, i) => {
    const r = item.tags[i];
    const cls = wordClass(w, r);
    row.append(h('button', { type: 'button', class: `wchip r-${r}`, title: 'แตะเพื่อเปลี่ยนหน้าที่ของคำ',
      onclick: () => { item.tags[i] = ROLE_CYCLE[(ROLE_CYCLE.indexOf(r) + 1) % ROLE_CYCLE.length]; onChange(); } },
    h('span', { class: 'w' }, w), h('span', { class: 'r' }, ROLE[r].name + (cls ? ` · ${cls}` : ''))));
  });
  return row;
}
function badge(ok, text) { return h('span', { class: `badge ${ok === true ? 'ok' : ok === false ? 'no' : ''}` }, ok === true ? '✓ ' : ok === false ? '• ' : '', text); }
function checkList(checks) {
  return h('ul', { class: 'checks' }, checks.map((c) => h('li', { class: c.ok ? 'ok' : 'no' }, h('span', { 'aria-hidden': 'true' }, c.ok ? '✓' : '○'), ' ', c.label)));
}
function areaChip(a) { const A = AREAS[a]; return h('span', { class: `achip a-${a}` }, `${A.name} · ${A.motto}`); }

// ====================== หน้าจอ ======================
function render() {
  const app = $('#app');
  app.replaceChildren();
  const g = G();
  if (!['home', 'about'].includes(ui.view) && !g) ui.view = 'home';
  if (ui.view !== 'home' && g) app.append(navEl());
  const views = { home: homeView, map: mapView, situation: situationView, center: centerView, lesson: lessonView, mission: missionView, mindmap: mindmapView, lab: labView, board: boardView, consult: consultView, report: reportView, teacher: teacherView, about: aboutView };
  app.append(h('main', { class: 'main', id: 'main' }, views[ui.view]()));
  if (ui.focus) { const el = document.getElementById(ui.focus); if (el) el.focus(); ui.focus = null; }
}
function navEl() {
  const g = G();
  const item = (v, icon, label) => h('button', { type: 'button', class: `nav-b${ui.view === v ? ' on' : ''}`, onclick: () => go(v), 'aria-current': ui.view === v ? 'page' : null }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, icon), h('span', {}, label));
  return h('header', { class: 'nav' },
    h('div', { class: 'nav-in' },
      h('button', { type: 'button', class: 'brand', onclick: () => go('map') }, h('span', { class: 'mark', 'aria-hidden': 'true' }, 'ป'), h('span', {}, 'หมู่บ้านนักแต่งประโยค')),
      h('nav', { class: 'nav-items', 'aria-label': 'เมนูหลัก' },
        item('map', '🗺️', 'แผนที่'), item('mindmap', '🧠', 'แผนผังความรู้'), item('lab', '🧪', 'ห้องทดลองประโยค'),
        item('board', '💬', 'กระดานแลกเปลี่ยน'), item('consult', '🦉', 'ปรึกษาครู'), item('report', '📊', 'ผลการเรียน')),
      h('div', { class: 'who' }, h('span', {}, 'กลุ่ม ', h('b', {}, g.name)), h('button', { type: 'button', class: 'link', onclick: () => go('home') }, 'เปลี่ยนกลุ่ม'),
        h('button', { type: 'button', class: 'link', onclick: () => go('teacher') }, 'โหมดครู'),
        h('button', { type: 'button', class: 'link', onclick: () => go('about') }, 'เกี่ยวกับเกม'))));
}

// ---------- หน้าแรก ----------
function homeView() {
  let confirmDel = null;
  const wrap = h('div', { class: 'home' });
  const hero = h('section', { class: 'hero' },
    h('div', { class: 'hero-t' },
      h('p', { class: 'eyebrow' }, 'ภาษาไทย ป.3 · การแต่งประโยค ท 4.1 ป.3/4'),
      h('h1', {}, 'หมู่บ้านนักแต่งประโยค'),
      h('p', { class: 'lead' }, 'ออกเดินทางผ่านโรงเรียน ตลาด และทุ่งนาของบ้านดอนข้าวหอม แก้ปัญหาของคนในหมู่บ้านด้วยประโยคของหนู แล้วฝึกคิดให้มาก คิดให้หลาก คิดให้แปลก และคิดให้ละเอียด'),
      h('div', { class: 'path4' }, ['F', 'X', 'O', 'E'].map((a) => h('span', { class: `achip a-${a}` }, AREAS[a].motto)))),
    h('div', { class: 'hero-art' }, sceneEl('field', { small: true })));
  const list = h('div', { class: 'glist' });
  const draw = () => {
    list.replaceChildren(...(DB.groups.length ? DB.groups.map((g) => {
      const done = MISSIONS.filter((m) => (g.missions[m.id] || {}).submitted).length;
      return h('div', { class: 'gcard' },
        h('button', { type: 'button', class: 'gpick', onclick: () => { DB.cur = g.id; save(); go('map'); } },
          h('b', {}, g.name), h('span', {}, g.members.join(' · ')), h('small', {}, `ภารกิจ ${done}/12`)),
        h('button', { type: 'button', class: 'link danger', onclick: (e) => {
          if (confirmDel !== g.id) { confirmDel = g.id; e.target.textContent = 'แตะอีกครั้งเพื่อลบ'; return; }
          DB.groups = DB.groups.filter((x) => x.id !== g.id); if (DB.cur === g.id) DB.cur = null; save(); draw();
        } }, 'ลบ'));
    }) : [h('p', { class: 'muted' }, 'ยังไม่มีกลุ่ม สร้างกลุ่มแรกด้านขวาได้เลย')]));
  };
  draw();
  const name = h('input', { id: 'g-name', placeholder: 'เช่น กลุ่มดอกคูน', maxlength: 30 });
  const mem = h('input', { id: 'g-mem', placeholder: 'เช่น ข้าวหอม, ต้นกล้า, ใบเตย', maxlength: 120 });
  const form = h('form', { class: 'gform', onsubmit: (e) => {
    e.preventDefault();
    const n = name.value.trim(); const ms = mem.value.split(/[,，\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 6);
    if (!n) { name.focus(); toast('ตั้งชื่อกลุ่มก่อนนะ'); return; }
    const g = { id: newId(), name: n, members: ms.length ? ms : [n], lessons: {}, missions: {}, created: Date.now() };
    DB.groups.push(g); DB.cur = g.id; save(); go('map');
  } },
  h('h2', {}, 'สร้างกลุ่มใหม่'),
  h('label', { for: 'g-name' }, 'ชื่อกลุ่ม'), name,
  h('label', { for: 'g-mem' }, 'สมาชิก (คั่นด้วยจุลภาค เล่นคนเดียวก็ได้)'), mem,
  h('button', { class: 'btn primary', type: 'submit' }, 'เริ่มผจญภัย'));
  wrap.append(hero, h('section', { class: 'home-grid' }, h('div', {}, h('h2', {}, 'เลือกกลุ่มของหนู'), list), form),
    h('div', { class: 'home-foot' }, h('button', { type: 'button', class: 'link', onclick: () => go('about') }, 'เกี่ยวกับเกมและกรอบแนวคิด'),
      h('span', { class: 'muted' }, 'ความคืบหน้าบันทึกไว้ในเบราว์เซอร์ของเครื่องนี้')));
  return wrap;
}

// ---------- แผนที่หมู่บ้าน ----------
function lessonDots(g, c) { return h('span', { class: 'dots', 'aria-label': `ฐานเรียนรู้ที่ผ่าน` }, c.lessons.map((_, j) => h('i', { class: g.lessons[lessonKey(c.id, j)] ? 'on' : '' }))); }
function contentChip(c, done) { return h('span', { class: `cchip c-${c.id}${done ? ' done' : ''}` }, c.topic); }
function mapView() {
  const g = G();
  const wrap = h('div', { class: 'map' });
  wrap.append(h('div', { class: 'pagehead' }, h('h1', {}, 'แผนที่บ้านดอนข้าวหอม'),
    h('p', { class: 'muted' }, 'สถานการณ์ปัญหา 4 ด่าน เรียงตามกระบวนการคิดสร้างสรรค์ แต่ละด่านมีภารกิจครบเนื้อหา 3 ด้าน ส่งภารกิจครบแล้วด่านต่อไปจะเปิด')));
  const road = h('ol', { class: 'road' });
  SITUATIONS.forEach((s, i) => {
    const open = sitUnlocked(g, i);
    road.append(h('li', { class: `stop sit a-${s.area}${open ? '' : ' locked'}` },
      h('button', { type: 'button', class: 'stop-b', disabled: !open, onclick: () => go('situation', { sit: s.id }) },
        h('span', { class: 'stop-no' }, `ด่านที่ ${s.no} · ${AREAS[s.area].motto}`),
        h('span', { class: 'stop-art emoji', 'aria-hidden': 'true' }, s.emoji),
        h('span', { class: 'stop-name' }, s.title),
        h('span', { class: 'stop-topic' }, AREAS[s.area].name),
        h('span', { class: 'mini' }, sitMissions(s.id).map((m) => contentChip(CONTENT(m.content), (g.missions[m.id] || {}).submitted))),
        open ? null : h('span', { class: 'lock' }, '🔒 ส่งภารกิจด่านก่อนหน้าให้ครบก่อน'))));
  });
  wrap.append(road);
  wrap.append(h('section', { class: 'sec' }, h('div', { class: 'sec-h' }, h('h2', {}, 'ศูนย์การเรียนรู้ · เนื้อหา 3 ด้าน'), h('button', { type: 'button', class: 'link', onclick: () => go('mindmap') }, 'ดูแผนผังความรู้')),
    h('div', { class: 'centers' }, CONTENTS.map((c) => h('button', { type: 'button', class: `center-b c-${c.id}`, onclick: () => go('center', { content: c.id }) },
      h('span', { class: 'emoji ce', 'aria-hidden': 'true' }, c.emoji), h('b', {}, c.topic), h('small', {}, `ฐานเรียนรู้ 5 ฐาน`), lessonDots(g, c))))));
  return wrap;
}

// ---------- ด่าน: สถานการณ์ปัญหา + ภารกิจครบ 3 ด้านเนื้อหา ----------
function situationView() {
  const g = G(); const s = SIT(ui.sit); const A = AREAS[s.area];
  const wrap = h('div', { class: `stage sit a-${s.area}` });
  wrap.append(h('div', { class: 'band' }, h('div', {},
    h('p', { class: 'eyebrow' }, `ด่านที่ ${s.no} · ${A.name} (${A.en}) · ${A.motto}`), h('h1', {}, s.title))));
  wrap.append(h('section', { class: 'problem' },
    h('div', { class: 'prob-art' }, sceneEl(s.scene)),
    h('div', { class: 'prob-t' },
      h('h2', {}, h('span', { class: 'tagc' }, 'สถานการณ์ปัญหา')),
      h('p', { class: 'story' }, s.story),
      h('div', { class: 'slips', 'aria-label': 'ตัวอย่างที่ยังมีปัญหา' }, s.broken.map((b) => h('span', { class: 'slip' }, `“${b}”`))),
      h('dl', { class: 'facts' },
        h('dt', {}, 'บทบาทของหนู'), h('dd', {}, s.role),
        h('dt', {}, 'คำถามชวนคิด'), h('dd', { class: 'q' }, s.question),
        h('dt', {}, 'ภารกิจ'), h('dd', {}, s.goal)))));
  wrap.append(h('section', { class: 'sec' },
    h('div', { class: 'sec-h' }, h('h2', {}, `ภารกิจ${A.name} · ครบเนื้อหา 3 ด้าน`)),
    h('div', { class: 'mgrid three' }, sitMissions(s.id).map((m) => {
      const r = g.missions[m.id]; const sc = finalScore(r); const c = CONTENT(m.content);
      return h('button', { type: 'button', class: `mcard c-${c.id}`, onclick: () => go('mission', { mission: m.id }) },
        h('span', { class: 'mc-top' }, contentChip(c, true), h('span', { class: 'ind' }, `ตัวบ่งชี้ ${m.ind}`)),
        h('b', { class: 'mc-title' }, m.title),
        h('span', { class: 'mc-sub' }, `กิลฟอร์ด: ${m.sub}`),
        h('span', { class: 'mc-foot' }, stars(sc), r && r.submitted && r.auto && r.auto.pending && r.teacher == null ? h('small', {}, 'รอครูให้ดาวความแปลกใหม่') : null, m.timer ? h('small', {}, `⏱ ${m.timer / 60} นาที`) : null));
    }))));
  wrap.append(h('section', { class: 'sec' },
    h('div', { class: 'sec-h' }, h('h2', {}, 'ศูนย์การเรียนรู้ที่เกี่ยวข้อง'), h('button', { type: 'button', class: 'link', onclick: () => go('mindmap') }, 'ดูแผนผังความรู้ทั้งหมด')),
    h('div', { class: 'centers' }, sitMissions(s.id).map((m) => { const c = CONTENT(m.content);
      return h('div', { class: `center-l c-${c.id}` }, h('b', {}, c.topic), h('ol', {}, c.lessons.map((l, i) => h('li', {}, h('button', { type: 'button', class: g.lessons[lessonKey(c.id, i)] ? 'done' : '', onclick: () => go('lesson', { content: c.id, lesson: i, from: s.id }) }, l.title)))));
    }))));
  return wrap;
}

// ---------- ศูนย์การเรียนรู้ของเนื้อหาหนึ่งด้าน ----------
function centerView() {
  const g = G(); const c = CONTENT(ui.content);
  return h('div', { class: `stage c-${c.id}` },
    h('button', { type: 'button', class: 'back', onclick: () => go('map') }, '← กลับแผนที่'),
    h('div', { class: 'band' }, h('div', {}, h('p', { class: 'eyebrow' }, `ศูนย์การเรียนรู้ · เนื้อหาด้านที่ ${c.no}`), h('h1', {}, c.topic))),
    h('ol', { class: 'lessons' }, c.lessons.map((l, i) => {
      const done = g.lessons[lessonKey(c.id, i)];
      return h('li', {}, h('button', { type: 'button', class: `lesson-b${done ? ' done' : ''}`, onclick: () => go('lesson', { content: c.id, lesson: i }) },
        h('span', { class: 'ln' }, i + 1), h('span', { class: 'lt' }, l.title), h('span', { class: 'ls' }, done ? '✓ ผ่านแล้ว' : `${l.items.length} ข้อ`)));
    })),
    h('p', { class: 'muted' }, `ใช้ในภารกิจ: ${MISSIONS.filter((m) => m.content === c.id).map((m) => `${SIT(m.area).title} (${m.title})`).join(' · ')}`));
}

// ---------- ฐานเรียนรู้ ----------
function lessonView() {
  const g = G(); const s = CONTENT(ui.content); const L = s.lessons[ui.lesson];
  const back = () => (ui.from ? go('situation', { sit: ui.from }) : go('center', { content: s.id }));
  ui.li ??= 0; ui.ls ??= {};
  const wrap = h('div', { class: `lesson c-${s.id}` });
  wrap.append(h('button', { type: 'button', class: 'back', onclick: back }, ui.from ? `← กลับด่าน${SIT(ui.from).title}` : `← กลับศูนย์การเรียนรู้${s.topic}`));
  wrap.append(h('div', { class: 'pagehead' }, h('p', { class: 'eyebrow' }, `ฐานเรียนรู้ที่ ${ui.lesson + 1} · ${s.topic}`), h('h1', {}, L.title)));
  const card = h('section', { class: 'idea' },
    h('ul', {}, L.idea.map((x) => h('li', { html: md(x) }))),
    h('div', { class: 'example' }, h('span', { class: 'ex-l' }, 'ตัวอย่าง'),
      h('div', { class: 'blks' }, L.example.good.map((x) => blockEl(x))),
      L.example.bad ? h('div', { class: 'bad' }, h('s', {}, L.example.bad)) : null,
      h('p', { class: 'muted' }, L.example.note)),
    h('div', { class: 'legend' }, ['S', 'V', 'O', 'M', 'P'].map((r) => h('span', { class: `blk r-${r} sm` }, ROLE[r].full))));
  wrap.append(card);
  const total = L.items.length;
  const doneAll = ui.li >= total;
  const box = h('section', { class: 'quiz' });
  if (doneAll) {
    g.lessons[lessonKey(s.id, ui.lesson)] = true; save();
    const next = ui.lesson + 1 < s.lessons.length ? ui.lesson + 1 : null;
    box.append(h('div', { class: 'win' }, h('span', { class: 'emoji big', 'aria-hidden': 'true' }, '🌾'), h('h2', {}, 'ผ่านฐานนี้แล้ว!'),
      owl('เก่งมาก ลองนำความรู้นี้ไปใช้ในภารกิจของด่านนี้นะ'),
      h('div', { class: 'row' },
        next != null ? h('button', { type: 'button', class: 'btn primary', onclick: () => go('lesson', { content: s.id, lesson: next, from: ui.from }) }, `ฐานที่ ${next + 1}: ${s.lessons[next].title}`) : null,
        h('button', { type: 'button', class: 'btn', onclick: ui.from ? back : () => go('map') }, ui.from ? 'กลับไปที่ภารกิจ' : 'กลับแผนที่'))));
  } else {
    box.append(h('p', { class: 'qn' }, `ข้อ ${ui.li + 1} จาก ${total}`), quizItem(L.items[ui.li], () => { ui.li++; ui.ls = {}; render(); }));
  }
  wrap.append(box);
  return wrap;
}
function quizItem(it, next) {
  const st = ui.ls; st.tries ??= 0;
  const fb = h('div', { class: 'fb', role: 'status' });
  const okFb = () => { fb.replaceChildren(h('p', { class: 'good' }, '✓ ถูกต้อง! ', it.why), h('button', { type: 'button', class: 'btn primary', onclick: next, id: 'q-next' }, 'ข้อต่อไป')); ui.focus = null; setTimeout(() => $('#q-next') && $('#q-next').focus(), 0); };
  const coachFb = () => { st.tries++; fb.replaceChildren(owl(st.tries === 1 ? 'ยังไม่ใช่ ลองอ่านอีกครั้ง ดูว่าใครเป็นผู้ทำ และทำอะไร' : st.tries === 2 ? 'ลองกลับไปดูตัวอย่างด้านบนอีกครั้ง ส่วนไหนของตัวอย่างที่เหมือนกับข้อนี้' : `คำใบ้: ${it.why}`)); };
  const body = h('div', { class: 'qitem' });
  if (it.scene) body.append(h('div', { class: 'qscene emoji', 'aria-hidden': 'true' }, it.scene));
  body.append(h('h2', { class: 'qq' }, it.q));
  if (it.t === 'choice') {
    const opts = h('div', { class: 'opts' });
    it.opts.forEach((o, i) => opts.append(h('button', { type: 'button', class: 'opt', onclick: (e) => {
      if (i === it.a) { e.currentTarget.classList.add('right'); opts.querySelectorAll('button').forEach((b) => (b.disabled = true)); okFb(); }
      else { e.currentTarget.classList.add('wrong'); e.currentTarget.disabled = true; coachFb(); }
    } }, o)));
    body.append(opts);
  } else if (it.t === 'build') {
    st.pool ??= shuffle(it.blocks.map((b, i) => ({ i, b })));
    st.built ??= [];
    const row = h('div', { class: 'built', 'aria-label': 'ประโยคที่เรียง' });
    const pool = h('div', { class: 'pool' });
    const draw = () => {
      row.replaceChildren(...(st.built.length ? st.built.map((x, j) => blockEl(x.b, { button: true, onclick: () => { st.built.splice(j, 1); st.pool.push(x); draw(); } })) : [h('span', { class: 'muted' }, 'แตะบล็อกด้านล่างเพื่อเรียงประโยค')]));
      pool.replaceChildren(...st.pool.map((x, j) => blockEl(x.b, { button: true, onclick: () => { st.pool.splice(j, 1); st.built.push(x); draw(); } })));
    };
    draw();
    body.append(row, pool, h('button', { type: 'button', class: 'btn primary', onclick: () => {
      if (st.pool.length) { fb.replaceChildren(owl('ใช้บล็อกให้ครบทุกบล็อกก่อนนะ')); return; }
      const said = st.built.map((x) => x.b.split(':')[0]).join(' ');
      if (it.answers.includes(said)) okFb(); else coachFb();
    } }, 'ตรวจประโยค'));
  } else if (it.t === 'sort') {
    st.k ??= 0;
    if (st.k >= it.items.length) { setTimeout(okFb, 0); body.append(h('p', { class: 'good' }, 'จัดกลุ่มครบแล้ว')); }
    else {
      const [word, bin] = it.items[st.k];
      body.append(h('p', { class: 'muted' }, `คำที่ ${st.k + 1} จาก ${it.items.length}`), h('div', { class: 'sortword' }, word),
        h('div', { class: 'bins' }, it.bins.map((b, i) => h('button', { type: 'button', class: 'btn', onclick: () => {
          if (i === bin) { st.k++; render(); } else coachFb();
        } }, b))));
    }
  }
  body.append(fb);
  return body;
}

// ---------- ภารกิจ ----------
let timerIv = 0;
function stopTimer() { clearInterval(timerIv); timerIv = 0; }
function missionView() {
  const g = G(); const m = MISSION(ui.mission); const s = SIT(m.area); const c = CONTENT(m.content); const r = rec(g, m.id); const d = r.data; const A = AREAS[m.area];
  ui.help ??= null;
  // เติมข้อความตั้งต้นจากภารกิจก่อนหน้า
  for (const f of m.fields) if (f.prefill && d[f.k] == null) { const [mid, k] = f.prefill.split('.'); const v = (((g.missions[mid] || {}).data) || {})[k]; if (v) d[f.k] = v; }
  const wrap = h('div', { class: `mission c-${c.id} a-${m.area}` });
  wrap.append(h('button', { type: 'button', class: 'back', onclick: () => go('situation', { sit: s.id }) }, `← กลับด่าน${s.title}`));
  wrap.append(h('div', { class: 'mhead' },
    h('div', {}, h('p', { class: 'eyebrow' }, `ด่านที่ ${s.no} ${s.title} · เนื้อหา: ${c.topic}`), h('h1', {}, m.title)),
    h('div', { class: 'mmeta' }, areaChip(m.area), h('span', { class: 'ind' }, `ตัวบ่งชี้ ${m.ind}`), h('span', { class: 'ind' }, `กิลฟอร์ด: ${m.sub}`))));
  const left = h('div', { class: 'mleft' },
    sceneEl(m.scene),
    h('div', { class: 'prompt', html: md(m.prompt) }),
    h('div', { class: `tip a-${m.area}` }, h('b', {}, `เคล็ดคิด · ${A.motto}`), h('ul', {}, A.tips.map((t) => h('li', {}, t)))),
    owl(m.coach));
  const right = h('div', { class: 'mright' });
  if (m.timer) right.append(timerEl(m, r));
  const live = {};
  const refresh = () => {
    const res = scoreOf(m, g);
    for (const f of m.fields) if (live[f.k]) live[f.k].replaceChildren(...res.checks.filter((c) => c.k === f.k).map((c) => badge(c.ok, c.label)));
    const general = res.checks.filter((c) => !c.k);
    $('#mchecks') && $('#mchecks').replaceChildren(...(general.length ? [checkList(general)] : []));
    save();
  };
  const timeUp = m.timer && r.timeUp;
  m.fields.forEach((f, i) => {
    if (f.group && (i === 0 || m.fields[i - 1].group !== f.group)) right.append(h('h3', { class: 'fgroup' }, f.group));
    right.append(fieldEl(m, f, d, refresh, live, timeUp));
  });
  right.append(h('div', { class: 'mchecks-w' }, h('h3', {}, 'ตรวจงานของหนู'), h('div', { id: 'mchecks' })));
  right.append(helpEl(m, r));
  right.append(submitEl(m, r, g));
  wrap.append(h('div', { class: 'mbody' }, left, right));
  setTimeout(refresh, 0);
  return wrap;
}
function timerEl(m, r) {
  const show = h('b', { class: 'tnum' });
  const box = h('div', { class: 'timer' });
  const left = () => Math.max(0, Math.round(((r.tEnd || 0) - Date.now()) / 1000));
  const fmt = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  const tick = () => {
    const n = left(); show.textContent = fmt(n);
    if (r.tEnd && n === 0 && !r.timeUp) { r.timeUp = true; save(); stopTimer(); toast('หมดเวลา! ตรวจงานแล้วกดส่งภารกิจได้เลย'); render(); }
  };
  if (r.timeUp) { box.append(h('span', {}, '⏱ หมดเวลาแล้ว'), h('button', { type: 'button', class: 'link', onclick: () => { r.tEnd = 0; r.timeUp = false; save(); render(); } }, 'เริ่มจับเวลาใหม่')); return box; }
  if (!r.tEnd) {
    show.textContent = fmt(m.timer);
    box.append(h('span', {}, '⏱ เวลา'), show, h('button', { type: 'button', class: 'btn gold small', onclick: () => { r.tEnd = Date.now() + m.timer * 1000; save(); render(); } }, 'เริ่มจับเวลา'));
    return box;
  }
  tick(); stopTimer(); timerIv = setInterval(tick, 500);
  box.append(h('span', {}, '⏱ เหลือเวลา'), show);
  return box;
}
function fieldEl(m, f, d, refresh, live, timeUp) {
  const id = `f-${m.id}-${f.k}`;
  const wrap = h('div', { class: `field t-${f.type}` });
  const fc = h('div', { class: 'fchecks' }); live[f.k] = fc;
  const label = h('label', { for: id, class: 'flabel' }, f.label);
  if (f.type === 'sentences' || f.type === 'phrases') {
    d[f.k] ||= [];
    const inp = h('input', { id, placeholder: f.ph, disabled: timeUp, autocomplete: 'off' });
    const add = () => {
      const t = inp.value.trim(); if (!t) return;
      d[f.k].push(f.type === 'sentences' ? (() => { const it = makeItem(t); return { text: t, tags: it.tags }; })() : { text: t });
      ui.focus = id; save(); render();
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    const list = h('ol', { class: 'ilist' });
    d[f.k].forEach((it, j) => {
      const del = h('button', { type: 'button', class: 'x', 'aria-label': 'ลบ', onclick: () => { d[f.k].splice(j, 1); save(); render(); } }, '×');
      if (f.type === 'sentences') {
        const item = makeItem(it.text, it);
        const st = structure(item); const ty = sType(it.text);
        const meta = h('div', { class: 'imeta' });
        const chips = h('div');
        const draw = () => {
          const s2 = structure(item);
          chips.replaceChildren(chipRow(item, () => { it.tags = item.tags; draw(); refresh(); }));
          meta.replaceChildren(badge(s2.ok, s2.ok ? `ได้ใจความ (${s2.parts} ส่วน)` : 'ยังขาด ใคร หรือ ทำอะไร'), badge(ty === 'statement' ? true : null, `ประโยค${TYPE_NAME[ty]}`));
        };
        draw(); void st;
        list.append(h('li', {}, h('div', { class: 'irow' }, h('span', { class: 'itext' }, it.text), del), chips, meta));
      } else {
        const t = it.text;
        list.append(h('li', {}, h('div', { class: 'irow' }, h('span', { class: 'itext' }, t), del),
          h('div', { class: 'imeta' }, badge(RX.help.test(t), RX.help.test(t) ? 'ขอความช่วยเหลือ' : 'ยังไม่ใช่คำขอ'),
            badge(RX.polite.test(t) ? true : null, RX.polite.test(t) ? 'สุภาพ' : 'ยังไม่มีคำลงท้าย'),
            RX.dialect.test(t) ? badge(null, 'ภาษาถิ่น') : null, RX.rude.test(t) ? badge(false, 'คำไม่สุภาพ') : null)));
      }
    });
    wrap.append(label, h('div', { class: 'addrow' }, inp, h('button', { type: 'button', class: 'btn primary', onclick: add, disabled: timeUp }, 'เพิ่ม')),
      h('p', { class: 'count' }, `${d[f.k].length} ข้อ`), list);
  } else if (f.type === 'buckets') {
    d[f.k] ||= f.bins.map(() => []);
    const inp = h('input', { id, placeholder: f.ph, disabled: timeUp, autocomplete: 'off' });
    const add = (bi) => { const t = inp.value.trim(); if (!t) return; d[f.k][bi].push(t); ui.focus = id; save(); render(); };
    wrap.append(label, h('div', { class: 'addrow' }, inp), h('div', { class: 'binbtns' }, f.bins.map((b, bi) => h('button', { type: 'button', class: 'btn', disabled: timeUp, onclick: () => add(bi) }, `+ ${b}`))),
      h('div', { class: 'bcols' }, f.bins.map((b, bi) => h('div', { class: 'bcol' }, h('h4', {}, `${b} (${d[f.k][bi].length})`),
        h('div', { class: 'bwords' }, d[f.k][bi].map((w, j) => h('span', { class: 'bword' }, w, h('button', { type: 'button', class: 'x', 'aria-label': `ลบ ${w}`, onclick: () => { d[f.k][bi].splice(j, 1); save(); render(); } }, '×'))))))));
  } else if (f.type === 'sentence') {
    const it = d[f.k] && d[f.k].text != null ? d[f.k] : null;
    const inp = h('input', { id, placeholder: f.ph || '', value: it ? it.text : '', autocomplete: 'off' });
    const chips = h('div');
    const draw = () => {
      const cur = d[f.k];
      if (!cur || !cur.text.trim()) { chips.replaceChildren(); return; }
      const item = makeItem(cur.text, cur);
      chips.replaceChildren(chipRow(item, () => { cur.tags = item.tags; draw(); refresh(); }));
    };
    inp.addEventListener('input', () => { const old = d[f.k]; const item = makeItem(inp.value, old); d[f.k] = { text: inp.value, tags: item.tags }; draw(); refresh(); });
    draw();
    wrap.append(label, inp, chips, fc);
  } else if (f.type === 'line' || f.type === 'area') {
    const inp = f.type === 'line' ? h('input', { id, placeholder: f.ph || '', autocomplete: 'off' }) : h('textarea', { id, rows: f.rows || 3, placeholder: f.ph || '' });
    inp.value = d[f.k] || '';
    inp.addEventListener('input', () => { d[f.k] = inp.value; refresh(); });
    wrap.append(label, inp, fc);
  } else if (f.type === 'draw') {
    wrap.append(h('span', { class: 'flabel' }, f.label), drawPad(d, f.k, refresh), fc);
  }
  if (!wrap.contains(fc)) wrap.append(fc);
  return wrap;
}
function drawPad(d, k, refresh) {
  const cv = h('canvas', { width: 640, height: 400, class: 'pad', 'aria-label': 'กระดานวาดภาพ' });
  const ctx = cv.getContext('2d');
  const COLORS = ['#2b2140', '#c8322b', '#e8a321', '#3f7d3a', '#2f5fae', '#b0479a', '#ffffff'];
  let color = COLORS[0], size = 6, drawing = false, last = null;
  const bg = () => { ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, cv.width, cv.height); };
  bg();
  if (d[k]) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = d[k]; }
  const pos = (e) => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * cv.width / b.width, (e.clientY - b.top) * cv.height / b.height]; };
  cv.addEventListener('pointerdown', (e) => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing) return; const p = pos(e);
    ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(...p); ctx.stroke(); last = p;
  });
  const end = () => { if (!drawing) return; drawing = false; d[k] = cv.toDataURL('image/png'); refresh(); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  const sw = h('div', { class: 'swatches' }, COLORS.map((c) => {
    const b = h('button', { type: 'button', class: 'sw', style: `background:${c}`, 'aria-label': `สี ${c}`, onclick: () => { color = c; sw.querySelectorAll('.sw').forEach((x) => x.classList.toggle('on', x === b)); } });
    if (c === color) b.classList.add('on');
    return b;
  }),
  h('button', { type: 'button', class: 'btn small', onclick: () => { size = size === 6 ? 16 : 6; toast(size === 6 ? 'พู่กันเล็ก' : 'พู่กันใหญ่'); } }, 'ขนาดพู่กัน'),
  h('button', { type: 'button', class: 'btn small', onclick: () => { bg(); d[k] = null; refresh(); } }, 'ล้าง'));
  return h('div', { class: 'padw' }, cv, sw);
}
// ---------- ฐานการช่วยเหลือ 4 แบบ ----------
function helpEl(m, r) {
  const s = CONTENT(m.content);
  const kinds = [
    ['concept', '💡', 'ความคิดรวบยอด', () => [h('p', {}, m.help.concept), h('div', { class: 'row' }, m.help.lessons.map((i) => h('button', { type: 'button', class: 'btn small', onclick: () => go('lesson', { content: s.id, lesson: i, from: m.area }) }, `ทบทวนฐาน ${i + 1}: ${s.lessons[i].title}`)))]],
    ['think', '🤔', 'การคิด', () => [h('p', {}, 'ถามตัวเองทีละข้อ:'), h('ul', {}, THINK_HELP[m.area].map((q) => h('li', {}, q)))]],
    ['process', '🧭', 'กระบวนการ', () => [h('ul', {}, [...new Set(m.fields.map((f) => f.type))].flatMap((t) => PROCESS_HELP[t]).map((x) => h('li', {}, x))),
      h('button', { type: 'button', class: 'btn small', onclick: () => go('lab') }, 'เปิดห้องทดลองประโยค')]],
    ['strategy', '♟️', 'กลยุทธ์', () => [h('p', {}, m.help.strategy)]],
  ];
  const panel = h('div', { class: 'hpanel', role: 'region', 'aria-live': 'polite' });
  const btns = h('div', { class: 'hbtns' });
  const open = (k) => {
    ui.help = ui.help === k ? null : k;
    btns.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.k === ui.help ? 'true' : 'false'));
    const K = kinds.find((x) => x[0] === ui.help);
    panel.replaceChildren(...(K ? [h('h4', {}, `${K[1]} ฐานช่วยเหลือ${K[2]}`), ...K[3]()] : []));
    if (K) { r.helps[k] = (r.helps[k] || 0) + 1; save(); }
  };
  kinds.forEach(([k, icon, label]) => btns.append(h('button', { type: 'button', class: 'hb', 'data-k': k, 'aria-pressed': 'false', onclick: () => open(k) }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, icon), label)));
  return h('div', { class: 'help' }, h('h3', {}, 'ฐานการช่วยเหลือ'), h('p', { class: 'muted' }, 'ติดตรงไหน เลือกความช่วยเหลือที่ต้องการ'), btns, panel,
    h('button', { type: 'button', class: 'link', onclick: () => go('consult', { about: m.id }) }, '🦉 ยังไม่เข้าใจ? ปรึกษาครู'));
}
function submitEl(m, r, g) {
  const box = h('div', { class: 'submit' });
  const result = () => {
    const sc = finalScore(r); const res = r.auto;
    const firstMiss = (res.checks || []).find((c) => !c.ok);
    box.replaceChildren(h('div', { class: 'result' },
      h('div', { class: 'res-top' }, h('h3', {}, 'ส่งภารกิจแล้ว'), stars(sc)),
      res.pending && r.teacher == null ? h('p', { class: 'muted' }, 'ภารกิจการคิดริเริ่ม: ระบบตรวจความครบถ้วนให้ 1 ดาว ครูหรือเพื่อนจะให้ดาวความแปลกใหม่เพิ่ม') : null,
      r.teacher != null ? h('p', { class: 'muted' }, `ครูให้ ${r.teacher} ดาว`) : null,
      owl(firstMiss ? `ทำได้ดีแล้ว ถ้าจะให้ดียิ่งขึ้น: ${firstMiss.label}` : 'ยอดเยี่ยม! ผ่านทุกข้อตรวจเลย ลองไปดูคำตอบของกลุ่มอื่นในกระดานแลกเปลี่ยน แล้วให้ความเห็นเพื่อนด้วยนะ', 'คำแนะนำจากครูฮูก'),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn primary', onclick: () => shareToBoard(m, r, g) }, '💬 แชร์ลงกระดานแลกเปลี่ยน'),
        h('button', { type: 'button', class: 'btn', onclick: () => { r.submitted = 0; save(); render(); } }, 'แก้ไขแล้วส่งใหม่'),
        h('button', { type: 'button', class: 'btn', onclick: () => go('situation', { sit: m.area }) }, 'กลับไปที่ด่าน')),
      DB.teacher ? teacherScore(m, r, () => result()) : null));
  };
  if (r.submitted) { result(); return box; }
  box.append(h('button', { type: 'button', class: 'btn gold big', onclick: () => {
    r.auto = scoreOf(m, g); r.submitted = Date.now(); stopTimer(); save(); result();
    box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  } }, 'ส่งภารกิจ'));
  return box;
}
function teacherScore(m, r, after) {
  return h('div', { class: 'tscore' }, h('h4', {}, `ครูให้คะแนน (${AREAS[m.area].name})`),
    h('div', { class: 'tsbtns' }, RUBRIC[m.area].map((txt, n) => h('button', { type: 'button', class: `tsb${r.teacher === n ? ' on' : ''}`, onclick: () => { r.teacher = n; save(); after(); } }, h('b', {}, `${n} ดาว`), h('small', {}, txt))),
      h('button', { type: 'button', class: 'link', onclick: () => { r.teacher = null; save(); after(); } }, 'ใช้คะแนนจากระบบ')));
}
function answerText(m, d) {
  const out = [];
  for (const f of m.fields) {
    const v = d[f.k];
    if (v == null) continue;
    if (f.type === 'sentences' || f.type === 'phrases') out.push(...v.map((x, i) => `${i + 1}. ${x.text}`));
    else if (f.type === 'buckets') f.bins.forEach((b, i) => v[i] && v[i].length && out.push(`${b}: ${v[i].join(', ')}`));
    else if (f.type === 'sentence') v.text && out.push(`${f.label}: ${v.text}`);
    else if (f.type === 'draw') out.push('[ภาพวาด]');
    else if (String(v).trim()) out.push(m.fields.length > 1 ? `${f.label}: ${v}` : String(v));
  }
  return out.join('\n');
}
function shareToBoard(m, r, g) {
  const text = answerText(m, r.data);
  if (!text.trim()) { toast('ยังไม่มีคำตอบให้แชร์'); return; }
  DB.board.unshift({ id: newId(), gid: g.id, gname: g.name, by: g.members.join(', '), mid: m.id, text, img: r.data.draw || null, ts: Date.now(), stars: [], replies: [] });
  save(); toast('แชร์ลงกระดานแล้ว'); go('board', { filter: m.id });
}

// ---------- แผนผังความรู้ ----------
function mindmapView() {
  const g = G();
  return h('div', { class: 'mindmap' },
    h('div', { class: 'pagehead' }, h('h1', {}, 'แผนผังความรู้'), h('p', { class: 'muted' }, 'เนื้อหาทั้งหมดของเรื่องการแต่งประโยค แตะหัวข้อเพื่อไปที่ฐานเรียนรู้')),
    h('div', { class: 'mm' },
      h('div', { class: 'mm-root' }, h('b', {}, 'การแต่งประโยค'), h('small', {}, 'ตามตัวชี้วัด ท 4.1 ป.3/4')),
      h('div', { class: 'mm-branches' }, CONTENTS.map((c) => h('div', { class: `mm-br c-${c.id}` },
        h('div', { class: 'mm-node' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, c.emoji), h('b', {}, c.topic), h('small', {}, `เนื้อหาด้านที่ ${c.no}`)),
        h('ol', { class: 'mm-leaves' }, c.lessons.map((l, i) => h('li', {}, h('button', { type: 'button', class: g.lessons[lessonKey(c.id, i)] ? 'done' : '',
          onclick: () => go('lesson', { content: c.id, lesson: i }) }, l.title)))))))),
    h('section', { class: 'mm-creative' }, h('h2', {}, 'ใช้ความรู้ฝึกการคิดสร้างสรรค์ใน 4 สถานการณ์ปัญหา'),
      h('div', { class: 'proc' }, SITUATIONS.map((st) => h('div', { class: `pstep a-${st.area}` }, h('b', {}, AREAS[st.area].name), h('small', {}, `ด่านที่ ${st.no} ${st.title}`), h('small', {}, AREAS[st.area].sub.join(' · ')))))));
}

// ---------- ห้องทดลองประโยค (เครื่องมือทางปัญญา) ----------
function labView() {
  ui.lab ??= [];
  ui.org ??= { S: '', SM: '', V: '', O: '', how: '', where: '', when: '' };
  const wrap = h('div', { class: 'lab' });
  wrap.append(h('div', { class: 'pagehead' }, h('h1', {}, 'ห้องทดลองประโยค'), h('p', { class: 'muted' }, 'ลองเรียงบล็อกคำ ตรวจว่าเป็นประโยคที่ถูกต้องหรือไม่ แล้วลองสลับที่ดูว่าความหมายเปลี่ยนไปอย่างไร')));
  const built = h('div', { class: 'built big' });
  const res = h('div', { class: 'labres', role: 'status' });
  const draw = () => {
    built.replaceChildren(...(ui.lab.length ? ui.lab.map((b, j) => blockEl([b.w, b.r], { button: true, onclick: () => { ui.lab.splice(j, 1); draw(); } })) : [h('span', { class: 'muted' }, 'แตะบล็อกด้านล่างเพื่อวางลงแท่นประโยค แตะบล็อกบนแท่นเพื่อเอาออก')]));
    const c = checkBlocks(ui.lab);
    res.replaceChildren(ui.lab.length ? h('div', {}, h('p', { class: 'said' }, c.text),
      c.ok ? h('p', { class: 'good' }, `✓ เป็นประโยค${TYPE_NAME[c.type]}${c.parts ? ` แบบ ${c.parts} ส่วน` : ''} ถูกต้อง`) : h('ul', { class: 'checks' }, c.issues.map((x) => h('li', { class: 'no' }, '○ ', x)))) : '');
  };
  const pal = h('div', { class: 'palette' }, Object.entries(LAB_WORDS).map(([r, ws]) => h('div', { class: 'palrow' },
    h('span', { class: 'pallab' }, ROLE[r].full), h('div', { class: 'blks' }, ws.map((w) => blockEl([w, r], { button: true, onclick: () => { if (ui.lab.length < 10) { ui.lab.push({ w, r }); draw(); } } }))))));
  draw();
  wrap.append(h('section', { class: 'sec' }, h('h2', {}, 'แท่นเรียงประโยค'), built, h('div', { class: 'row' },
    h('button', { type: 'button', class: 'btn small', onclick: () => { ui.lab.reverse(); draw(); } }, 'สลับลำดับทั้งหมด'),
    h('button', { type: 'button', class: 'btn small', onclick: () => { ui.lab = []; draw(); } }, 'ล้างแท่น')), res, pal));
  // ผังจัดความคิด
  const o = ui.org;
  const prev = h('p', { class: 'said' });
  const copyBox = h('textarea', { class: 'copybox', rows: 2, hidden: true, 'aria-label': 'ข้อความสำหรับคัดลอก' });
  const upd = () => { prev.textContent = [o.when, o.S, o.SM, o.V, o.O, o.how, o.where].filter((x) => x.trim()).join('') || 'ประโยคจะปรากฏที่นี่'; };
  const rows = [['S', 'ใคร', 'ควาย'], ['SM', 'ใครแบบไหน', 'สีดำเขาโค้ง'], ['V', 'ทำอะไร', 'เดินหาย'], ['O', 'กับใครหรืออะไร', ''], ['how', 'อย่างไร', 'ไปอย่างเงียบ ๆ'], ['where', 'ที่ไหน', 'ริมหนองน้ำ'], ['when', 'เมื่อไร', 'เมื่อวานตอนเย็น']];
  upd();
  wrap.append(h('section', { class: 'sec org' }, h('h2', {}, 'ผังจัดความคิด'), h('p', { class: 'muted' }, 'รวบรวมความคิดทีละช่อง แล้วดูว่าประโยคเต็มเป็นอย่างไร ใช้วางแผนก่อนเขียนภารกิจ'),
    h('div', { class: 'orggrid' }, rows.map(([k, lab, ph]) => h('label', { class: `orgc k-${k}` }, h('span', {}, lab), h('input', { id: `org-${k}`, value: o[k], placeholder: ph ? `เช่น ${ph}` : '', oninput: (e) => { o[k] = e.target.value; upd(); } })))),
    h('div', { class: 'orgout' }, prev, h('button', { type: 'button', class: 'btn small', onclick: () => copyText(prev.textContent, copyBox) }, 'คัดลอกประโยค')), copyBox));
  return wrap;
}

// ---------- กระดานแลกเปลี่ยน ----------
const STARTERS = ['ฉันชอบตรงที่…', 'ลองเพิ่ม… ดูไหม', 'ถ้าเปลี่ยน… จะเป็นอย่างไร', 'ความคิดของฉันต่างออกไป คือ…'];
function boardView() {
  const g = G();
  ui.filter ??= 'all';
  ui.me ??= g.members[0];
  const wrap = h('div', { class: 'board' });
  wrap.append(h('div', { class: 'pagehead' }, h('h1', {}, 'กระดานแลกเปลี่ยนเรียนรู้'),
    h('p', { class: 'muted' }, 'แชร์คำตอบ ดูวิธีคิดของเพื่อนหลายแบบ ให้ดาว และตอบกลับด้วยประโยคชวนคิด')));
  const sel = h('select', { id: 'b-filter', onchange: (e) => { ui.filter = e.target.value; render(); } },
    h('option', { value: 'all' }, 'ทุกภารกิจ'), MISSIONS.map((m) => h('option', { value: m.id, selected: ui.filter === m.id }, `${SIT(m.area).title} · ${m.title}`)));
  const me = h('select', { id: 'b-me', onchange: (e) => { ui.me = e.target.value; } }, [...g.members, ...(DB.teacher ? ['ครู'] : [])].map((n) => h('option', { value: n, selected: ui.me === n }, n)));
  wrap.append(h('div', { class: 'bbar' }, h('label', { for: 'b-filter' }, 'ดูภารกิจ'), sel, h('label', { for: 'b-me' }, 'ฉันคือ'), me));
  // เขียนโพสต์ใหม่
  const ta = h('textarea', { id: 'b-new', rows: 2, placeholder: 'เขียนความคิด คำถาม หรือคำตอบที่อยากแบ่งปัน' });
  wrap.append(h('form', { class: 'bnew', onsubmit: (e) => {
    e.preventDefault(); const t = ta.value.trim(); if (!t) return;
    DB.board.unshift({ id: newId(), gid: g.id, gname: g.name, by: ui.me, mid: ui.filter === 'all' ? null : ui.filter, text: t, ts: Date.now(), stars: [], replies: [] });
    save(); render();
  } }, ta, h('button', { class: 'btn primary', type: 'submit' }, 'โพสต์')));
  const posts = DB.board.filter((p) => ui.filter === 'all' || p.mid === ui.filter);
  if (ui.filter !== 'all') {
    const ways = new Set(posts.filter((p) => p.mid === ui.filter).map((p) => norm(p.text))).size;
    wrap.append(h('p', { class: 'ways' }, `ภารกิจนี้มีวิธีคิดที่แตกต่างกัน ${ways} แบบ`));
  }
  wrap.append(h('div', { class: 'posts' }, posts.length ? posts.map((p) => postEl(p, g)) : h('p', { class: 'muted' }, 'ยังไม่มีโพสต์ ส่งภารกิจแล้วกด "แชร์ลงกระดานแลกเปลี่ยน" ได้เลย')));
  return wrap;
}
function postEl(p, g) {
  const m = p.mid && MISSION(p.mid);
  const starred = p.stars.includes(`${g.id}:${ui.me}`);
  const rta = h('input', { placeholder: 'ตอบกลับ…', id: `r-${p.id}` });
  return h('article', { class: 'post' },
    h('div', { class: 'ph' }, h('b', {}, p.gname), h('span', { class: 'muted' }, p.by), m ? h('span', { class: `achip tiny a-${m.area}` }, m.title) : null),
    p.img ? h('img', { src: p.img, alt: 'ภาพวาดประกอบคำตอบ', class: 'pimg' }) : null,
    h('p', { class: 'ptext' }, p.text),
    h('div', { class: 'pact' },
      h('button', { type: 'button', class: `starb${starred ? ' on' : ''}`, 'aria-pressed': starred ? 'true' : 'false', onclick: () => {
        const k = `${g.id}:${ui.me}`; p.stars = starred ? p.stars.filter((x) => x !== k) : [...p.stars, k]; save(); render();
      } }, `★ ${p.stars.length}`),
      g.id === p.gid || DB.teacher ? h('button', { type: 'button', class: 'link danger', onclick: () => { DB.board = DB.board.filter((x) => x !== p); save(); render(); } }, 'ลบ') : null),
    h('ul', { class: 'replies' }, p.replies.map((r) => h('li', { class: r.teacher ? 'teacher' : '' }, h('b', {}, r.teacher ? '🦉 ครู' : `${r.gname} · ${r.by}`), ' ', r.text))),
    h('div', { class: 'starters' }, STARTERS.map((s) => h('button', { type: 'button', class: 'chip', onclick: () => { rta.value = s.replace('…', ' '); rta.focus(); } }, s))),
    h('form', { class: 'rform', onsubmit: (e) => {
      e.preventDefault(); const t = rta.value.trim(); if (!t) return;
      p.replies.push({ by: ui.me, gname: g.name, text: t, teacher: ui.me === 'ครู', ts: Date.now() }); save(); render();
    } }, rta, h('button', { class: 'btn small', type: 'submit' }, 'ตอบ')));
}

// ---------- ปรึกษาครู (การโค้ช) ----------
function consultView() {
  const g = G();
  const mine = DB.consult.filter((c) => c.gid === g.id);
  const sel = h('select', { id: 'c-about' }, h('option', { value: '' }, 'เรื่องทั่วไป'), MISSIONS.map((m) => h('option', { value: m.id, selected: ui.about === m.id }, `${SIT(m.area).title} · ${m.title}`)));
  const ta = h('textarea', { id: 'c-q', rows: 3, placeholder: 'หนูไม่เข้าใจตรงไหน อยากให้ครูช่วยเรื่องอะไร' });
  return h('div', { class: 'consult' },
    h('div', { class: 'pagehead' }, h('h1', {}, 'ปรึกษาครู')),
    owl('ครูฮูกจะไม่บอกคำตอบตรง ๆ แต่จะช่วยตั้งคำถามให้หนูคิดต่อได้ ถ้ายังติดอยู่ เขียนถามครูไว้ที่นี่ ครูจะตอบในโหมดครู'),
    h('form', { class: 'cform', onsubmit: (e) => {
      e.preventDefault(); const t = ta.value.trim(); if (!t) return;
      DB.consult.unshift({ id: newId(), gid: g.id, gname: g.name, mid: sel.value || null, q: t, a: '', ts: Date.now() }); save(); toast('ส่งคำถามถึงครูแล้ว'); render();
    } }, h('label', { for: 'c-about' }, 'เรื่องที่อยากปรึกษา'), sel, h('label', { for: 'c-q' }, 'คำถามของหนู'), ta, h('button', { class: 'btn primary', type: 'submit' }, 'ส่งคำถาม')),
    h('h2', {}, 'คำถามของกลุ่ม'),
    mine.length ? h('ul', { class: 'qlist' }, mine.map((c) => h('li', {},
      h('p', {}, h('b', {}, 'ถาม: '), c.q, c.mid ? h('span', { class: 'muted' }, ` (${MISSION(c.mid).title})`) : null),
      h('p', { class: c.a ? 'ans' : 'muted' }, c.a ? [h('b', {}, '🦉 ครูตอบ: '), c.a] : 'รอครูตอบ')))) : h('p', { class: 'muted' }, 'ยังไม่มีคำถาม'));
}

// ---------- ผลการเรียน ----------
function reportView() {
  const g = G();
  const rows = MISSIONS.slice().sort((a, b) => a.ind.localeCompare(b.ind));
  const total = rows.reduce((s, m) => s + (finalScore(g.missions[m.id]) || 0), 0);
  const helps = MISSIONS.reduce((s, m) => s + Object.values(((g.missions[m.id] || {}).helps) || {}).reduce((a, b) => a + b, 0), 0);
  const ls = CONTENTS.reduce((s, c) => s + c.lessons.filter((_, i) => g.lessons[lessonKey(c.id, i)]).length, 0);
  const copyBox = h('textarea', { class: 'copybox', rows: 6, hidden: true, 'aria-label': 'ข้อมูลสำหรับคัดลอก' });
  const badges = SITUATIONS.filter((s) => sitMissions(s.id).every((m) => (g.missions[m.id] || {}).submitted));
  return h('div', { class: 'report' },
    h('div', { class: 'pagehead' }, h('h1', {}, `ผลการเรียนของกลุ่ม${g.name}`), h('p', { class: 'muted' }, g.members.join(' · '))),
    h('div', { class: 'kpis' },
      h('div', { class: 'kpi' }, h('b', {}, `${total}/36`), h('span', {}, 'ดาวความคิดสร้างสรรค์')),
      h('div', { class: 'kpi' }, h('b', {}, `${ls}/15`), h('span', {}, 'ฐานเรียนรู้ที่ผ่าน')),
      h('div', { class: 'kpi' }, h('b', {}, helps), h('span', {}, 'ครั้งที่ใช้ฐานช่วยเหลือ')),
      h('div', { class: 'kpi' }, h('b', {}, badges.length ? badges.map((s) => s.badge).join(' · ') : '—'), h('span', {}, 'เหรียญที่ได้'))),
    h('h2', {}, 'คะแนนตามตัวบ่งชี้การคิดสร้างสรรค์'),
    h('div', { class: 'tablew' }, h('table', {},
      h('thead', {}, h('tr', {}, ['ตัวบ่งชี้', 'ด้าน', 'ภารกิจ', 'ระบบ', 'ครู', 'ผล'].map((x) => h('th', {}, x)))),
      h('tbody', {}, rows.map((m) => { const r = g.missions[m.id];
        return h('tr', {}, h('td', { class: 'num' }, m.ind), h('td', {}, AREAS[m.area].name), h('td', {}, `${SIT(m.area).title} · ${m.title}`),
          h('td', { class: 'num' }, r && r.submitted ? r.auto.score : '—'), h('td', { class: 'num' }, r && r.teacher != null ? r.teacher : '—'), h('td', {}, stars(finalScore(r))));
      })))),
    h('h2', {}, 'สรุปรายด้าน'),
    h('div', { class: 'areas' }, ['F', 'X', 'O', 'E'].map((a) => {
      const ms = MISSIONS.filter((m) => m.area === a); const sc = ms.reduce((s, m) => s + (finalScore(g.missions[m.id]) || 0), 0);
      return h('div', { class: `abar a-${a}` }, h('span', {}, AREAS[a].name), h('div', { class: 'bar' }, h('i', { style: `width:${(sc / 9) * 100}%` })), h('b', { class: 'num' }, `${sc}/9`));
    })),
    h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn', onclick: () => copyText(classCSV(), copyBox) }, 'คัดลอกผลทั้งห้อง (CSV)'),
      h('button', { type: 'button', class: 'btn', onclick: () => go('teacher') }, 'โหมดครู')), copyBox);
}
function classCSV() {
  const inds = Object.keys(INDICATORS);
  const byInd = Object.fromEntries(MISSIONS.map((m) => [m.ind, m.id]));
  const head = ['กลุ่ม', 'สมาชิก', ...inds, 'รวม', 'ฐานเรียนรู้', 'ใช้ฐานช่วยเหลือ'];
  const rows = DB.groups.map((g) => {
    const sc = inds.map((i) => finalScore(g.missions[byInd[i]]));
    const helps = MISSIONS.reduce((s, m) => s + Object.values(((g.missions[m.id] || {}).helps) || {}).reduce((a, b) => a + b, 0), 0);
    const ls = Object.keys(g.lessons).length;
    return [g.name, g.members.join(' '), ...sc.map((x) => (x == null ? '' : x)), sc.reduce((s, x) => s + (x || 0), 0), ls, helps];
  });
  return [head, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
}

// ---------- โหมดครู ----------
function teacherView() {
  let confirmReset = false;
  const wrap = h('div', { class: 'teacher' });
  wrap.append(h('div', { class: 'pagehead' }, h('h1', {}, 'โหมดครู'), h('p', { class: 'muted' }, 'ให้ดาวตามเกณฑ์ ตอบคำปรึกษา และดูคำตอบของทุกกลุ่มในเครื่องนี้')));
  wrap.append(h('div', { class: 'toggles' },
    h('label', { class: 'tog' }, h('input', { type: 'checkbox', id: 't-on', checked: DB.teacher, onchange: (e) => { DB.teacher = e.target.checked; save(); render(); } }), ' แสดงปุ่มให้คะแนนของครูในหน้าภารกิจ และตอบกระดานในนาม "ครู"'),
    h('label', { class: 'tog' }, h('input', { type: 'checkbox', id: 't-unlock', checked: DB.unlockAll, onchange: (e) => { DB.unlockAll = e.target.checked; save(); } }), ' เปิดทุกด่านโดยไม่ต้องส่งภารกิจตามลำดับ')));
  // คำปรึกษา
  const open = DB.consult;
  wrap.append(h('section', { class: 'sec' }, h('h2', {}, `คำปรึกษาจากนักเรียน (${open.filter((c) => !c.a).length} รอตอบ)`),
    open.length ? h('ul', { class: 'qlist' }, open.map((c) => {
      const ta = h('input', { id: `a-${c.id}`, value: c.a, placeholder: 'ตอบด้วยคำถามชวนคิดหรือคำแนะนำ' });
      return h('li', {}, h('p', {}, h('b', {}, c.gname), ': ', c.q, c.mid ? h('span', { class: 'muted' }, ` (${MISSION(c.mid).title})`) : null),
        h('form', { class: 'rform', onsubmit: (e) => { e.preventDefault(); c.a = ta.value.trim(); save(); toast('บันทึกคำตอบแล้ว'); render(); } }, ta, h('button', { class: 'btn small', type: 'submit' }, 'ตอบ')));
    })) : h('p', { class: 'muted' }, 'ยังไม่มีคำปรึกษา')));
  // ให้คะแนน
  wrap.append(h('section', { class: 'sec' }, h('h2', {}, 'ให้ดาวตามเกณฑ์'),
    DB.groups.length ? DB.groups.map((g) => h('details', { class: 'tg' }, h('summary', {}, h('b', {}, g.name), ` · ${g.members.join(', ')}`),
      MISSIONS.filter((m) => (g.missions[m.id] || {}).submitted).map((m) => {
        const r = g.missions[m.id];
        const box = h('div', { class: 'tm' });
        const draw = () => box.replaceChildren(
          h('div', { class: 'tmh' }, h('b', {}, `${m.ind} ${m.title}`), areaChip(m.area), stars(finalScore(r))),
          r.data.draw ? h('img', { src: r.data.draw, alt: 'ภาพวาดของนักเรียน', class: 'pimg' }) : null,
          h('pre', { class: 'ans' }, answerText(m, r.data) || '(ไม่มีคำตอบ)'),
          h('p', { class: 'muted' }, `ระบบให้ ${r.auto.score} ดาว · ใช้ฐานช่วยเหลือ ${Object.values(r.helps || {}).reduce((a, b) => a + b, 0)} ครั้ง`),
          teacherScore(m, r, draw));
        draw();
        return box;
      }))) : h('p', { class: 'muted' }, 'ยังไม่มีกลุ่ม')));
  const resetBtn = h('button', { type: 'button', class: 'btn danger', onclick: () => {
    if (!confirmReset) { confirmReset = true; resetBtn.textContent = 'แตะอีกครั้งเพื่อลบข้อมูลทั้งหมด'; return; }
    DB.groups = []; DB.board = []; DB.consult = []; DB.cur = null; save(); go('home');
  } }, 'ลบข้อมูลทุกกลุ่มในเครื่องนี้');
  wrap.append(h('section', { class: 'sec' }, h('h2', {}, 'ล้างข้อมูล'), resetBtn));
  return wrap;
}

// ---------- เกี่ยวกับเกม ----------
function aboutView() {
  const wrap = h('div', { class: 'about' });
  if (!G()) wrap.append(h('button', { type: 'button', class: 'back', onclick: () => go('home') }, '← กลับหน้าแรก'));
  wrap.append(h('div', { class: 'pagehead' }, h('h1', {}, 'เกี่ยวกับเกมและกรอบแนวคิด'),
    h('p', { class: 'muted' }, 'สิ่งแวดล้อมการเรียนรู้ตามแนวคอนสตรัคติวิสต์ เพื่อส่งเสริมการคิดสร้างสรรค์ เรื่องการแต่งประโยค ภาษาไทย ป.3')));
  wrap.append(h('section', { class: 'sec' }, h('h2', {}, 'องค์ประกอบ 7 ด้านในเกม'),
    h('div', { class: 'tablew' }, h('table', {}, h('thead', {}, h('tr', {}, ['องค์ประกอบ', 'ข้อประเมิน', 'สิ่งที่อยู่ในเกม'].map((x) => h('th', {}, x)))),
      h('tbody', {}, COMPONENTS.map(([a, b, c], i) => h('tr', {}, h('td', {}, h('b', {}, `${i + 1}) ${a}`)), h('td', { class: 'num' }, b), h('td', {}, c))))))));
  wrap.append(h('section', { class: 'sec' }, h('h2', {}, 'การคิดสร้างสรรค์ตามแนวคิดของกิลฟอร์ด (สรุปโดย จารุณี ซามาตย์)'),
    h('div', { class: 'proc' }, ['F', 'X', 'O', 'E'].map((a) => h('div', { class: `pstep a-${a}` }, h('b', {}, `${AREAS[a].name} (${AREAS[a].en})`), h('small', {}, AREAS[a].def), h('small', {}, `ย่อย: ${AREAS[a].sub.join(' · ')}`))))));
  wrap.append(h('section', { class: 'sec' }, h('h2', {}, 'สถานการณ์ปัญหา 4 ด่าน × เนื้อหา 3 ด้าน'),
    h('div', { class: 'tablew' }, h('table', { class: 'matrix' },
      h('thead', {}, h('tr', {}, h('th', {}, 'สถานการณ์ปัญหา'), CONTENTS.map((c) => h('th', {}, c.topic)))),
      h('tbody', {}, SITUATIONS.map((st) => h('tr', {}, h('td', {}, h('b', {}, `${st.no}. ${st.title}`), h('br'), h('small', {}, AREAS[st.area].name)),
        CONTENTS.map((c) => { const m = MISSIONS.find((x) => x.content === c.id && x.area === st.area); return h('td', {}, h('b', {}, `${m.ind} ${m.title}`), h('br'), h('small', {}, INDICATORS[m.ind])); }))))))));
  return wrap;
}

// ====================== เริ่มต้น ======================
if (DB.cur && G()) ui = { view: 'map' };
render();
