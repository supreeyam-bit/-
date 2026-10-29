// แดชบอร์ดครู: ความคืบหน้า 12 ภารกิจหลักตามตารางที่ 2 ตารางตัวบ่งชี้ 1.1–4.3 รายคน ผลงานรายคน (ก่อนแก้/หลังแก้) บันทึกพฤติกรรม 4 ด้าน และการส่งออกข้อมูล
import { useState } from 'react';
import { HELP_TYPES, INDICATORS, TAG_NAMES } from '../data/learning';
import { AREAS, BOSSES, MISSIONS, ZONES } from '../data/quests';
import { useStarted } from '../game/store';
import { clearSave, download, exportCSV, exportJSON, indicatorEvidence, playerName, slotLabel } from '../game/rules';
import { PinGate } from './Coach';
import { Modal, StatusChip } from './ui';

export const DISCLAIMER = 'ข้อมูลกิจกรรมฝึก ไม่ใช่คะแนนเครื่องมือวิจัยที่ผ่านการตรวจสอบ';

export function TeacherDashboard() {
  const { state, setState, close, replaceState, setCoachUnlocked } = useStarted();
  const [student, setStudent] = useState(state.players[0].id);
  const [pin, setPin] = useState(state.settings.pin);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const works = state.works.filter((w) => w.participants.includes(student));

  const reset = () => {
    if (!window.confirm('รีเซ็ตเกมใช่ไหม? ความคืบหน้าและผลงานทั้งหมดในเครื่องนี้จะถูกลบ (แนะนำให้ส่งออกข้อมูลก่อน)')) return;
    clearSave();
    setCoachUnlocked(false);
    close();
    replaceState(null);
  };

  return (
    <Modal title="แดชบอร์ดครู" icon="📊" onClose={close} wide>
      <PinGate>
        <div className="disclaimer" role="note">⚠️ {DISCLAIMER} — ระบบตรวจเบื้องต้นเป็นเพียงคำแนะนำ การให้ผ่านขึ้นกับการพิจารณาของครู/โค้ช ตัวบ่งชี้ด้านล่างเป็นช่องบันทึก ยังไม่เท่ากับการให้คะแนนตาม rubric จริง</div>

        <h3>📈 ความคืบหน้า 12 ภารกิจหลัก (ตารางที่ 2)</h3>
        <div className="dash-zones">
          {ZONES.map((z) => (
            <div key={z.id} className="dash-zone" style={{ borderColor: z.colors.main }}>
              <strong style={{ color: z.colors.dark }}>{z.name}</strong>
              <ol>
                {MISSIONS.filter((q) => q.zone === z.id).map((q) => (
                  <li key={q.id}>{AREAS[q.area].symbol} {q.areaName} ({q.indicators.join(', ')}) <StatusChip status={state.missionProgress[MISSIONS.indexOf(q)]} /></li>
                ))}
              </ol>
              <div>บอส {BOSSES[z.id].name}: <StatusChip status={state.bossStatus[z.id]} /></div>
            </div>
          ))}
        </div>
        <p>💎 คริสตัล {state.crystalCount}/3 · 🗼 หอคอย {state.towerProgress.filter(Boolean).length}/4 · 🧱 บล็อกคงเหลือ {state.blocks} · 🏗️ สิ่งก่อสร้าง {state.builds.length}</p>

        <h3>👥 ผู้เล่น</h3>
        <table className="dash-table">
          <thead><tr><th>ชื่อ</th><th>ผลงานที่มีส่วนร่วม</th><th>ผ่านแล้ว</th><th>ความคิดเห็นต่อเพื่อน</th><th>ขอความช่วยเหลือ</th><th>ทอยเต๋า</th></tr></thead>
          <tbody>
            {state.players.map((p) => {
              const mine = state.works.filter((w) => w.participants.includes(p.id));
              return (
                <tr key={p.id}>
                  <td>{p.avatar} {p.name}</td>
                  <td>{mine.length}</td>
                  <td>{mine.filter((w) => w.status === 'approved').length}</td>
                  <td>{state.works.reduce((n, w) => n + w.exchange.filter((e) => e.by === p.id).length, 0)}</td>
                  <td>{HELP_TYPES.map((h) => `${h.icon}${state.helpUsed.filter((x) => x.playerId === p.id && x.type === h.type).length}`).join(' ')}</td>
                  <td>{state.diceHistory.filter((d) => d.playerId === p.id).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h3>🗂️ ชิ้นงานรายคน</h3>
        <div className="speakers">
          {state.players.map((p) => (
            <button key={p.id} type="button" className={`speaker ${student === p.id ? 'on' : ''}`} style={{ borderColor: p.color }} onClick={() => setStudent(p.id)}>{p.avatar} {p.name}</button>
          ))}
        </div>
        {!works.length && <p className="muted">ยังไม่มีผลงาน</p>}
        <div className="work-list">
          {works.map((w) => (
            <article key={w.id} className="work-card">
              <header>
                <strong>{w.title}</strong> <StatusChip status={w.status} />
                <span className="muted small"> {w.authorId === student ? 'ผู้เขียนหลัก' : 'ผู้ร่วมคิด'} · {new Date(w.startedAt).toLocaleString('th-TH')}{w.endedAt ? ` – ${new Date(w.endedAt).toLocaleTimeString('th-TH')}` : ''}</span>
              </header>
              {w.problem && (w.problem.what || w.problem.how) && <div className="small">🧩 ปัญหา: {w.problem.what} · แนวทาง: {w.problem.how}</div>}
              {Object.entries(w.answers).filter(([k]) => k.startsWith(`${student}|`) || (!k.includes('|') && w.authorId === student)).map(([k, a]) => (
                <div key={k} className="ba">
                  <span className="muted">{slotLabel(w, k)}</span>
                  <div>ก่อนแก้: {a.first || a.final || '—'}</div>
                  <div>หลังแก้: {a.final || '—'} {a.history.length > 1 && <span className="muted">(แก้ {a.history.length - 1} ครั้ง)</span>}</div>
                </div>
              ))}
              {(w.items ?? []).length > 0 && (
                <ul className="small">{w.items!.filter((i) => i.by === student).map((i, n) => <li key={n}>{i.tag ? `[${i.tag}] ` : ''}{i.first !== i.text ? <><s className="muted">{i.first}</s> → </> : null}{i.text}</li>)}</ul>
              )}
              {w.drawings?.[student] && <img className="thumb" src={w.drawings[student]} alt="ภาพประกอบ" />}
              {w.ratings?.[student] !== undefined && <div className="small">🎮 คะแนนกิจกรรมในเกม: {w.ratings[student]}/4</div>}
              {w.reason && <div className="small">💭 เหตุผล: {w.reason}</div>}
              {w.exchange.length > 0 && <div className="small">💬 {w.exchange.map((e) => `${playerName(state, e.by)}: ${e.text}`).join(' | ')}</div>}
              {w.help.length > 0 && <div className="small">🆘 ใช้ความช่วยเหลือ: {w.help.join(', ')}</div>}
              {w.feedback.length > 0 && <div className="small">🧑‍🏫 {w.feedback.map((f) => f.text).join(' | ')}</div>}
              {w.creativityTags.length > 0 && <div className="small">✨ {w.creativityTags.map((t) => TAG_NAMES[t]).join(' · ')}</div>}
            </article>
          ))}
        </div>

        <h3>🧮 ผลงานรายบุคคลตามตัวบ่งชี้ 1.1–4.3 (จากภารกิจหลักที่ผ่านการรับรอง)</h3>
        <div className="score-split">
          <div><strong>🎮 คะแนนกิจกรรมในเกม</strong> — ครูให้ 0–4 ต่อคนต่อภารกิจ เพื่อให้ข้อมูลย้อนกลับเท่านั้น</div>
          <div><strong>📋 คะแนนเครื่องมือวิจัย</strong> — วัดด้วยแบบวัดการคิดสร้างสรรค์ฉบับจริงนอกเกม ระบบนี้ไม่คำนวณ ไม่เก็บ และไม่นำคะแนนในเกมไปรวมด้วย</div>
        </div>
        <table className="dash-table matrix">
          <thead>
            <tr><th>ผู้เล่น</th>{INDICATORS.flatMap((g) => g.items).map((i) => <th key={i.code} title={i.text}>{i.code}</th>)}</tr>
          </thead>
          <tbody>
            {state.players.map((p) => {
              const ev = indicatorEvidence(state, p.id);
              return (
                <tr key={p.id}>
                  <td>{p.avatar} {p.name}</td>
                  {INDICATORS.flatMap((g) => g.items).map((i) => {
                    const e = ev[i.code];
                    return (
                      <td key={i.code} title={i.text}>
                        {e ? <>📄{e.pieces}{e.rated ? <><br />🎮{(e.rating / e.rated).toFixed(1)}</> : null}</> : <span className="muted">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="muted small">📄 = จำนวนชิ้นคำตอบที่ผู้เล่นสร้างเองในภารกิจของตัวบ่งชี้นั้น · 🎮 = คะแนนกิจกรรมในเกมเฉลี่ย (0–4) · ชี้ที่รหัสเพื่อดูข้อความตัวบ่งชี้</p>

        <h3>✨ บันทึกเชิงพฤติกรรม 4 ด้าน</h3>
        <div className="indicator-grid">
          {INDICATORS.map((g) => (
            <div key={g.tag} className="ind-card">
              <strong>{g.tag} {g.name}</strong>
              <ul>
                {g.items.map((i) => {
                  const notes = state.coachNotes.filter((n) => n.indicator === i.code);
                  return (
                    <li key={i.code}>
                      {i.code} {i.text}: <strong>{notes.length}</strong> บันทึก
                      {notes.length > 0 && <ul className="small">{notes.map((n) => <li key={n.id}>{n.playerId ? playerName(state, n.playerId) : 'ทีม'}: {n.text}</li>)}</ul>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        {state.coachNotes.filter((n) => !n.indicator).length > 0 && (
          <>
            <h4>📝 ข้อสังเกตอื่น ๆ</h4>
            <ul className="small">{state.coachNotes.filter((n) => !n.indicator).map((n) => <li key={n.id}>{n.playerId ? playerName(state, n.playerId) : 'ทีม'}: {n.text}</li>)}</ul>
          </>
        )}

        <h3>💾 ส่งออกข้อมูล</h3>
        <p className="muted small">ข้อมูลเก็บในเครื่องนี้เท่านั้น (localStorage) ไม่ส่งไปเซิร์ฟเวอร์ใด ๆ</p>
        <div className="row-actions">
          <button type="button" className="btn" onClick={() => download(`blockworld-${stamp}.json`, exportJSON(state), 'application/json')}>⬇️ ส่งออก JSON</button>
          <button type="button" className="btn" onClick={() => download(`blockworld-${stamp}.csv`, exportCSV(state), 'text/csv;charset=utf-8')}>⬇️ ส่งออก CSV</button>
        </div>

        <h3>⚙️ ตั้งค่า</h3>
        <div className="settings">
          <label>
            วิธีรับรองผลงาน:{' '}
            <select value={state.settings.approvalMode} onChange={(e) => setState((s) => ({ ...s, settings: { ...s.settings, approvalMode: e.target.value as 'pin' | 'peer' } }))}>
              <option value="pin">ครู/โค้ชรับรองด้วย PIN</option>
              <option value="peer">เพื่อนทุกคนเห็นพ้อง (ครูตรวจย้อนหลัง)</option>
            </select>
          </label>
          <label>
            PIN ครู: <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} size={8} inputMode="numeric" />
            <button type="button" className="btn small" disabled={pin.length < 4} onClick={() => setState((s) => ({ ...s, settings: { ...s.settings, pin } }))}>บันทึก PIN</button>
          </label>
          <button type="button" className="btn warn" onClick={reset}>🗑️ รีเซ็ตเกม</button>
        </div>
      </PinGate>
    </Modal>
  );
}
