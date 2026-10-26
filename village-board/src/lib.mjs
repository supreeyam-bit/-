// ชิ้นส่วนร่วมของทุกไฟล์พิมพ์: โทเคนสี (ชุดเดียวกับฉบับดิจิทัล) ฟอนต์ และตัวช่วยสร้าง HTML
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
export const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

export const BASE_CSS = `
@import url('../../print-and-play/fonts/fonts.css');
:root{
  --paper:#f3f5ec;--raised:#ffffff;--sunk:#e8ecdf;--ink:#1d2433;--muted:#566072;--line:#d3d9c6;
  --school:#a8432c;--market:#2c4c8e;--field:#3a7535;--gold:#e1a522;--on-gold:#2a2110;
  --aF:#c4661c;--aX:#1f7c7c;--aO:#7d48a8;--aE:#b23a62;
  --rS:#c8322b;--rV:#f2b705;--rO:#1d4a9e;--rM:#5f86cf;--rP:#7f8796;--on-rV:#2a2110;
  --good:#2d7a45;--bad:#b4401f;
  --display:Mitr,"Noto Sans Thai",sans-serif;--body:Sarabun,"Noto Sans Thai",sans-serif;
}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0}
body{font-family:var(--body);color:var(--ink);background:#fff}
h1,h2,h3,h4{font-family:var(--display);font-weight:500;margin:0}
p{margin:0}
.emoji{font-family:"Noto Color Emoji",sans-serif}
.page{position:relative;overflow:hidden;break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.pnote{position:absolute;bottom:3mm;left:0;right:0;text-align:center;font-size:7pt;color:var(--muted)}
.a-F{--a:var(--aF)}.a-X{--a:var(--aX)}.a-O{--a:var(--aO)}.a-E{--a:var(--aE)}
.c-build{--s:var(--school)}.c-use{--s:var(--market)}.c-expand{--s:var(--field)}.sit{--s:var(--a)}
.r-S{--rc:var(--rS)}.r-V{--rc:var(--rV)}.r-O{--rc:var(--rO)}.r-M{--rc:var(--rM)}.r-P{--rc:var(--rP)}
.blk{display:inline-block;border-radius:1.6mm;padding:.6mm 2.4mm;font:500 9pt/1.3 var(--display);color:#fff;background:var(--rc)}
.blk.r-V{color:var(--on-rV)}
`;

export const doc = (title, css, body) => `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${BASE_CSS}${css}</style></head><body>${body}</body></html>`;

// มาร์กเกอร์ AR แบบตาราง 5×5 (ภาพตัวแทน: แอป AR ลงทะเบียนลายนี้เป็นเป้าสแกน) ใช้ลายแบบเดียวกับชุดพิมพ์เดิม
export function arMarker(seed, size = '12mm') {
  let x = 0;
  for (const ch of String(seed)) x = (x * 31 + ch.codePointAt(0)) >>> 0;
  let cells = '';
  for (let i = 0; i < 25; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    if (((x >>> 16) & 1) || i === 0) cells += `<rect x="${2 + (i % 5) * 4}" y="${2 + Math.floor(i / 5) * 4}" width="4" height="4"/>`;
  }
  return `<svg class="ar" viewBox="0 0 24 24" style="width:${size};height:${size};flex:none"><rect width="24" height="24" fill="#fff"/><rect x="0.5" y="0.5" width="23" height="23" fill="none" stroke="#1d2433" stroke-width="1.6"/><g fill="#1d2433">${cells}</g></svg>`;
}
