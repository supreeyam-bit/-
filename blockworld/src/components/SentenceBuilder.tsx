// 3. เครื่องมือทางปัญญา — เรียงบล็อกคำ (แตะหรือลาก-วาง) ผู้ทำ → การกระทำ → ผู้รับการกระทำ → คำขยาย
import { useState, type DragEvent } from 'react';
import type { Role, StarterWord } from '../game/types';

export const ROLE_INFO: Record<Role, { name: string; short: string; color: string; icon: string }> = {
  subject: { name: 'ผู้ทำ / ประธาน', short: 'ผู้ทำ', color: '#7c3aed', icon: '🙋' },
  verb: { name: 'การกระทำ / กริยา', short: 'การกระทำ', color: '#dc2626', icon: '⚡' },
  object: { name: 'ผู้รับการกระทำ / กรรม', short: 'ผู้รับ', color: '#2563eb', icon: '🎯' },
  modifier: { name: 'คำขยาย / เวลา / สถานที่', short: 'คำขยาย', color: '#16a34a', icon: '🔍' },
  other: { name: 'คำอื่น ๆ (เช่น คำลงท้าย)', short: 'อื่น ๆ', color: '#64748b', icon: '💬' },
};
const ROLE_ORDER: Role[] = ['subject', 'verb', 'object', 'modifier', 'other'];
const SPACE = '␣';

interface Chip { id: number; text: string; role: Role | '' }
let nextId = 1;

