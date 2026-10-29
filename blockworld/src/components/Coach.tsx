import { useState } from 'react';
import { MISSIONS } from '../data';
import { coach, ideasShared, readWork, useGame } from '../store';
import { StatusBadge, fmtTime } from './ui';
import { WorkEditor, countEntries } from './WorkEditor';

/** การโค้ช: ครูอ่านชิ้นงานแล้วตัดสินเอง — รับรอง / ให้ปรับปรุง / บันทึกข้อสังเกต (ไม่มีการเทียบคำตอบอัตโนมัติ) */
export function CoachPanel({ missionId, playerId }: { missionId: string; playerId?: string }) {
  const { game, update, teacher } = useGame();
  const [note, setNote] = useState<Record<string, string>>({});
  const players = playerId ? game.players.filter((p) => p.id === playerId) : game.players;

  return (
    <div className="coach">
      {!teacher && <p className="note">ปุ่มของครู/โค้ชจะแสดงเมื่อเปิด <b>โหมดครู</b> (มุมขวาบน)</p>}
      {!ideasShared(game, missionId) && <p className="note warn">ยังมีผู้เล่นที่ไม่ได้เสนอไอเดียในแท็บแลกเปลี่ยนเรียนรู้ — ภารกิจจะสำเร็จเมื่อทุกคนเสนอแล้วและครูรับรองครบ</p>}
      {players.map((p) => {
        const w = readWork(game, missionId, p.id);
        const logs = game.coachLog.filter((l) => l.missionId === missionId && l.playerId === p.id);
        return (
          <div key={p.id} className="coach-card" style={{ borderColor: p.color }} data-testid={`coach-${p.name}`}>
            <div className="coach-head"><b>{p.token} {p.name}</b> <StatusBadge status={w.status} /> <small>{countEntries(w)} ชิ้น</small></div>
            <details open={w.status === 'submitted'}><summary>ดูชิ้นงาน</summary><WorkEditor missionId={missionId} playerId={p.id} readOnly /></details>
            {logs.length > 0 && <ul className="coach-log">{logs.map((l) => <li key={l.id}><span className={`chip c-${l.action}`}>{l.action === 'approve' ? 'รับรอง' : l.action === 'revise' ? 'ให้ปรับปรุง' : 'ข้อสังเกต'}</span> {l.text} <small>{fmtTime(l.at)}</small></li>)}</ul>}
            {teacher && (
              <div className="coach-actions teacher-only">
                <input value={note[p.id] ?? ''} onChange={(e) => setNote({ ...note, [p.id]: e.target.value })} placeholder="ข้อสังเกต / คำแนะนำให้ปรับปรุง" aria-label={`ข้อสังเกตสำหรับ ${p.name}`} />
                <div className="row">
                  <button className="btn ok" onClick={() => { update((g) => coach(g, missionId, p.id, 'approve', note[p.id])); setNote({ ...note, [p.id]: '' }); }}>✔ รับรองคำตอบ</button>
                  <button className="btn warn" onClick={() => { update((g) => coach(g, missionId, p.id, 'revise', note[p.id])); setNote({ ...note, [p.id]: '' }); }}>↻ ให้ปรับปรุง</button>
                  <button className="btn ghost" disabled={!note[p.id]?.trim()} onClick={() => { update((g) => coach(g, missionId, p.id, 'note', note[p.id])); setNote({ ...note, [p.id]: '' }); }}>📝 บันทึกข้อสังเกต</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** สถานีการโค้ชบนกระดาน: รายการชิ้นงานที่รอครูตรวจทั้งหมด */
export function CoachStation({ onOpen }: { onOpen: (missionId: string) => void }) {
  const { game } = useGame();
  const pending = MISSIONS.flatMap((m) => game.players.map((p) => ({ m, p, w: readWork(game, m.id, p.id) }))).filter((x) => x.w.status === 'submitted');
  return (
    <div>
      <p>การโค้ชเน้นคำถามชวนคิด ครูอ่านผลงานและตัดสินด้วยวิจารณญาณ ภาษาไทยและความคิดสร้างสรรค์ตอบได้หลายแบบ จึงไม่มีการตรวจด้วยการเทียบคำตอบเดียว</p>
      <h3>ชิ้นงานที่รอครูตรวจ ({pending.length})</h3>
      {pending.length === 0 ? <p className="muted">ยังไม่มีชิ้นงานที่ส่ง</p> : (
        <ul className="pending">{pending.map(({ m, p }) => (
          <li key={m.id + p.id}><span>{p.token} {p.name} · {m.zone_name} · {m.area}</span><button className="btn sm" onClick={() => onOpen(m.id)}>เปิดตรวจ</button></li>
        ))}</ul>
      )}
      <h3>คำถามโค้ชชวนคิด</h3>
      <ul>
        <li>ประโยคนี้บอกครบไหมว่า ใคร ทำอะไร</li><li>ถ้าเปลี่ยนผู้ฟัง ถ้อยคำจะเปลี่ยนอย่างไร</li>
        <li>ความคิดนี้แตกต่างจากเพื่อนอย่างไร</li><li>เพิ่มรายละเอียดตรงไหนได้อีก เพราะอะไร</li>
      </ul>
    </div>
  );
}
