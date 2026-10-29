import { useEffect, useState } from 'react';
import { BLOCK_CATEGORIES, type WorkConfig } from '../data';
import { blockColor, joinBlocks } from '../util';

export interface BuiltSentence {
  text: string;
  blocks: string[];
  tags: string[];
  audience?: string;
  parts: string[];
  explanation?: string;
  selfCheck: string[];
}

interface Props {
  config?: WorkConfig;
  initialBlocks?: string[];
  initial?: Partial<BuiltSentence>;
  resetKey?: string | number;
  disabled?: boolean;
  onSave?: (s: BuiltSentence) => void;
  onCancel?: () => void;
  saveLabel?: string;
}

// แท่นเรียงบล็อกคำ: แตะบล็อกเพื่อวาง ย้ายซ้าย/ขวา ลบ พิมพ์คำเองได้ และพิมพ์ทั้งประโยคได้
export default function SentenceBuilder({ config, initialBlocks, initial, resetKey, disabled, onSave, onCancel, saveLabel = 'บันทึกประโยค' }: Props) {
  const [blocks, setBlocks] = useState<string[]>(initialBlocks ?? initial?.blocks ?? []);
  const [text, setText] = useState(initial?.text ?? joinBlocks(initialBlocks ?? []));
  const [textEdited, setTextEdited] = useState(Boolean(initial?.text && initial.text !== joinBlocks(initial.blocks ?? [])));
  const [cat, setCat] = useState(BLOCK_CATEGORIES[0].id);
  const [own, setOwn] = useState('');
  const [sel, setSel] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [parts, setParts] = useState<string[]>(initial?.parts ?? []);
  const [explanation, setExplanation] = useState(initial?.explanation ?? '');
  const [selfCheck, setSelfCheck] = useState<string[]>(initial?.selfCheck ?? []);

  useEffect(() => {
    setBlocks(initialBlocks ?? initial?.blocks ?? []);
    setText(initial?.text ?? joinBlocks(initialBlocks ?? initial?.blocks ?? []));
    setTextEdited(false);
    setTags(initial?.tags ?? []);
    setParts(initial?.parts ?? []);
    setExplanation(initial?.explanation ?? '');
    setSelfCheck(initial?.selfCheck ?? []);
    setSel(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const setB = (b: string[]) => {
    setBlocks(b);
    if (!textEdited) setText(joinBlocks(b));
  };
  const add = (w: string) => {
    if (disabled || !w.trim()) return;
    setB([...blocks, w.trim()]);
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const b = [...blocks];
    [b[i], b[j]] = [b[j], b[i]];
    setB(b);
    setSel(j);
  };
  const remove = (i: number) => {
    setB(blocks.filter((_, k) => k !== i));
    setSel(null);
  };
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const words = BLOCK_CATEGORIES.find((c) => c.id === cat)!.words;
  const canSave = !disabled && text.trim().length > 0;
  const save = (audience?: string) => {
    if (!canSave || !onSave) return;
    onSave({ text: text.trim(), blocks, tags, audience, parts, explanation: explanation.trim() || undefined, selfCheck });
    setBlocks([]);
    setText('');
    setTextEdited(false);
    setTags([]);
    setParts([]);
    setExplanation('');
    setSelfCheck([]);
    setSel(null);
  };

  return (
    <div className={`builder ${disabled ? 'disabled' : ''}`}>
      <div className="tray" data-testid="tray" aria-label="แท่นวางประโยค">
        {blocks.length === 0 && <span className="tray-empty">แตะบล็อกคำด้านล่างเพื่อวางเรียงจากซ้ายไปขวา หรือพิมพ์ประโยคเองในช่องด้านล่าง</span>}
        {blocks.map((b, i) => (
          <span key={i} className={`placed ${sel === i ? 'sel' : ''}`} style={{ ['--c' as string]: blockColor(b) }}>
            <button className="placed-word" onClick={() => setSel(sel === i ? null : i)}>{b}</button>
            {sel === i && (
              <span className="placed-ctl">
                <button aria-label="ย้ายซ้าย" onClick={() => move(i, -1)}>◀</button>
                <button aria-label="ย้ายขวา" onClick={() => move(i, 1)}>▶</button>
                <button aria-label="ลบบล็อก" onClick={() => remove(i)}>✕</button>
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="bank">
        <div className="tabs small" role="tablist">
          {BLOCK_CATEGORIES.map((c) => (
            <button key={c.id} role="tab" aria-selected={cat === c.id} className={cat === c.id ? 'on' : ''} style={{ ['--c' as string]: c.color }} onClick={() => setCat(c.id)}>
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className="bank-words">
          {words.map((w) => (
            <button key={w} className="wblock" style={{ ['--c' as string]: blockColor(w) }} onClick={() => add(w)} disabled={disabled}>{w}</button>
          ))}
        </div>
        <div className="row gap wrap">
          <input className="input" placeholder="คำของฉัน (พิมพ์คำเอง)" value={own} onChange={(e) => setOwn(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (add(own), setOwn(''))} disabled={disabled} />
          <button className="btn small" onClick={() => { add(own); setOwn(''); }} disabled={disabled || !own.trim()}>+ เพิ่มบล็อก</button>
          <button className="btn small ghost" onClick={() => setB([])} disabled={disabled || !blocks.length}>ล้างแท่น</button>
        </div>
      </div>

      <label className="field">
        <span>ประโยค {textEdited ? '(พิมพ์เอง)' : '(จากบล็อก — แก้หรือพิมพ์เองได้)'}</span>
        <textarea className="input" rows={2} value={text} data-testid="sentence-text" disabled={disabled}
          onChange={(e) => { setText(e.target.value); setTextEdited(true); }} />
      </label>

      {config?.tags && (
        <div className="field">
          <span>รูปแบบ/ชนิดของประโยคนี้ (เลือกได้มากกว่า 1)</span>
          <div className="chips">
            {config.tags.map((t) => <button key={t} className={`chip ${tags.includes(t) ? 'on' : ''}`} onClick={() => toggle(tags, setTags, t)}>{t}</button>)}
          </div>
        </div>
      )}
      {config?.expansion_parts && (
        <div className="field">
          <span>ส่วนที่ขยาย</span>
          <div className="chips">
            {config.expansion_parts.map((t) => <button key={t} className={`chip ${parts.includes(t) ? 'on' : ''}`} onClick={() => toggle(parts, setParts, t)}>{t}</button>)}
          </div>
        </div>
      )}
      {config?.explanation && (
        <label className="field">
          <span>อธิบายเหตุผล</span>
          <textarea className="input" rows={2} value={explanation} placeholder="ทำไมฉันคิดแบบนี้ / ทำไมเพิ่มหรือเปลี่ยนรายละเอียดนี้" onChange={(e) => setExplanation(e.target.value)} disabled={disabled} />
        </label>
      )}
      {config?.checklist && (
        <div className="field">
          <span>เกณฑ์ตรวจประโยค (ตรวจด้วยตัวเอง)</span>
          <div className="checks">
            {config.checklist.map((c) => (
              <label key={c} className="check"><input type="checkbox" checked={selfCheck.includes(c)} onChange={() => toggle(selfCheck, setSelfCheck, c)} disabled={disabled} /> {c}</label>
            ))}
          </div>
        </div>
      )}

      {onSave && (
        <div className="row gap wrap">
          {config?.audiences ? (
            config.audiences.map((a) => (
              <button key={a} className="btn primary aud-save" disabled={!canSave} onClick={() => save(a)}>
                {AUD_ICON[a] ?? '👤'} บันทึกสำหรับผู้ฟัง: {a}
              </button>
            ))
          ) : (
            <button className="btn primary" disabled={!canSave} onClick={() => save()} data-testid="save-sentence">{saveLabel}</button>
          )}
          {onCancel && <button className="btn ghost" onClick={onCancel}>ยกเลิก</button>}
        </div>
      )}
    </div>
  );
}

export const AUD_ICON: Record<string, string> = { ผู้ใหญ่: '🧓', เพื่อน: '🧒', น้อง: '👶' };
