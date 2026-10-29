import { BLOCK_CATEGORIES } from './data';

const VOCAB = [...new Set(BLOCK_CATEGORIES.flatMap((c) => c.words))].sort((a, b) => b.length - a.length);

// ตัดประโยคเป็นบล็อกคำด้วยคลังคำ (เลือกคำยาวสุดก่อน) ใช้แค่เตรียมบล็อกเริ่มต้น ไม่ใช้ตรวจคำตอบ
export function segment(text: string): string[] {
  if (text.includes(' ')) return text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let rest = text;
  let unknown = '';
  while (rest) {
    const w = VOCAB.find((v) => rest.startsWith(v));
    if (w) {
      if (unknown) out.push(unknown), (unknown = '');
      out.push(w);
      rest = rest.slice(w.length);
    } else {
      unknown += rest[0];
      rest = rest.slice(1);
    }
  }
  if (unknown) out.push(unknown);
  return out;
}

export const joinBlocks = (blocks: string[]) => blocks.join('');

export const blockColor = (word: string) => BLOCK_CATEGORIES.find((c) => c.words.includes(word))?.color ?? '#6b6478';

export const fmtTime = (t: number) => new Date(t).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

export function download(name: string, content: string | Blob, type = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadDataUrl(name: string, dataUrl: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
