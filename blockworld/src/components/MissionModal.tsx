// หน้าต่างภารกิจหลัก (ตารางที่ 2): สถานการณ์ปัญหา → ใบงานรายคน → แลกเปลี่ยนเรียนรู้ → ตรวจและรับรอง และกระดานภารกิจ
import { useState } from 'react';
import { AREAS, BOSSES, MISSIONS, SCENARIOS, ZONES } from '../data/quests';
import { useStarted } from '../game/store';
import {
  activePlayer, addCoachNote, answerOf, approveWork, commitAnswers, createWork, findWork, missionById, missionReady, missionSlotKeys,
  missionsOfZone, playerName, requestRevision, sheetMissing, submitForReview, updateWork, workForRef,
} from '../game/rules';
import type { GameState, Mission, Work } from '../game/types';
import { ApprovalPanel, ExchangePanel, ProblemStep, everyoneExchanged } from './Answering';
import { DixitGame } from './Mechanics';
import { PlayerTabs, Sheet } from './Sheet';
import { Modal, Scene, SpeakButton, StatusChip } from './ui';

const STEPS = ['1. สถานการณ์ปัญหา', '2. ใบงานของทุกคน', '3. แลกเปลี่ยนเรียนรู้', '4. ตรวจและรับรอง'];

export function SupportBar({ topic }: { topic?: number }) {
  const { openDrawer } = useStarted();
  return (
    <div className="support-bar" aria-label="ระบบสนับสนุน เปิดได้ทุกเวลา">
      <button type="button" className="btn small ghost" onClick={() => openDrawer({ type: 'learning', topic })}>📚 ศูนย์การเรียนรู้</button>
      <button type="button" className="btn small ghost" onClick={() => openDrawer({ type: 'help' })}>🆘 ฐานการช่วยเหลือ</button>
      <button type="button" className="btn small ghost" onClick={() => openDrawer({ type: 'coach' })}>🧑‍🏫 การโค้ช</button>
      <span className="muted small">เปิดได้ทุกเวลา ไม่เสียคะแนน</span>
    </div>
  );
}

export function TeacherOnly({ mission }: { mission: Mission }) {
  const { coachUnlocked } = useStarted();
  if (!coachUnlocked) return null;
  return (
    <details className="teacher-only">
      <summary>🔐 สำหรับครูเท่านั้น: คำใบ้และตัวอย่างคำตอบ (ไม่ใช่เฉลยตายตัว)</summary>
      <p><strong>คำใบ้:</strong> {mission.hint}</p>
      <ul>{mission.examplesForTeacher.map((e) => <li key={e}>{e}</li>)}</ul>
    </details>
  );
}

export function AreaBadge({ mission }: { mission: Mission }) {
  const a = AREAS[mission.area];
  return <span className="area-badge" style={{ background: a.color }} title={`รูป${a.shape}`}>{a.symbol} {a.name}</span>;
}

/** คะแนนกิจกรรมในเกม 0–4 รายคน (ครูให้เพื่อข้อมูลย้อนกลับ ไม่ใช่คะแนนเครื่องมือวิจัย) */
function GameRatings({ work }: { work: Work }) {
  const { state, setState, coachUnlocked } = useStarted();
  if (!coachUnlocked) return null;
  return (
    <div className="ratings">
      <strong>🎮 คะแนนกิจกรรมในเกม (0–4) รายคน</strong>
      <p className="muted small">ใช้ให้ข้อมูลย้อนกลับเท่านั้น แยกจากคะแนนเครื่องมือวิจัย และไม่นำไปรวมกัน</p>
      {state.players.map((p) => (
        <div key={p.id} className="rating-row">
          <span>{p.avatar} {p.name}</span>
          {[0, 1, 2, 3, 4].map((n) => (
            <button key={n} type="button" className={`rate ${work.ratings?.[p.id] === n ? 'on' : ''}`} aria-pressed={work.ratings?.[p.id] === n}
              onClick={() => setState((s) => updateWork(s, work.id, (w) => ({ ...w, ratings: { ...w.ratings, [p.id]: n } })))}>{n}</button>
          ))}
        </div>
      ))}
    </div>
  );
}

