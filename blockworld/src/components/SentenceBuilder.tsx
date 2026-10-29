import { useState } from 'react';
import { WORDS } from '../data';

const SHELVES: { id: string; label: string; cls: string; words: string[] }[] = [
  { id: 'subject', label: 'ประธาน', cls: 'b-subject', words: WORDS.subject },
  { id: 'verb', label: 'กริยา', cls: 'b-verb', words: WORDS.verb },
  { id: 'object', label: 'กรรม', cls: 'b-object', words: WORDS.object },
  { id: 'modifier', label: 'คำขยาย', cls: 'b-mod', words: WORDS.modifier },
  { id: 'marker', label: 'คำบอกชนิดประโยค', cls: 'b-marker', words: WORDS.sentence_marker },
  { id: 'ending', label: 'คำลงท้าย', cls: 'b-ending', words: WORDS.polite_ending },
];

export const joinTokens = (tokens: string[]) => tokens.join('');

interface Props {
  initial?: string[];
  before?: string; // ฉบับก่อน ใช้แสดงเทียบกับฉบับหลัง
  sceneWords?: string[];
  saveLabel?: string;
  onSave: (tokens: string[], text: string) => void;
  onCancel?: () => void;
  testId?: string;
}

/** เครื่องมือเรียงบล็อกคำ: เลือกบล็อก พิมพ์คำอิสระ เพิ่ม ลบ ย้าย และเทียบฉบับก่อน–หลัง */
export function SentenceBuilder({ initial = [], before, sceneWords = [], saveLabel = 'บันทึกประโยค', onSave, onCancel, testId }: Props) {
  const [tokens, setTokens] = useState<string[]>(initial);
  const [sel, setSel] = useState<number | null>(null);
  const [free, setFree] = useState('');
  const [shelf, setShelf] = useState('scene');
  const [drag, setDrag] = useState<number | null>(null);

  const insertAt = sel === null ? tokens.length : sel + 1;
  const add = (w: string) => {
    const word = w.trim();
    if (!word) return;
    const next = [...tokens];
    next.splice(insertAt, 0, word);
    setTokens(next);
    setSel(insertAt);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= tokens.length) return;
    const next = [...tokens];
    [next[i], next[j]] = [next[j], next[i]];
    setTokens(next);
    setSel(j);
  };
  const remove = (i: number) => { setTokens(tokens.filter((_, k) => k !== i)); setSel(null); };
  const dropOn = (i: number) => {
    if (drag === null || drag === i) return;
    const next = [...tokens];
    const [w] = next.splice(drag, 1);
    next.splice(i, 0, w);
    setTokens(next);
    setSel(i);
    setDrag(null);
  };

  const shelves = [{ id: 'scene', label: 'คำในสถานการณ์', cls: 'b-scene', words: sceneWords }, ...SHELVES].filter((s) => s.words.length);
  const active = shelves.find((s) => s.id === shelf) ?? shelves[0];
  const text = joinTokens(tokens);

  return (
    <div className="builder" data-testid={testId}>
      <div className="tray" aria-label="แท่นวางประโยค">
        {tokens.length === 0 && <span className="tray-empty">แตะบล็อกคำด้านล่าง หรือพิมพ์คำเอง เพื่อวางบนแท่นประโยค</span>}
        {tokens.map((t, i) => (
          <span key={i} className={`tok ${sel === i ? 'sel' : ''}`} draggable
            onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(i)}
            onClick={() => setSel(sel === i ? null : i)}>
            {sel === i && <button className="tok-btn" onClick={(e) => { e.stopPropagation(); move(i, -1); }} aria-label="ย้ายซ้าย">◀</button>}
            <span className="tok-word">{t}</span>
            {sel === i && <button className="tok-btn" onClick={(e) => { e.stopPropagation(); move(i, 1); }} aria-label="ย้ายขวา">▶</button>}
            <button className="tok-x" onClick={(e) => { e.stopPropagation(); remove(i); }} aria-label={`ลบ ${t}`}>✕</button>
          </span>
        ))}
      </div>
      <div className="builder-preview">
        {before !== undefined && <div className="ver before"><b>ฉบับก่อน</b> {before || '—'}</div>}
        <div className="ver after"><b>{before !== undefined ? 'ฉบับหลัง' : 'ประโยค'}</b> {text || '—'}</div>
      </div>
      <div className="free-row">
        <input value={free} onChange={(e) => setFree(e.target.value)} placeholder="พิมพ์คำหรือข้อความเอง…" aria-label="พิมพ์คำอิสระ"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(free); setFree(''); } }} />
        <button className="btn sm" onClick={() => { add(free); setFree(''); }} disabled={!free.trim()}>＋ เพิ่มบล็อก</button>
        <span className="hint-text">{sel === null ? 'บล็อกใหม่ต่อท้าย' : `บล็อกใหม่วางหลัง "${tokens[sel]}"`}</span>
      </div>
      <div className="shelf-tabs" role="tablist">
        {shelves.map((s) => (
          <button key={s.id} role="tab" aria-selected={active.id === s.id} className={`shelf-tab ${s.cls} ${active.id === s.id ? 'on' : ''}`} onClick={() => setShelf(s.id)}>{s.label}</button>
        ))}
      </div>
      <div className="shelf">
        {active.words.map((w) => <button key={w} className={`block ${active.cls}`} onClick={() => add(w)}>{w}</button>)}
      </div>
      <div className="row end">
        <button className="btn ghost sm" onClick={() => { setTokens([]); setSel(null); }} disabled={!tokens.length}>ล้างแท่น</button>
        {onCancel && <button className="btn ghost sm" onClick={onCancel}>ยกเลิก</button>}
        <button className="btn primary" disabled={!text.trim()} onClick={() => { onSave(tokens, text); setTokens([]); setSel(null); }}>💾 {saveLabel}</button>
      </div>
    </div>
  );
}
