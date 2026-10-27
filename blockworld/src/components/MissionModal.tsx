// หน้าต่างภารกิจ: สถานการณ์ปัญหา → สร้างคำตอบ → แลกเปลี่ยนเรียนรู้ → ตรวจและรับรอง และกระดานภารกิจ (Mission Board)
import { useState } from 'react';
import { BOSSES, EXTRA_PROMPTS, QUESTS, ZONES } from '../data/quests';
import { TAG_NAMES } from '../data/learning';
import { useStarted } from '../game/store';
import {
  activePlayer, addCoachNote, approveWork, basicChecks, commitAnswers, createWork, findWork, questsOfZone,
  requestRevision, runChecks, setAnswer, submitForReview, updateWork, workForRef,
} from '../game/rules';
import type { GameState, Quest, Work } from '../game/types';
import { ApprovalPanel, ExchangePanel, ProblemStep, SlotEditor, everyoneExchanged } from './Answering';
import { Checks, Modal, Scene, SpeakButton, StatusChip } from './ui';

const STEPS = ['1. สถานการณ์ปัญหา', '2. สร้างคำตอบ', '3. แลกเปลี่ยนเรียนรู้', '4. ตรวจและรับรอง'];

export const answersFilled = (w: Work, keys: string[]) => keys.every((k) => (w.answers[k]?.final ?? '').trim().length > 0);

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

export function TeacherOnly({ quest }: { quest: { hint: string; examplesForTeacher: string[] } }) {
  const { coachUnlocked } = useStarted();
  if (!coachUnlocked) return null;
  return (
    <details className="teacher-only">
      <summary>🔐 สำหรับครูเท่านั้น: คำใบ้และตัวอย่างคำตอบ (ไม่ใช่เฉลยตายตัว)</summary>
      <p><strong>คำใบ้:</strong> {quest.hint}</p>
      <ul>{quest.examplesForTeacher.map((e) => <li key={e}>{e}</li>)}</ul>
    </details>
  );
}

