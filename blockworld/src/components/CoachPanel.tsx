import { useState } from 'react';
import { COACH, type Mission } from '../data';
import { addLog, ensureWork, getWork, hasIdea, type GameState, type Update } from '../store';
import { fmtTime } from '../util';

// การโค้ช: คำถามโค้ชตามขั้น + ครูรับรอง / ให้ปรับปรุง / บันทึกข้อสังเกต
// ไม่มีการตรวจคำตอบด้วยการเทียบข้อความ ครูเป็นผู้ตัดสินเอง
export default function CoachPanel({ state, update, mission }: { state: GameState; update: Update; mission: Mission }) {
  const [situation, setSituation] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const c = COACH[situation];
  const setDraft = (id: string, v: string) => setDrafts({ ...drafts, [id]: v });

  const act = (playerId: string, kind: 'approve' | 'revise' | 'note') => {
    const text = (drafts[playerId] ?? '').trim();
    if (kind !== 'approve' && !text) return alert('พิมพ์ข้อความก่อน');
    update((d) => {
      const w = ensureWork(d, mission.id, playerId);
      const name = d.players.find((p) => p.id === playerId)?.name;
      if (kind === 'approve') {
        w.status = 'approved';
        if (text) w.notes.push({ by: 'teacher', text, at: Date.now() });
        addLog(d, `ครูรับรองผลงานของ ${name} ภารกิจ ${mission.id}`);
      } else if (kind === 'revise') {
        w.status = 'revise';
        w.teacherComment = text;
        w.notes.push({ by: 'teacher', text: `ให้ปรับปรุง: ${text}`, at: Date.now() });
        addLog(d, `ครูให้ ${name} ปรับปรุงภารกิจ ${mission.id}`);
      } else {
        w.notes.push({ by: 'teacher', text, at: Date.now() });
      }
    });
    setDraft(playerId, '');
  };

  return (
    <section className="coach" data-testid="coach-panel">
      <h3>🦉 การโค้ช (แผงครู)</h3>
      <div className="coach-ladder">
        <label className="row gap wrap">
          <span>สถานการณ์ที่พบ</span>
          <select className="input" value={situation} onChange={(e) => setSituation(+e.target.value)}>
            {COACH.map((x, i) => <option key={x.situation} value={i}>{x.situation}</option>)}
          </select>
        </label>
        <div className="ladder">
          <div><b>ขั้น 1 ถามให้คิด</b><ul>{c.step1.map((q) => <li key={q}>{q}</li>)}</ul></div>
          <div><b>ขั้น 2 ชี้แนะมากขึ้น</b><ul>{c.step2.map((q) => <li key={q}>{q}</li>)}</ul></div>
        </div>
      </div>
      {state.players.map((p) => {
        const w = getWork(state, mission.id, p.id);
        return (
          <div key={p.id} className="coach-row" data-testid="coach-row">
            <div className="row gap wrap">
              <b><span className="dot" style={{ background: p.color }} /> {p.name}</b>
              <span className={`status s-${w.status}`}>{w.status === 'approved' ? 'รับรองแล้ว' : w.status === 'submitted' ? 'ส่งแล้ว' : w.status === 'revise' ? 'ให้ปรับปรุง' : 'ยังไม่ส่ง'}</span>
              <span className="muted">{w.entries.length} ประโยค · {w.drawings.length} ภาพ · ไอเดีย {hasIdea(state, mission.id, p.id) ? '✓' : '—'}</span>
            </div>
            <ol className="coach-entries">
              {w.entries.map((e) => (
                <li key={e.id}>
                  {e.before && e.before !== e.text && <s className="muted">{e.before}</s>} {e.text}
                  {e.audience && <span className="tag aud">{e.audience}</span>}
                  {e.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                  {e.parts.map((t) => <span key={t} className="tag part">ขยาย{t}</span>)}
                  {e.timeUp && <span className="tag late">หลังหมดเวลา</span>}
                  {e.explanation && <div className="expl">เหตุผล: {e.explanation}</div>}
                </li>
              ))}
            </ol>
            {w.drawings.length > 0 && <div className="thumbs small">{w.drawings.map((src, i) => <img key={i} src={src} alt={`ภาพ ${i + 1}`} />)}</div>}
            {w.explanation && <p className="expl">คำอธิบายภาพรวม: {w.explanation}</p>}
            {w.notes.length > 0 && <ul className="notes">{w.notes.map((n, i) => <li key={i}>📝 {n.text} <small className="muted">{fmtTime(n.at)}</small></li>)}</ul>}
            <div className="row gap wrap">
              <input className="input grow" placeholder="ความเห็น / ข้อสังเกตของครู" value={drafts[p.id] ?? ''} onChange={(e) => setDraft(p.id, e.target.value)} />
              <button className="btn small ok" data-testid="approve" onClick={() => act(p.id, 'approve')}>✓ รับรองคำตอบ</button>
              <button className="btn small warn" onClick={() => act(p.id, 'revise')}>↺ ให้ปรับปรุง</button>
              <button className="btn small" onClick={() => act(p.id, 'note')}>📝 บันทึกข้อสังเกต</button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
