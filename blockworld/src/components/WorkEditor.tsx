import { useState } from 'react';
import { MISSIONS, type Mission } from '../data';
import { ensureWork, getWork, uid, type Entry, type GameState, type Update } from '../store';
import { downloadDataUrl, segment } from '../util';
import DrawingPad from './DrawingPad';
import SentenceBuilder, { AUD_ICON, type BuiltSentence } from './SentenceBuilder';

const STATUS_TEXT = { draft: 'กำลังทำ', submitted: 'ส่งให้ครูแล้ว รอตรวจ', approved: 'ครูรับรองแล้ว', revise: 'ครูให้ปรับปรุง' } as const;

// ผลงานรายบุคคลของผู้เล่น 1 คนในภารกิจ 1 ใบ
export default function WorkEditor({ state, update, mission, playerId, locked, timeUp }: {
  state: GameState; update: Update; mission: Mission; playerId: string; locked: boolean; timeUp: boolean;
}) {
  const cfg = mission.work;
  const work = getWork(state, mission.id, playerId);
  const player = state.players.find((p) => p.id === playerId)!;
  const [seed, setSeed] = useState<{ blocks: string[]; before?: string; key: number }>({ blocks: [], key: 0 });
  const [editing, setEditing] = useState<Entry | null>(null);
  const readOnly = locked || work.status === 'approved';

  const mutate = (fn: (w: ReturnType<typeof ensureWork>) => void) =>
    update((d) => {
      const w = ensureWork(d, mission.id, playerId);
      fn(w);
      w.updatedAt = Date.now();
      if (w.status === 'submitted') w.status = 'draft';
    });

  const addEntry = (s: BuiltSentence) => {
    const entry: Entry = { id: uid(), ...s, before: seed.before, timeUp: timeUp || undefined, at: Date.now() };
    mutate((w) => { w.entries.push(entry); });
    setSeed({ blocks: [], key: seed.key + 1 });
  };

  const saveEdit = (s: BuiltSentence) => {
    if (!editing) return;
    mutate((w) => {
      const e = w.entries.find((x) => x.id === editing.id);
      if (!e) return;
      if (e.text !== s.text && !e.before) e.before = e.text;
      Object.assign(e, s, { audience: s.audience ?? e.audience, revisedAt: Date.now() });
    });
    setEditing(null);
  };

  const prevDrawings = MISSIONS.filter((m) => m.area_id === mission.area_id && m.zone < mission.zone).flatMap((m) =>
    getWork(state, m.id, playerId).drawings.map((src, i) => ({ src, label: `โซน ${m.zone} ภาพที่ ${i + 1}` })),
  );

  const covered = new Set(work.entries.flatMap((e) => e.tags));
  const audHas = (a: string, t: string) => work.entries.some((e) => e.audience === a && e.tags.includes(t));

  return (
    <div className="work" data-testid="work-editor">
      <div className="work-head">
        <h3>
          <span className="dot" style={{ background: player.color }} /> ผลงานของ {player.name}
        </h3>
        <span className={`status s-${work.status}`}>{STATUS_TEXT[work.status]}</span>
      </div>
      {work.teacherComment && work.status === 'revise' && <div className="callout warn">🦉 ครูให้ปรับปรุง: {work.teacherComment}</div>}
      {locked && <div className="callout">🔒 โซนนี้ยังไม่เปิด อ่านภารกิจได้ แต่บันทึกผลงานได้เมื่อทีมผ่านบอสโซนก่อนหน้า</div>}

      {cfg.given_words && (
        <p className="given">คำที่กำหนด: {cfg.given_words.map((w) => <span key={w} className="wblock static">{w}</span>)}</p>
      )}
      {cfg.audience_note && <p className="muted">{cfg.audience_note}</p>}

      {cfg.fix && !readOnly && (
        <div className="fixlist">
          <p className="label">ประโยคที่ต้องตรวจสอบและแก้ไข (แตะเพื่อนำขึ้นแท่น)</p>
          <div className="chips">
            {cfg.fix.map((b) => (
              <button key={b} className="chip broken" onClick={() => setSeed({ blocks: segment(b), before: b.replace(/\s+/g, ' '), key: seed.key + 1 })}>
                ✎ {b}
              </button>
            ))}
          </div>
          {seed.before && <p className="muted">กำลังแก้: “{seed.before}” — ฉบับก่อนจะถูกเก็บไว้เทียบกับฉบับหลัง</p>}
        </div>
      )}
      {cfg.base && !readOnly && (
        <button className="btn small" onClick={() => setSeed({ blocks: segment(cfg.base!), key: seed.key + 1 })}>
          เริ่มจากประโยค “{cfg.base}”
        </button>
      )}

      {!editing && (
        <SentenceBuilder
          config={cfg}
          initialBlocks={seed.blocks}
          resetKey={`${mission.id}-${playerId}-${seed.key}`}
          disabled={readOnly}
          onSave={addEntry}
          saveLabel={cfg.fix ? 'บันทึกประโยคที่แก้แล้ว' : 'บันทึกประโยค'}
        />
      )}
      {editing && (
        <div className="editing">
          <p className="label">แก้ไขประโยค (ระบบเก็บฉบับก่อนไว้)</p>
          <SentenceBuilder config={{ ...cfg, audiences: undefined }} initial={editing} resetKey={editing.id} onSave={saveEdit} onCancel={() => setEditing(null)} saveLabel="บันทึกฉบับแก้ไข" />
        </div>
      )}

      {(cfg.required_tags || cfg.required_audience_tags) && (
        <div className="coverage">
          <p className="label">ความครบถ้วนตามภารกิจ (ช่วยตรวจตัวเอง ไม่ใช่การให้คะแนน)</p>
          {cfg.required_tags && (
            <div className="chips">
              {cfg.required_tags.map((t) => <span key={t} className={`chip ${covered.has(t) ? 'done' : ''}`}>{covered.has(t) ? '✓' : '○'} {t}</span>)}
            </div>
          )}
          {cfg.required_audience_tags && cfg.audiences && (
            <table className="mini">
              <thead><tr><th />{cfg.audiences.map((a) => <th key={a}>{AUD_ICON[a]} {a}</th>)}</tr></thead>
              <tbody>
                {['เล่าเรื่อง', ...cfg.required_audience_tags].map((t) => (
                  <tr key={t}><td>{t}</td>{cfg.audiences!.map((a) => <td key={a}>{audHas(a, t) ? '✓' : '○'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="entries">
        <p className="label">ประโยคที่บันทึกแล้ว ({work.entries.length})</p>
        {work.entries.length === 0 && <p className="muted">ยังไม่มีประโยค</p>}
        <ol>
          {work.entries.map((e, i) => (
            <li key={e.id} className="entry" data-testid="entry">
              <div className="entry-text">
                {e.before && e.before !== e.text && <span className="before">ฉบับก่อน: <s>{e.before}</s> →</span>}
                <strong>{e.text}</strong>
              </div>
              <div className="entry-meta">
                {e.audience && <span className="tag aud">{AUD_ICON[e.audience]} {e.audience}</span>}
                {e.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                {e.parts.map((t) => <span key={t} className="tag part">ขยาย{t}</span>)}
                {e.selfCheck.length > 0 && <span className="tag check">ตรวจเอง {e.selfCheck.length} ข้อ</span>}
                {e.timeUp && <span className="tag late">หลังหมดเวลา</span>}
                {e.revisedAt && <span className="tag">แก้ไขแล้ว</span>}
              </div>
              {e.explanation && <p className="expl">เหตุผล: {e.explanation}</p>}
              {!readOnly && (
                <div className="entry-ctl">
                  <button className="btn tiny" onClick={() => setEditing(e)}>แก้ไข</button>
                  <button className="btn tiny" disabled={i === 0} onClick={() => mutate((w) => { [w.entries[i - 1], w.entries[i]] = [w.entries[i], w.entries[i - 1]]; })}>▲</button>
                  <button className="btn tiny" disabled={i === work.entries.length - 1} onClick={() => mutate((w) => { [w.entries[i + 1], w.entries[i]] = [w.entries[i], w.entries[i + 1]]; })}>▼</button>
                  <button className="btn tiny ghost" onClick={() => confirm('ลบประโยคนี้?') && mutate((w) => { w.entries.splice(i, 1); })}>ลบ</button>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {cfg.drawing && (
        <div className="drawings">
          <p className="label">ภาพประกอบ ({work.drawings.length})</p>
          {prevDrawings.length > 0 && (
            <>
              <p className="muted">ภาพเรื่องราวที่ออกแบบไว้ในโซนก่อน (ชี้ภาพประกอบได้)</p>
              <div className="thumbs">{prevDrawings.map((d) => <figure key={d.src.slice(-40) + d.label}><img src={d.src} alt={d.label} /><figcaption>{d.label}</figcaption></figure>)}</div>
            </>
          )}
          <div className="thumbs">
            {work.drawings.map((src, i) => (
              <figure key={i}>
                <img src={src} alt={`ภาพที่ ${i + 1}`} />
                <figcaption>
                  ภาพที่ {i + 1}{' '}
                  <button className="btn tiny" onClick={() => downloadDataUrl(`${player.name}-${mission.id}-${i + 1}.png`, src)}>ดาวน์โหลด</button>{' '}
                  {!readOnly && <button className="btn tiny ghost" onClick={() => confirm('ลบภาพนี้?') && mutate((w) => { w.drawings.splice(i, 1); })}>ลบ</button>}
                </figcaption>
              </figure>
            ))}
          </div>
          {!readOnly && <DrawingPad onSave={(src) => mutate((w) => { w.drawings.push(src); })} />}
        </div>
      )}

      {cfg.explanation && (
        <label className="field">
          <span className="label">อธิบายเหตุผลประกอบผลงาน (ภาพรวม)</span>
          <textarea className="input" rows={3} value={work.explanation} disabled={readOnly}
            onChange={(e) => { const v = e.target.value; mutate((w) => { w.explanation = v; }); }} />
        </label>
      )}

      {!readOnly && (
        <div className="row gap">
          <button className="btn accent" data-testid="submit-work" disabled={work.entries.length === 0 && work.drawings.length === 0}
            onClick={() => update((d) => { const w = ensureWork(d, mission.id, playerId); w.status = 'submitted'; w.updatedAt = Date.now(); })}>
            📤 ส่งให้ครูตรวจ
          </button>
          {work.status === 'submitted' && <span className="muted">ส่งแล้ว ถ้าแก้ไขต่อ ต้องกดส่งใหม่</span>}
        </div>
      )}
    </div>
  );
}
