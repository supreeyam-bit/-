// บล็อกคำ 60 × 35 มม. ขอบต่อกันแบบจิ๊กซอว์ — 21 ชิ้นต่อหน้า A4
import { doc, esc, chunk } from './lib.mjs';
import { SUBJECTS, VERBS, OBJECTS, MODIFIERS, CHANGERS, GHOSTS, TYPES } from './data.mjs';

const css = `
@page{size:210mm 297mm;margin:0}
.page{width:210mm;height:297mm;padding:12mm 10mm 0}
.grid{display:grid;grid-template-columns:repeat(3,60mm);grid-auto-rows:35mm;gap:4mm 5mm;justify-content:center}
.b{position:relative;width:60mm;height:35mm}
.b svg{position:absolute;inset:0;width:100%;height:100%}
.b .in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 9mm 0 9mm;text-align:center}
.b .w{font:500 19pt/1.15 var(--font-display);white-space:nowrap}
.b .q{font-size:8pt;line-height:1.2;margin-top:.6mm}
.b .s{position:absolute;top:1.6mm;left:3mm;font:600 9pt/1 var(--font-display)}
.b .r{position:absolute;bottom:1.4mm;left:3mm;font-size:6.5pt;opacity:.9}
.on-dark{color:#fff}.on-light{color:var(--ink)}
.chg .tag{position:absolute;top:0;left:0;right:0;height:6mm;border-radius:2.4mm 2.4mm 0 0;color:#fff;font:500 7.5pt/6mm var(--font-display);text-align:center}
.chg .in{padding-top:5mm}
`;

// รูปทรง: viewBox 600×350, หัวลูกศร/รอยบากลึก 60 หน่วย (6 มม.)
const SHAPES = {
  subject: '0,0 540,0 600,175 540,350 0,350',
  verb: '0,0 540,0 600,175 540,350 0,350 60,175',
  object: '0,0 600,0 600,350 0,350 60,175',
  modifier: '0,0 540,0 600,175 540,350 0,350 60,175',
};
const FILL = { subject: '#c8322b', verb: '#f2b705', object: '#1d4a9e', modifier: '#4f74b8' };

const size = (w) => (w.length > 11 ? '13pt' : w.length > 8 ? '16pt' : '19pt');

function block(role, word) {
  const meta = {
    subject: ['▲', 'ใคร? อะไร?', 'ประธาน', 'on-dark'],
    verb: ['➜', 'ทำอะไร?', 'กริยา', 'on-light'],
    object: ['●', 'ทำกับใคร? กับอะไร?', 'กรรม', 'on-dark'],
    modifier: ['●', 'อย่างไร? ที่ไหน? เมื่อไร?', 'ส่วนขยาย', 'on-dark'],
  }[role];
  return `<div class="b ${meta[3]}"><svg viewBox="0 0 600 350" preserveAspectRatio="none"><polygon points="${SHAPES[role]}" fill="${FILL[role]}" stroke="#2a2233" stroke-width="4" stroke-linejoin="round"/></svg>
<div class="s">${meta[0]}</div><div class="in"><div class="w" style="font-size:${size(word)}">${esc(word)}</div><div class="q">${meta[1]}</div></div><div class="r">${meta[2]}</div></div>`;
}

function changer([word, type, where]) {
  const t = TYPES.find((x) => x.id === type);
  return `<div class="b chg"><svg viewBox="0 0 600 350" preserveAspectRatio="none"><rect x="2" y="2" width="596" height="346" rx="24" fill="#fff" stroke="#2a2233" stroke-width="4"/></svg>
<div class="tag" style="background:${t.color}">${t.sym} คำเปลี่ยนร่าง · ประโยค${esc(t.name)}</div>
<div class="in"><div class="w" style="font-size:${size(word)}">${esc(word)}</div><div class="q">${esc(where)}</div></div></div>`;
}

const ghost = () => `<div class="b"><svg viewBox="0 0 600 350" preserveAspectRatio="none"><polygon points="${SHAPES.subject}" fill="#f6dcda" stroke="#c8322b" stroke-width="6" stroke-dasharray="22 14" stroke-linejoin="round"/></svg>
<div class="s" style="color:#c8322b">▲</div><div class="in" style="color:#9e2620"><div class="w" style="font-size:16pt">(ประธานล่องหน)</div><div class="q">ใช้กับประโยคคำสั่ง / ขอร้อง</div></div></div>`;

export function blocksHtml() {
  const all = [
    ...SUBJECTS.map((w) => block('subject', w)),
    ...VERBS.map((w) => block('verb', w)),
    ...OBJECTS.map((w) => block('object', w)),
    ...MODIFIERS.map((w) => block('modifier', w)),
    ...CHANGERS.map(changer),
    ...Array.from({ length: GHOSTS }, ghost),
  ];
  const pages = chunk(all, 21).map((p, i, a) => `<div class="page"><div class="grid">${p.join('')}</div>
<div class="pnote">บล็อกคำ ${i + 1}/${a.length} · ตัดตามเส้นขอบ (หัวลูกศรของบล็อกหนึ่งสอดเข้ารอยบากของบล็อกถัดไป) · แนะนำกระดาษ 180–220 แกรม</div></div>`);
  return doc('บล็อกคำ', css, pages.join(''));
}
