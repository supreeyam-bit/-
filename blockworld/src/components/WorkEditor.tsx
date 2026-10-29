import { useState } from 'react';
import { SPECS, missionById, type Section } from '../data';
import { getWork, moveEntry, readWork, removeEntry, saveEntry, useGame } from '../store';
import type { Entry, Work } from '../types';
import { DrawingPad } from './DrawingPad';
import { SentenceBuilder } from './SentenceBuilder';

// แบ่งคำของประโยคที่ลำดับผิด เพื่อวางเป็นบล็อกให้นักเรียนย้าย
const PRESPLIT: Record<string, string[]> = {
  'ห้องเรียนกวาดนักเรียน': ['ห้องเรียน', 'กวาด', 'นักเรียน'],
  'ไม้กวาดถือเพื่อน': ['ไม้กวาด', 'ถือ', 'เพื่อน'],
  'กวาดฝุ่นใต้โต๊ะ': ['กวาด', 'ฝุ่น', 'ใต้โต๊ะ'],
};
export function splitWords(s: string): string[] {
  if (PRESPLIT[s]) return PRESPLIT[s];
  if (s.includes(' ')) return s.split(/\s+/).filter(Boolean);
  try {
    const seg = new Intl.Segmenter('th', { granularity: 'word' });
    return [...seg.segment(s)].filter((x) => x.isWordLike).map((x) => x.segment);
  } catch { return [s]; }
}

interface Ctx { missionId: string; playerId: string; words: string[]; readOnly?: boolean }

function EntryView({ e, onEdit, onRemove, onMove, readOnly }: { e: Entry; onEdit?: () => void; onRemove?: () => void; onMove?: (d: -1 | 1) => void; readOnly?: boolean }) {
  return (
    <li className="entry">
      <div className="entry-main">
        <span className="entry-text">{e.text}</span>
        {Object.entries(e.meta ?? {}).filter(([k]) => k !== 'before').map(([k, v]) => <span key={k} className={`chip ${k === 'late' ? 'late' : ''}`}>{v}</span>)}
        {!readOnly && (
          <span className="entry-ctl">
            {onMove && <><button className="icon" onClick={() => onMove(-1)} aria-label="เลื่อนขึ้น">▲</button><button className="icon" onClick={() => onMove(1)} aria-label="เลื่อนลง">▼</button></>}
            {onEdit && <button className="icon" onClick={onEdit} aria-label="แก้ไข">✎</button>}
            {onRemove && <button className="icon" onClick={onRemove} aria-label="ลบ">✕</button>}
          </span>
        )}
      </div>
      {e.meta?.before !== undefined && <div className="beforeafter"><span className="ver before"><b>ฉบับก่อน</b> {e.meta.before}</span><span className="ver after"><b>ฉบับหลัง</b> {e.text}</span></div>}
      {e.history.length > 0 && (
        <details className="history"><summary>ฉบับก่อนหน้า {e.history.length} ฉบับ</summary>
          <ol>{e.history.map((h, i) => <li key={i}><span className="ver before">{h.text}</span></li>)}<li><span className="ver after">{e.text}</span> (ฉบับล่าสุด)</li></ol>
        </details>
      )}
    </li>
  );
}

