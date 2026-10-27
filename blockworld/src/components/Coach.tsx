// 7. การโค้ช — คำถามปลายเปิดสำหรับทุกคน และแผงครู (ล็อกด้วย PIN แบบง่าย ไม่ใช่ระบบรักษาความปลอดภัยเชิงบัญชี)
import { useState } from 'react';
import { COACH_GENERAL, INDICATORS } from '../data/learning';
import { QUESTS } from '../data/quests';
import { useStarted } from '../game/store';
import { addCoachNote, approveWork, findWork, playerName, requestRevision } from '../game/rules';
import type { Work } from '../game/types';
import { Drawer, SpeakButton, StatusChip } from './ui';

export function PinGate({ children }: { children: React.ReactNode }) {
  const { state, coachUnlocked, setCoachUnlocked, toast } = useStarted();
  const [pin, setPin] = useState('');
  if (coachUnlocked) return <>{children}</>;
  const tryPin = () => (pin === state.settings.pin ? setCoachUnlocked(true) : toast('PIN ไม่ถูกต้อง'));
  return (
    <div className="pin-row">
      <label htmlFor="coach-pin">🔐 สำหรับครู/โค้ช ใส่ PIN</label>
      <input id="coach-pin" type="password" inputMode="numeric" value={pin} size={6} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tryPin()} />
      <button type="button" className="btn" onClick={tryPin}>🔓 เข้าโหมดครู</button>
      <span className="muted small">PIN ตั้งต้นคือ 1234 เปลี่ยนได้ในแดชบอร์ดครู</span>
    </div>
  );
}

export function openWorkModal(w: Work) {
  if (w.kind === 'mission') return { type: 'mission' as const, workId: w.id };
  if (w.kind === 'boss') return { type: 'boss' as const };
  if (w.kind === 'tower') return { type: 'tower' as const };
  return { type: 'history' as const };
}

export function CoachPanel() {
  const { state, setState, openDrawer, open, coachUnlocked, setCoachUnlocked } = useStarted();
  const work = findWork(state, state.currentMission);
  const quest = QUESTS.find((q) => q.id === work?.refId);
  const questions = [...(quest?.coachQuestions ?? []), ...COACH_GENERAL];
  const pending = state.works.filter((w) => w.status === 'pending');
  const [note, setNote] = useState('');
  const [who, setWho] = useState('');
  const [ind, setInd] = useState('');

  return (
    <Drawer title="7. การโค้ช" icon="🧑‍🏫" onClose={() => openDrawer(null)}>
      <section>
        <h3>❓ คำถามชวนคิด {quest ? `· ${quest.title}` : ''}</h3>
        <p className="muted">โค้ชถาม นักเรียนอธิบายเหตุผลด้วยคำพูดของตนเอง ไม่มีคำตอบเดียวที่ถูก</p>
        <ul className="coach-q">{questions.map((q) => <li key={q}>💬 {q} <SpeakButton text={q} /></li>)}</ul>
      </section>
      <section>
        <h3>🔐 แผงครู/โค้ช</h3>
        <PinGate>
          <div className="row-actions">
            <button type="button" className="btn small" onClick={() => { openDrawer(null); open({ type: 'dashboard' }); }}>📊 แดชบอร์ดครู</button>
            <button type="button" className="btn small ghost" onClick={() => setCoachUnlocked(false)}>🔒 ออกจากโหมดครู</button>
          </div>
          <h4>⏳ ผลงานรอตรวจ ({pending.length})</h4>
          {!pending.length && <p className="muted">ยังไม่มีผลงานรอตรวจ</p>}
          <ul className="pending">
            {pending.map((w) => (
              <li key={w.id}>
                <div><strong>{w.title}</strong> <span className="muted">โดย {playerName(state, w.authorId)}</span> <StatusChip status={w.status} /></div>
                <div className="small">{Object.values(w.answers).map((a) => a.final).filter(Boolean).join(' / ') || (w.items ?? []).map((i) => i.text).join(' / ')}</div>
                <div className="row-actions">
                  <button type="button" className="btn small good" onClick={() => setState((s) => approveWork(s, w.id, 'coach'))}>✅ รับรองผ่าน</button>
                  <button type="button" className="btn small warn" onClick={() => setState((s) => requestRevision(s, w.id, note))}>🔁 ให้ปรับปรุง</button>
                  <button type="button" className="btn small ghost" onClick={() => { openDrawer(null); open(openWorkModal(w)); }}>👀 เปิดดูทั้งหมด</button>
                </div>
              </li>
            ))}
          </ul>
          <h4>📝 บันทึกข้อสังเกตเชิงพฤติกรรม</h4>
          <div className="note-form">
            <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="นักเรียน">
              <option value="">ทั้งทีม</option>
              {state.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={ind} onChange={(e) => setInd(e.target.value)} aria-label="ตัวบ่งชี้">
              <option value="">ตัวบ่งชี้ (ไม่บังคับ)</option>
              {INDICATORS.map((g) => (
                <optgroup key={g.tag} label={`${g.tag} ${g.name}`}>
                  {g.items.map((i) => <option key={i.code} value={i.code}>{i.code} {g.name}: {i.text}</option>)}
                </optgroup>
              ))}
            </select>
            <textarea className="answer" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น อธิบายเหตุผลการเรียงคำได้ชัดเจน / เสนอถ้อยคำหลายแบบ" aria-label="ข้อสังเกต" />
            <button type="button" className="btn small" disabled={!note.trim() || !coachUnlocked}
              onClick={() => { setState((s) => addCoachNote(s, { text: note.trim(), playerId: who || undefined, indicator: ind || undefined, workId: work?.id })); setNote(''); }}>
              💾 บันทึกข้อสังเกต
            </button>
          </div>
        </PinGate>
      </section>
    </Drawer>
  );
}