export function SentenceBuilder({ words, extraWords = [], onUse, label }: { words: StarterWord[]; extraWords?: string[]; onUse: (text: string, mode: 'replace' | 'append') => void; label?: string }) {
  const [row, setRow] = useState<Chip[]>([]);
  const [free, setFree] = useState('');
  const [versions, setVersions] = useState<string[]>([]);
  const [drag, setDrag] = useState<{ from: 'bank' | 'row'; idx: number } | null>(null);

  const bank: { text: string }[] = [...words, ...extraWords.filter((w) => !words.some((x) => x.text === w)).map((text) => ({ text })), { text: SPACE }];
  const sentence = row.map((c) => (c.text === SPACE ? ' ' : c.text)).join('').replace(/\s+/g, ' ').trim();

  const insert = (text: string, at = row.length) => setRow((r) => [...r.slice(0, at), { id: nextId++, text, role: '' }, ...r.slice(at)]);
  const move = (i: number, d: -1 | 1) =>
    setRow((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const c = [...r];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  const remove = (i: number) => setRow((r) => r.filter((_, k) => k !== i));
  const setRole = (i: number, role: Role | '') => setRow((r) => r.map((c, k) => (k === i ? { ...c, role } : c)));

  const onDrop = (e: DragEvent, at: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!drag) return;
    if (drag.from === 'bank') insert(bank[drag.idx].text, at);
    else
      setRow((r) => {
        const c = [...r];
        const [m] = c.splice(drag.idx, 1);
        c.splice(at > drag.idx ? at - 1 : at, 0, m);
        return c;
      });
    setDrag(null);
  };

  // คำแนะนำเรื่องลำดับ (เฉพาะคำที่ผู้เรียนเลือกหน้าที่เอง)
  const roles = row.map((c) => c.role).filter(Boolean) as Role[];
  const idx = (r: Role) => roles.indexOf(r);
  const tips: string[] = [];
  if (idx('subject') > -1 && idx('verb') > -1 && idx('subject') > idx('verb')) tips.push('ผู้ทำมักอยู่หน้าการกระทำ ลองสลับดูไหม');
  if (idx('object') > -1 && idx('verb') > -1 && idx('object') < idx('verb')) tips.push('ผู้รับการกระทำมักอยู่หลังการกระทำ');
  if (row.length > 0 && !roles.length) tips.push('ลองเลือกหน้าที่ของแต่ละคำ (ผู้ทำ การกระทำ …) จะช่วยตรวจลำดับได้');

  const use = (mode: 'replace' | 'append') => {
    if (!sentence) return;
    onUse(sentence, mode);
    setVersions((v) => [...v, sentence]);
  };

  return (
    <div className="builder" aria-label={label ?? 'เครื่องมือเรียงบล็อกคำ'}>
      <div className="builder-head">
        <strong>🧱 3. เครื่องมือทางปัญญา</strong>
        <span className="role-guide" aria-label="ลำดับหน้าที่ของคำ">
          {ROLE_ORDER.slice(0, 4).map((r, i) => (
            <span key={r}>
              <span className="role-dot" style={{ background: ROLE_INFO[r].color }} aria-hidden="true" />
              {ROLE_INFO[r].name}
              {i < 3 && ' → '}
            </span>
          ))}
        </span>
      </div>

      <div className="bank" aria-label="บล็อกคำ แตะเพื่อวางลงแถวประโยค">
        {bank.map((w, i) => (
          <button
            key={`${w.text}-${i}`}
            type="button"
            className={`word-chip ${w.text === SPACE ? 'space' : ''}`}
            draggable
            onDragStart={() => setDrag({ from: 'bank', idx: i })}
            onClick={() => insert(w.text)}
            aria-label={w.text === SPACE ? 'เพิ่มการเว้นวรรค' : `เพิ่มคำ ${w.text}`}
          >
            {w.text === SPACE ? '␣ เว้นวรรค' : w.text}
          </button>
        ))}
      </div>

      <div className="row-wrap" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, row.length)} aria-label="แถวประโยค">
        {row.length === 0 && <span className="muted">แตะหรือลากบล็อกคำมาวางที่นี่</span>}
        {row.map((c, i) => (
          <div
            key={c.id}
            className="row-chip"
            draggable
            onDragStart={() => setDrag({ from: 'row', idx: i })}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, i)}
            style={{ borderColor: c.role ? ROLE_INFO[c.role].color : '#cbd5e1' }}
          >
            <span className="row-word">{c.text === SPACE ? '␣' : c.text}</span>
            {c.text !== SPACE && (
              <select value={c.role} onChange={(e) => setRole(i, e.target.value as Role | '')} aria-label={`หน้าที่ของคำ ${c.text}`} style={{ color: c.role ? ROLE_INFO[c.role].color : undefined }}>
                <option value="">หน้าที่?</option>
                {ROLE_ORDER.map((r) => (
                  <option key={r} value={r}>{ROLE_INFO[r].icon} {ROLE_INFO[r].short}</option>
                ))}
              </select>
            )}
            <span className="row-tools">
              <button type="button" onClick={() => move(i, -1)} aria-label={`เลื่อน ${c.text} ไปทางซ้าย`} disabled={i === 0}>◀</button>
              <button type="button" onClick={() => move(i, 1)} aria-label={`เลื่อน ${c.text} ไปทางขวา`} disabled={i === row.length - 1}>▶</button>
              <button type="button" onClick={() => remove(i)} aria-label={`ลบคำ ${c.text}`}>✕</button>
            </span>
          </div>
        ))}
      </div>

      <div className="builder-free">
        <input value={free} onChange={(e) => setFree(e.target.value)} placeholder="พิมพ์คำของฉันเอง" aria-label="เพิ่มคำอิสระ"
          onKeyDown={(e) => { if (e.key === 'Enter' && free.trim()) { e.preventDefault(); insert(free.trim()); setFree(''); } }} />
        <button type="button" className="btn small" onClick={() => { if (free.trim()) { insert(free.trim()); setFree(''); } }}>➕ เพิ่มคำ</button>
        <button type="button" className="btn small ghost" onClick={() => setRow([])} disabled={!row.length}>🧹 ล้างแถว</button>
      </div>

      <div className="preview">
        <span className="muted">ประโยคในแถว:</span> <strong>{sentence || '…'}</strong>
      </div>
      {tips.map((t) => (
        <div key={t} className="tip">💡 {t}</div>
      ))}
      {versions.length > 0 && (
        <div className="versions">
          <div><span className="muted">ก่อนแก้:</span> {versions[0]}</div>
          {versions.length > 1 && <div><span className="muted">หลังแก้:</span> {versions[versions.length - 1]}</div>}
        </div>
      )}
      <div className="row-actions">
        <button type="button" className="btn" onClick={() => use('replace')} disabled={!sentence}>⬇️ ใช้ประโยคนี้</button>
        <button type="button" className="btn ghost" onClick={() => use('append')} disabled={!sentence}>➕ เติมต่อท้ายคำตอบ</button>
      </div>
    </div>
  );
}