export function MissionModal({ workId }: { workId: string }) {
  const { state, setState, close, toast } = useStarted();
  const work = findWork(state, workId);
  const mission = missionById(work?.refId ?? '');
  const [step, setStep] = useState(() => (work && work.status !== 'draft' ? 3 : 0));
  const [pid, setPid] = useState(activePlayer(state).id);
  if (!work || !mission) return null;
  const zone = ZONES[mission.zone];
  const scen = SCENARIOS[mission.scenario];
  const exchanged = everyoneExchanged(work, state.players.map((p) => p.id));
  const ready = missionReady(work, mission, state.players);
  const commitAll = (s: GameState) => updateWork(s, work.id, (w) => commitAnswers(w, activePlayer(s).id));

  return (
    <Modal title={`${zone.stage} · ${mission.title}`} icon={AREAS[mission.area].symbol} onClose={close} wide tone={AREAS[mission.area].color}>
      <div className="mission-meta">
        <span className="zone-pill" style={{ background: zone.colors.main }}>{zone.name}</span>
        <AreaBadge mission={mission} />
        <span>ตัวบ่งชี้ {mission.indicators.join(', ')}</span>
        {mission.minutes && <span>⏱️ {mission.minutes} นาที</span>}
        <StatusChip status={work.status} />
      </div>
      <SupportBar topic={mission.lessons[0]} />
      <nav className="steps" aria-label="ขั้นตอนภารกิจ">
        {STEPS.map((s, i) => (
          <button key={s} type="button" className={`step ${step === i ? 'on' : ''}`} onClick={() => setStep(i)} aria-current={step === i ? 'step' : undefined}>{s}</button>
        ))}
      </nav>

      <div className="prompt">📜 <strong>คำสั่งภารกิจ (ตารางที่ 2):</strong> {mission.prompt} <SpeakButton text={mission.prompt} /></div>

      {step === 0 && (
        <section>
          <div className="story-card">
            <p className="story">📖 {zone.story} <SpeakButton text={zone.story} /></p>
            <Scene icons={scen.icons} caption={`สถานการณ์ “${scen.name}” — ${scen.text}`} tone={AREAS[mission.area].color} />
          </div>
          <ProblemStep work={work} zone={mission.zone} />
          <div className="row-actions"><button type="button" className="btn" onClick={() => setStep(1)}>ไปที่ใบงาน ➡️</button></div>
        </section>
      )}

      {step === 1 && (
        <section>
          <p className="muted">ทุกคนสร้างคำตอบด้วยตนเองในใบงานของตัวเอง ส่งเครื่องให้คนที่ถึงคิว แล้วแตะชื่อเพื่อเปิดใบงาน</p>
          <PlayerTabs work={work} mission={mission} pid={pid} setPid={setPid} />
          <Sheet key={pid} work={work} mission={mission} pid={pid} />
          {mission.dixit && <DixitGame work={work} />}
          <div className="criteria small">🏅 รางวัลในเกม: {mission.reward}</div>
          <div className="row-actions">
            <button type="button" className="btn ghost" onClick={() => { setState(commitAll); toast('บันทึกฉบับนี้ไว้ในประวัติแล้ว'); }}>💾 บันทึกฉบับนี้</button>
            <button type="button" className="btn" onClick={() => { setState(commitAll); setStep(2); }}>ไปแลกเปลี่ยนเรียนรู้ ➡️</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <TeamSummary work={work} mission={mission} />
          <ExchangePanel work={work} />
          <div className="row-actions">
            <button type="button" className="btn ghost" onClick={() => setStep(1)} disabled={work.status === 'approved'}>✏️ ปรับปรุงคำตอบ</button>
            <button type="button" className="btn" onClick={() => setStep(3)}>ไปตรวจและรับรอง ➡️</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <TeamSummary work={work} mission={mission} />
          <div className="criteria">
            <strong>🏅 เงื่อนไขของภารกิจ</strong>
            <ul>{mission.criteria.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <TeacherOnly mission={mission} />
          {(work.status === 'draft' || work.status === 'revise') && (
            <div className="row-actions">
              <button type="button" className="btn ghost" onClick={() => setStep(1)}>✏️ ปรับปรุงคำตอบ</button>
              <button type="button" className="btn" disabled={!ready || !exchanged} onClick={() => { setState((s) => submitForReview(s, work.id, activePlayer(s).id)); toast('ส่งให้ครู/โค้ชแล้ว ครูตรวจตอนนี้หรือภายหลังก็ได้'); }}>
                📤 ส่งให้เพื่อน/ครูช่วยตรวจ
              </button>
            </div>
          )}
          <GameRatings work={work} />
          <ApprovalPanel
            work={work}
            ready={ready && exchanged}
            readyHint={!ready ? 'ใบงานของบางคนยังไม่ครบตามเงื่อนไข (ขั้นที่ 2)' : !exchanged ? 'เพื่อนทุกคนยังเสนอความคิดไม่ครบ (ขั้นที่ 3)' : undefined}
            onApprove={(by, text) => { setState((s) => approveWork(s, work.id, by, text)); toast(`🎉 ผ่าน “${mission.title}” ได้บล็อกก่อสร้าง 1 ก้อน`); }}
            onRevise={(text) => setState((s) => requestRevision(s, work.id, text))}
            onNote={(text) => setState((s) => addCoachNote(s, { text, workId: work.id }))}
          />
          {work.status === 'pending' && <p className="muted">⏳ รอครู/โค้ชตรวจ กด “จบตา” เล่นต่อได้เลย ภารกิจนับว่าผ่านเมื่อได้รับการรับรอง</p>}
        </section>
      )}
    </Modal>
  );
}

/** สรุปคำตอบของทุกคน (ใช้ในขั้นแลกเปลี่ยนและขั้นตรวจ) */
export function TeamSummary({ work, mission }: { work: Work; mission: Mission }) {
  const { state } = useStarted();
  const labels = Object.fromEntries([...(mission.parts ?? []), ...mission.groups.flatMap((g) => g.slots.map((x) => ({ key: x.key, label: g.slots.length > 1 || mission.groups.length > 1 ? `${g.title} · ${x.label}` : x.label })))].map((x) => [x.key, x.label]));
  labels.reason = 'เหตุผล';
  return (
    <div className="team-summary">
      {state.players.map((p) => {
        const missing = sheetMissing(work, mission, p.id);
        const items = (work.items ?? []).filter((i) => i.by === p.id);
        return (
          <article key={p.id} className="sum-card" style={{ borderColor: p.color }}>
            <header>{p.avatar} <strong>{p.name}</strong> {missing.length ? <span className="chip st-doing">✏️ ยังขาด {missing.join(' · ')}</span> : <span className="chip st-done">✅ ครบ</span>}</header>
            {items.length > 0 && <ol className="small">{items.map((i, n) => <li key={n}>{i.tag && <span className="tag-badge">{i.tag}</span>}{i.text}</li>)}</ol>}
            {missionSlotKeys(mission).map((k) => answerOf(work, p.id, k) && (
              <div key={k} className="small"><span className="muted">{labels[k]}:</span> {answerOf(work, p.id, k)}</div>
            ))}
            {work.drawings?.[p.id] && <img className="thumb" src={work.drawings[p.id]} alt={`ภาพประกอบของ${p.name}`} />}
          </article>
        );
      })}
      <p className="muted small">ผู้เริ่มภารกิจ: {playerName(state, work.authorId)}</p>
    </div>
  );
}

/** เริ่มหรือเปิดภารกิจ คืน state ใหม่และ id ผลงาน (หรือ null ถ้าตานี้ทำภารกิจใหม่ไม่ได้แล้ว) */
export function startMission(s: GameState, missionId: string): [GameState, string | null] {
  const m = MISSIONS.find((x) => x.id === missionId)!;
  const existing = workForRef(s, 'mission', missionId);
  if (existing) return [{ ...s, currentMission: existing.id }, existing.id];
  if (s.turnActed) return [s, null];
  const [s2, id] = createWork(s, { kind: 'mission', refId: m.id, title: `${ZONES[m.zone].short} · ${m.title}`, zone: m.zone, creativityTags: [m.area], indicators: m.indicators });
  return [{ ...s2, turnActed: true, currentMission: id }, id];
}

export function useStartMission() {
  const { getState, setState, open, toast } = useStarted();
  return (missionId: string) => {
    // ใช้ state ล่าสุดเสมอ เพราะอาจถูกเรียกหลังตัวเดินเดินเสร็จ (closure เดิมยังเป็นตำแหน่งก่อนทอย)
    const [s2, id] = startMission(getState()!, missionId);
    if (!id) return toast('ตานี้เริ่มภารกิจใหม่ไปแล้ว กด “จบตา” ให้เพื่อนเล่นก่อนนะ (ภารกิจที่เริ่มไว้แล้วทำต่อได้เสมอ)');
    setState(() => s2);
    open({ type: 'mission', workId: id });
  };
}

export function MissionBoard() {
  const { state, open, close } = useStarted();
  const go = useStartMission();
  const zone = ZONES[state.zone];
  const boss = BOSSES[state.zone];
  return (
    <Modal title={`กระดานภารกิจ · ${zone.name}`} icon="🗺️" onClose={close} wide tone={zone.colors.main}>
      <p>ภารกิจหลัก 4 ด้านของโซนนี้ (ตารางที่ 2) เลือกทำด้านใดก่อนก็ได้ ไม่ต้องรอทอยให้ตกช่อง (ตาละ 1 ภารกิจใหม่)</p>
      <ul className="mission-list">
        {missionsOfZone(state.zone).map((m) => {
          const st = state.missionProgress[MISSIONS.indexOf(m)];
          return (
            <li key={m.id} className="mission-item">
              <div>
                <div className="mi-title"><AreaBadge mission={m} /> {m.title}</div>
                <div className="muted small">สถานการณ์ “{SCENARIOS[m.scenario].name}” · ตัวบ่งชี้ {m.indicators.join(', ')}{m.minutes ? ` · ${m.minutes} นาที` : ''}</div>
              </div>
              <StatusChip status={st} />
              <button type="button" className="btn small" onClick={() => go(m.id)}>
                {st === 'todo' ? '▶️ เริ่ม' : st === 'done' ? '👀 ดูผลงาน' : '✏️ ทำต่อ'}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="boss-card">
        <span className="boss-emoji" aria-hidden="true">{boss.emoji}</span>
        <div>
          <strong>ด่านตรวจประจำโซน: {boss.name}</strong>
          <div className="muted">ผ่านภารกิจครบ 4 ด้าน (ได้รับการรับรอง) แล้วท้าสู้ได้ที่ประตูบอส</div>
        </div>
        <StatusChip status={state.bossStatus[state.zone]} />
        <button type="button" className="btn small" disabled={state.bossStatus[state.zone] === 'locked'} onClick={() => open({ type: 'boss' })}>⚡ ไปสู้บอส</button>
      </div>
    </Modal>
  );
}