/** กลุ่มคำตอบหนึ่งช่อง: แบบหลายรายการ (list) หรือรายการเดียว (single) */
function EntryBlock({ c, k, label, single, tag, plain }: { c: Ctx; k: string; label: string; single?: boolean; tag?: { key: string; label: string; options: string[] }; plain?: boolean }) {
  const { game, update } = useGame();
  const list = readWork(game, c.missionId, c.playerId).items[k] ?? [];
  const [editing, setEditing] = useState<string | null>(null);
  const [tagVal, setTagVal] = useState('');
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const editEntry = list.find((e) => e.id === editing);
  const canCompose = !c.readOnly && (editing !== null || !single || list.length === 0);
  const showComposer = canCompose && (open || editing !== null);

  const save = (tokens: string[] | undefined, t: string) => {
    const id = editEntry?.id;
    update((g) => saveEntry(g, c.missionId, c.playerId, k, { id, text: t, tokens, meta: tag && tagVal ? { [tag.key]: `${tag.label}: ${tagVal}` } : undefined }, single));
    setEditing(null);
    if (single) setOpen(false);
  };

  return (
    <div className="entry-block">
      <div className="entry-label">{label}{!single && <span className="count">{list.length} รายการ</span>}</div>
      {list.length > 0 && (
        <ul className="entries">
          {list.map((e) => (
            <EntryView key={e.id} e={e} readOnly={c.readOnly}
              onEdit={() => { setEditing(e.id); setText(e.text); }}
              onRemove={() => update((g) => removeEntry(g, c.missionId, c.playerId, k, e.id))}
              onMove={single ? undefined : (d) => update((g) => moveEntry(g, c.missionId, c.playerId, k, e.id, d))} />
          ))}
        </ul>
      )}
      {canCompose && !showComposer && (
        <button className="btn compose-open" onClick={() => setOpen(true)}>✏️ {list.length ? 'เขียนเพิ่ม' : 'เขียน'}</button>
      )}
      {showComposer && (
        <div className="composer">
          {editEntry && <div className="editing-note">กำลังแก้ไข — ระบบเก็บ "ฉบับก่อน" ไว้เทียบ</div>}
          {tag && (
            <div className="tag-row"><span>{tag.label}:</span>
              {tag.options.map((o) => <button key={o} className={`chip-btn ${tagVal === o ? 'on' : ''}`} onClick={() => setTagVal(tagVal === o ? '' : o)}>{o}</button>)}
            </div>
          )}
          {plain ? (
            <div className="plain">
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="พิมพ์คำอธิบายของฉัน…" aria-label={label} />
              <div className="row end">
                <button className="btn ghost sm" onClick={() => { setEditing(null); setOpen(false); }}>ยกเลิก</button>
                <button className="btn primary" disabled={!text.trim()} onClick={() => { save(undefined, text.trim()); setText(''); }}>💾 บันทึก</button>
              </div>
            </div>
          ) : (
            <SentenceBuilder key={editing ?? 'new'} initial={editEntry?.tokens ?? (editEntry ? [editEntry.text] : [])} before={editEntry?.text}
              sceneWords={c.words} onSave={(tokens, t) => save(tokens, t)} onCancel={editEntry ? () => setEditing(null) : undefined}
              saveLabel={single ? 'บันทึก' : 'บันทึกประโยค'} />
          )}
        </div>
      )}
    </div>
  );
}

