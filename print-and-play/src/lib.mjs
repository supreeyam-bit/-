// ชิ้นส่วนร่วมของทุกไฟล์พิมพ์: โทเคนสี ฟอนต์ และตัวช่วยสร้าง HTML

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const BASE_CSS = `
@import url('../fonts/fonts.css');
:root{
  --paper:#fbf6ea;--paper-raised:#ffffff;--ink:#2a2233;--ink-muted:#5f566b;--line:#d9cfb8;
  --role-subject:#c8322b;--role-verb:#f2b705;--role-object:#1d4a9e;--role-on-dark:#ffffff;--role-on-light:#2a2233;
  --type-statement:#2e7d4f;--type-negative:#5b4b8a;--type-question:#b4541a;--type-command:#1f2a44;--type-request:#b03a72;
  --chaos:#4a2a5e;--spark-gold:#e8a33d;--coop-teal:#17767a;--hint-sky:#dcebf7;
  --water:#c4efe9;--water-wave:#8fdcd2;--plaza:#e8f6c9;--grass:#d4ec9f;--grass-edge:#8fbf4f;--sand:#f3dfb0;--sand-edge:#d2a862;
  --font-display:Mitr,"Noto Sans Thai",sans-serif;--font-body:Sarabun,"Noto Sans Thai",sans-serif;
}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0}
body{font-family:var(--font-body);color:var(--ink);background:#fff}
.disp{font-family:var(--font-display)}
.emoji{font-family:"Noto Color Emoji",sans-serif}
.page{position:relative;overflow:hidden;break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.pnote{position:absolute;bottom:3mm;left:0;right:0;text-align:center;font-size:7pt;color:var(--ink-muted)}
`;

export const doc = (title, css, body) => `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${BASE_CSS}${css}</style></head><body>${body}</body></html>`;

// มาร์กเกอร์ AR แบบตาราง 5×5 (ภาพตัวแทน: แอปจะลงทะเบียนลายนี้เป็นเป้าสแกน)
export function arMarker(seed, size = '14mm') {
  let x = 0;
  for (const ch of String(seed)) x = (x * 31 + ch.codePointAt(0)) >>> 0;
  let cells = '';
  for (let i = 0; i < 25; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    const on = (x >>> 16) & 1;
    // มุมซ้ายบนทึบเสมอเพื่อบอกทิศ
    if (on || i === 0) cells += `<rect x="${2 + (i % 5) * 4}" y="${2 + Math.floor(i / 5) * 4}" width="4" height="4"/>`;
  }
  return `<svg class="ar" viewBox="0 0 24 24" style="width:${size};height:${size}"><rect x="0" y="0" width="24" height="24" fill="#fff"/><rect x="0.5" y="0.5" width="23" height="23" fill="none" stroke="#2a2233" stroke-width="1.6"/><g fill="#2a2233">${cells}</g></svg>`;
}

export const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