export function MissionModal({ workId }: { workId: string }) {
  const { state, setState, close, toast } = useStarted();
  const work = findWork(state, workId);
  const quest = QUESTS.find((q) => q.id === work?.refId);
  const [step, setStep] = useState(() => (work && work.status !== 'draft' ? 3 : 0));
  if (!work || !quest) return null;
  const zone = ZONES[quest.zone];
  const me = activePlayer(state);
  const slotKeys = quest.slots.map((s) => s.key);
  const values: Record<string, string> = { ...Object.fromEntries(slotKeys.map((k) => [k, work.answers[k]?.final ?? ''])), reason: work.reason };
  const exchanged = everyoneExchanged(work, state.players.map((p) => p.id));
  const filled = answersFilled(work, slotKeys) && (!quest.needReason || work.reason.trim().length > 0);
  const locked = work.status === 'approved';

  const change = (key: string, text: string) => setState((s) => updateWork(s, work.id, (w) => setAnswer(w, key, text, activePlayer(s).id)));

  return (
    <Modal title={`${quest.id} · ${quest.title}`} icon="⚔️" onClose={close} wide tone={zone.colors.main}>
      <div className="mission-meta">
        <span className="zone-pill" style={{ background: zone.colors.main }}>{zone.name}</span>
        <span>หัวข้อ {quest.topic}. {quest.topicName}</span>
        <StatusChip status={work.status} />
        <span className="muted">ความคิดสร้างสรรค์: {quest.creativityTags.map((t) => TAG_NAMES[t]).join(' · ')}</span>
      </div>
      <SupportBar topic={quest.topic} />
      <nav className="steps" aria-label="ขั้นตอนภารกิจ">
        {STEPS.map((s, i) => (
          <button key={s} type="button" className={`step ${step === i ? 'on' : ''}`} onClick={() => setStep(i)} aria-current={step === i ? 'step' : undefined}>{s}</button>
        ))}
      </nav>

      {step === 0 && (
        <section>
          <div className="story-card">
            <p className="story">📖 {quest.story} <SpeakButton text={quest.story} /></p>
            <Scene icons={quest.scene} caption={quest.sceneCaption} tone={zone.colors.main} />
          </div>
          <ProblemStep work={work} zone={quest.zone} />
          <div className="row-actions"><button type="button" className="btn" onClick={() => setStep(1)}>ไปสร้างคำตอบ ➡️</button></div>
        </section>
      )}

      {step === 1 && (
        <section>
          <div className="prompt">🎯 <strong>โจทย์:</strong> {quest.prompt} <SpeakButton text={quest.prompt} /></div>
          <Scene icons={quest.scene} caption={quest.sceneCaption} tone={zone.colors.main} />
          {work.status === 'revise' && <div className="tip">🔁 ครู/โค้ชให้ปรับปรุง: {work.feedback.filter((f) => f.kind === 'revise').slice(-1)[0]?.text}</div>}
          <fieldset disabled={locked} className="plain">
            {quest.slots.map((slot) => (
              <SlotEditor key={slot.key} slot={slot} work={work} words={quest.starterWords} onChange={(t) => change(slot.key, t)} />
            ))}
            {quest.needReason && (
              <div className="slot">
                <label className="slot-label" htmlFor={`reason-${work.id}`}>💭 {quest.reasonLabel ?? 'อธิบายเหตุผล'}</label>
                <textarea id={`reason-${work.id}`} className="answer" rows={2} value={work.reason} placeholder="เพราะ…"
                  onChange={(e) => setState((s) => updateWork(s, work.id, (w) => ({ ...w, reason: e.target.value })))} />
              </div>
            )}
            {quest.selfChecklist && <SelfChecklist work={work} items={quest.selfChecklist} />}
          </fieldset>
          <Checks results={[...basicChecks(Object.values(values).join(' ')), ...runChecks(quest.autoChecks, values)]} />
          {quest.slots.filter((s) => s.builder).length > 1 && new Set(quest.slots.filter((s) => s.builder).map((s) => values[s.key].trim())).size < quest.slots.filter((s) => s.builder).length && values[quest.slots[0].key] && (
            <div className="tip">💡 คำตอบบางช่องยังเหมือนกัน ลองคิดแบบที่ต่างออกไป</div>
          )}
          {EXTRA_PROMPTS[quest.topic] && (
            <div className="extra">🌟 ภารกิจเสริม (ไม่บังคับ คำตอบได้หลายแบบ): {EXTRA_PROMPTS[quest.topic].join(' · ')}</div>
          )}
          <div className="row-actions">
            <button type="button" className="btn ghost" disabled={locked} onClick={() => { setState((s) => updateWork(s, work.id, (w) => commitAnswers(w, me.id))); toast('บันทึกฉบับนี้ไว้ในประวัติแล้ว'); }}>💾 บันทึกฉบับนี้</button>
            <button type="button" className="btn" onClick={() => { setState((s) => updateWork(s, work.id, (w) => commitAnswers(w, me.id))); setStep(2); }}>ส่งให้เพื่อนช่วยดู ➡️</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <AnswerSummary quest={quest} work={work} />
          <ExchangePanel work={work} />
          <div className="row-actions">
            <button type="button" className="btn ghost" onClick={() => setStep(1)} disabled={locked}>✏️ ปรับปรุงคำตอบ</button>
            <button type="button" className="btn" onClick={() => setStep(3)}>ไปตรวจและรับรอง ➡️</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <AnswerSummary quest={quest} work={work} />
          <div className="criteria">
            <strong>🏅 เกณฑ์ความสำเร็จ</strong>
            <ul>{quest.successCriteria.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <TeacherOnly quest={quest} />
          {(work.status === 'draft' || work.status === 'revise') && (
            <div className="row-actions">
              <button type="button" className="btn ghost" onClick={() => setStep(1)}>✏️ ปรับปรุงคำตอบ</button>
              <button type="button" className="btn" disabled={!filled || !exchanged} onClick={() => { setState((s) => submitForReview(s, work.id, me.id)); toast('ส่งให้ครู/โค้ชแล้ว ครูตรวจตอนนี้หรือภายหลังก็ได้'); }}>
                📤 ส่งให้เพื่อน/ครูช่วยตรวจ
              </button>
            </div>
          )}
          <ApprovalPanel
            work={work}
            ready={filled && exchanged}
            readyHint={!filled ? 'ยังมีช่องคำตอบหรือเหตุผลที่ว่างอยู่' : !exchanged ? 'เพื่อนทุกคนยังเสนอความคิดไม่ครบ (ขั้นที่ 3)' : undefined}
            onApprove={(by, text) => { setState((s) => approveWork(s, work.id, by, text)); toast(`🎉 ผ่านภารกิจ “${quest.title}” ได้บล็อกก่อสร้าง 1 ก้อน`); }}
            onRevise={(text) => setState((s) => requestRevision(s, work.id, text))}
            onNote={(text) => setState((s) => addCoachNote(s, { text, workId: work.id, playerId: work.authorId }))}
          />
          {work.status === 'pending' && <p className="muted">⏳ รอครู/โค้ชตรวจ กด “จบตา” เล่นต่อได้เลย ภารกิจจะนับว่าผ่านเมื่อได้รับการรับรอง</p>}
        </section>
      )}
    </Modal>
  );
}

export function SelfChecklist({ work, items }: { work: Work; items: string[] }) {
  const { setState } = useStarted();
  return (
    <div className="self-check">
      <strong>📋 ตรวจด้วยตนเอง</strong>
      {items.map((it) => (
        <label key={it} className="agree">
          <input type="checkbox" checked={!!work.checklist?.[it]} onChange={(e) => setState((s) => updateWork(s, work.id, (w) => ({ ...w, checklist: { ...w.checklist, [it]: e.target.checked } })))} /> {it}
        </label>
      ))}
    </div>
  );
}

function AnswerSummary({ quest, work }: { quest: Quest; work: Work }) {
  return (
    <div className="summary">
      <div className="muted">🎯 {quest.prompt}</div>
      {quest.slots.map((s) => (
        <div key={s.key}><strong>{s.label}:</strong> {work.answers[s.key]?.final || <span className="muted">(ยังว่าง)</span>}</div>
      ))}
      {quest.needReason && <div><strong>เหตุผล:</strong> {work.reason || <span className="muted">(ยังว่าง)</span>}</div>}
    </div>
  );
}

/** เริ่มหรือเปิดภารกิจของหัวข้อ คืน state ใหม่และ id ผลงาน (หรือ null ถ้าตานี้ทำภารกิจใหม่ไม่ได้แล้ว) */
export function startMission(s: GameState, questId: string): [GameState, string | null] {
  const q = QUESTS.find((x) => x.id === questId)!;
  const existing = workForRef(s, 'mission', questId);
  if (existing) return [{ ...s, currentMission: existing.id }, existing.id];
  if (s.turnActed) return [s, null];
  const [s2, id] = createWork(s, { kind: 'mission', refId: q.id, title: `${q.id} ${q.title}`, zone: q.zone, topic: q.topic, creativityTags: q.creativityTags });
  return [{ ...s2, turnActed: true, currentMission: id }, id];
}

export function MissionBoard() {
  const { state, setState, open, close, toast } = useStarted();
  const zone = ZONES[state.zone];
  const boss = BOSSES[state.zone];
  const go = (qid: string) => {
    const [s2, id] = startMission(state, qid);
    if (!id) return toast('ตานี้ทำภารกิจใหม่ไปแล้ว กด “จบตา” ให้เพื่อนเล่นก่อนนะ (ภารกิจที่เริ่มไว้แล้วทำต่อได้เสมอ)');
    setState(() => s2);
    open({ type: 'mission', workId: id });
  };
  return (
    <Modal title={`กระดานภารกิจ · ${zone.name}`} icon="🗺️" onClose={close} wide tone={zone.colors.main}>
      <p>ทำให้ครบทั้ง 5 หัวข้อของโซน เลือกภารกิจใดก่อนก็ได้ ไม่ต้องรอทอยให้ตกช่อง (ตาละ 1 ภารกิจใหม่)</p>
      <ul className="mission-list">
        {questsOfZone(state.zone).map((q) => {
          const st = state.topicProgress[q.topic - 1];
          return (
            <li key={q.id} className="mission-item">
              <div>
                <div className="mi-title">{q.topic}. {q.topicName}</div>
                <div className="muted">{q.id} · {q.title}</div>
              </div>
              <StatusChip status={st} />
              <button type="button" className="btn small" onClick={() => go(q.id)}>
                {st === 'todo' ? '▶️ เริ่ม' : st === 'done' ? '👀 ดูผลงาน' : '✏️ ทำต่อ'}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="boss-card">
        <span className="boss-emoji" aria-hidden="true">{boss.emoji}</span>
        <div>
          <strong>บอสประจำโซน: {boss.name}</strong>
          <div className="muted">ทำครบ 5 หัวข้อ (ผ่านการรับรอง) แล้วท้าสู้ได้ที่ประตูบอส</div>
        </div>
        <StatusChip status={state.bossStatus[state.zone]} />
        <button type="button" className="btn small" disabled={state.bossStatus[state.zone] === 'locked'} onClick={() => open({ type: 'boss' })}>⚡ ไปสู้บอส</button>
      </div>
    </Modal>
  );
}