function ModifierBlock({ c, s }: { c: Ctx; s: Extract<Section, { kind: 'modifiers' }> }) {
  const { game, update } = useGame();
  const [val, setVal] = useState<Record<string, string>>({});
  const w = readWork(game, c.missionId, c.playerId);
  return (
    <div className="mods">
      <div className="mods-base">ประโยคหลัก: <b>{s.base}</b></div>
      <div className="mods-grid">
        {s.categories.map((cat) => {
          const k = `${s.id}.${cat}`;
          const list = w.items[k] ?? [];
          return (
            <div key={cat} className="mod-col">
              <h4>คำขยายบอก{cat}</h4>
              <div className="chips">{list.map((e) => (
                <span key={e.id} className="chip mod">{e.text}{!c.readOnly && <button className="icon" onClick={() => update((g) => removeEntry(g, c.missionId, c.playerId, k, e.id))} aria-label="ลบ">✕</button>}</span>
              ))}</div>
              {!c.readOnly && (
                <form className="free-row" onSubmit={(ev) => {
                  ev.preventDefault();
                  const t = (val[cat] ?? '').trim();
                  if (!t) return;
                  update((g) => saveEntry(g, c.missionId, c.playerId, k, { text: t }));
                  setVal({ ...val, [cat]: '' });
                }}>
                  <input value={val[cat] ?? ''} onChange={(e) => setVal({ ...val, [cat]: e.target.value })} placeholder={`เพิ่มคำบอก${cat}`} aria-label={`คำขยายบอก${cat}`} />
                  <button className="btn sm">＋</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviseBlock({ c, s }: { c: Ctx; s: Extract<Section, { kind: 'revise' }> }) {
  const { game, update } = useGame();
  const w = readWork(game, c.missionId, c.playerId);
  const [open, setOpen] = useState<number | null>(null);
  const [extra, setExtra] = useState('');
  const custom = Object.keys(w.items).filter((k) => k.startsWith(`${s.id}.x`));
  const all = [...s.items.map((b, i) => ({ key: `${s.id}.${i}`, before: b })), ...custom.map((k) => ({ key: k, before: w.items[k][0]?.meta?.before ?? '' }))];
  return (
    <div className="revise">
      {all.map(({ key, before }, i) => {
        const e = w.items[key]?.[0];
        return (
          <div key={key} className="revise-item">
            <div className="revise-head">
              <span className="ver before"><b>ฉบับก่อน</b> {before}</span>
              {e ? <span className="ver after"><b>ฉบับหลัง</b> {e.text}</span> : <span className="muted">ยังไม่แก้</span>}
              {!c.readOnly && <button className="btn sm" onClick={() => setOpen(open === i ? null : i)}>{e ? '✎ แก้อีกครั้ง' : '🔧 แก้ประโยคนี้'}</button>}
            </div>
            {e && e.history.length > 0 && <details className="history"><summary>ฉบับแก้ก่อนหน้า {e.history.length}</summary><ol>{e.history.map((h, j) => <li key={j}>{h.text}</li>)}</ol></details>}
            {open === i && (
              <SentenceBuilder initial={e?.tokens ?? splitWords(before)} before={before} sceneWords={c.words} saveLabel="บันทึกฉบับหลัง"
                onCancel={() => setOpen(null)}
                onSave={(tokens, t) => { update((g) => saveEntry(g, c.missionId, c.playerId, key, { text: t, tokens, meta: { before } }, true)); setOpen(null); }} />
            )}
          </div>
        );
      })}
      {!c.readOnly && (
        <form className="free-row" onSubmit={(ev) => {
          ev.preventDefault();
          if (!extra.trim()) return;
          const key = `${s.id}.x${Date.now()}`;
          update((g) => { getWork(g, c.missionId, c.playerId).items[key] = [{ id: key, text: '', history: [], meta: { before: extra.trim() }, at: Date.now() }]; });
          setExtra('');
        }}>
          <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="เพิ่มประโยคที่ผิดซึ่งพบเอง เช่น จากเพื่อน…" aria-label="เพิ่มประโยคที่ผิด" />
          <button className="btn sm">＋ เพิ่มประโยคที่ต้องตรวจ</button>
        </form>
      )}
    </div>
  );
}

function CarryBlock({ c, s }: { c: Ctx; s: Extract<Section, { kind: 'carry' }> }) {
  const { game } = useGame();
  const w = readWork(game, s.mission, c.playerId);
  const m = missionById(s.mission);
  const entries = Object.entries(w.items).filter(([k]) => !s.keys || s.keys.some((x) => k === x || k.startsWith(x + '.'))).flatMap(([, v]) => v).filter((e) => e.text);
  const drawings = Object.values(w.drawings);
  return (
    <div className="carry">
      <div className="carry-head">จากภารกิจ {m.zone_name} · {m.area}</div>
      {entries.length === 0 && drawings.length === 0 ? <p className="muted">ยังไม่มีผลงานจากภารกิจก่อนหน้าของผู้เล่นคนนี้ (ทำต่อได้ตามปกติ)</p> : (
        <>
          <ul className="carry-list">{entries.map((e) => <li key={e.id}>{e.text}</li>)}</ul>
          <div className="thumbs">{drawings.map((d, i) => <img key={i} src={d} alt="ภาพที่วาดไว้" />)}</div>
        </>
      )}
    </div>
  );
}

export function WorkEditor({ missionId, playerId, readOnly }: { missionId: string; playerId: string; readOnly?: boolean }) {
  const { game, update } = useGame();
  const spec = SPECS[missionId];
  const w = readWork(game, missionId, playerId);
  const c: Ctx = { missionId, playerId, words: spec.words, readOnly };

  return (
    <div className="work">
      {spec.sections.map((s, si) => {
        switch (s.kind) {
          case 'list':
            return <section key={si} className="sec"><EntryBlock c={c} k={s.id} label={s.label} tag={s.tag} />
              {s.min && <p className={`need ${(w.items[s.id]?.length ?? 0) >= s.min ? 'ok' : ''}`}>คำสั่งกำหนดอย่างน้อย {s.min} รูปแบบ · ตอนนี้ {w.items[s.id]?.length ?? 0}</p>}</section>;
          case 'slots':
            return <section key={si} className="sec"><h3>{s.label}</h3><div className="slots">{s.slots.map((sl) => <EntryBlock key={sl.id} c={c} k={`${s.id}.${sl.id}`} label={sl.label} single />)}</div></section>;
          case 'listeners':
            return (
              <section key={si} className="sec"><h3>{s.label}</h3>
                <div className="listeners">{s.listeners.map((l) => (
                  <div key={l} className={`listener-card l-${['ผู้ใหญ่', 'แม่', 'คุณครู'].includes(l) ? 'adult' : l === 'เพื่อน' ? 'friend' : 'young'}`} data-testid={`listener-${l}`}>
                    <div className="listener-head"><span className="listener-face">{l === 'แม่' ? '👩' : l === 'คุณครู' ? '🧑‍🏫' : l === 'ผู้ใหญ่' ? '🧓' : l === 'เพื่อน' ? '🧒' : '👶'}</span>
                      <div><small>การ์ดผู้ฟัง</small><b>{l}</b></div></div>
                    {s.slots.map((sl) => <EntryBlock key={sl.id} c={c} k={`${s.id}.${l}.${sl.id}`} label={`${sl.label} (สำหรับ${l})`} single={!sl.multi} plain={sl.id === 'reason' || sl.id === 'point'} />)}
                  </div>
                ))}</div>
              </section>
            );
          case 'modifiers':
            return <section key={si} className="sec"><h3>{s.label}</h3><ModifierBlock c={c} s={s} /></section>;
          case 'revise':
            return <section key={si} className="sec"><h3>{s.label}</h3><ReviseBlock c={c} s={s} /></section>;
          case 'drawing': {
            const bg = s.carry ? readWork(game, s.carry.mission, playerId).drawings[s.carry.drawing] : undefined;
            return (
              <section key={si} className="sec"><h3>🎨 {s.label}</h3>
                {readOnly ? (w.drawings[s.id] ? <img className="drawing-view" src={w.drawings[s.id]} alt={s.label} /> : <p className="muted">ยังไม่มีภาพ</p>) :
                  <DrawingPad value={w.drawings[s.id]} background={bg} onSave={(d) => update((g) => {
                    const ww = getWork(g, missionId, playerId);
                    ww.drawings[s.id] = d;
                    if (ww.status !== 'draft' && ww.status !== 'revise') ww.status = 'draft';
                  })} />}
                {bg && !w.drawings[s.id] && !readOnly && <p className="muted">เริ่มจากภาพเดิมที่วาดไว้ในภารกิจก่อนหน้า</p>}
              </section>
            );
          }
          case 'text':
            return <section key={si} className="sec"><EntryBlock c={c} k={s.id} label={s.label} single plain /></section>;
          case 'checklist':
            return (
              <section key={si} className="sec"><h3>✅ {s.label}</h3><p className="muted">นักเรียนตรวจตนเอง (ไม่ใช่การให้คะแนน)</p>
                <ul className="checklist">{s.items.map((it, i) => {
                  const k = `${s.id}.${i}`;
                  return <li key={k}><label><input type="checkbox" disabled={readOnly} checked={!!w.checks[k]} onChange={(e) => update((g) => { getWork(g, missionId, playerId).checks[k] = e.target.checked; })} /> {it}</label></li>;
                })}</ul>
              </section>
            );
          case 'carry':
            return <section key={si} className="sec carry-sec"><h3>📎 {s.label}</h3><CarryBlock c={c} s={s} /></section>;
        }
      })}
    </div>
  );
}

/** นับจำนวนคำตอบในชิ้นงาน (ใช้แสดงความคืบหน้าเท่านั้น ไม่ใช่คะแนน) */
export function countEntries(w: Work) {
  return Object.values(w.items).flat().filter((e) => e.text).length + Object.keys(w.drawings).length;
}
