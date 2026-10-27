// ส่วนที่ใช้ร่วมกันระหว่างภารกิจ บอส และหอคอย: ช่องคำตอบ บัตรสถานการณ์ปัญหา ศูนย์แลกเปลี่ยนเรียนรู้ และการรับรอง
import { useState } from 'react';
import { useStarted } from '../game/store';
import { activePlayer, addOnce, playerName, updateWork } from '../game/rules';
import type { AnswerSlot, ExchangeKind, StarterWord, Work, ZoneId } from '../game/types';
import { SentenceBuilder } from './SentenceBuilder';
import { SpeakButton } from './ui';

export function SlotEditor({ slot, work, words, onChange }: { slot: AnswerSlot; work: Work; words: StarterWord[]; onChange: (text: string) => void }) {
  const { state } = useStarted();
  const a = work.answers[slot.key];
  const value = a?.final ?? '';
  const choiceKey = `${slot.key}__choice`;
  return (
    <div className="slot">
      <label className="slot-label" htmlFor={`slot-${work.id}-${slot.key}`}>
        ✍️ {slot.label} <SpeakButton text={slot.label} />
      </label>
      {slot.choices && (
        <ChoiceList slot={slot} work={work} choiceKey={choiceKey} />
      )}
      {slot.builder && (
        <SentenceBuilder
          words={words}
          extraWords={state.wordBank}
          onUse={(t, mode) => onChange(mode === 'append' && value.trim() ? `${value.trim()} ${t}` : t)}
        />
      )}
      {!slot.choices || slot.builder ? (
        <textarea
          id={`slot-${work.id}-${slot.key}`}
          className="answer"
          rows={slot.multiline ? 4 : 2}
          value={value}
          placeholder={slot.placeholder ?? 'พิมพ์หรือแก้คำตอบได้ที่นี่'}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
      {a && a.history.length > 0 && (
        <details className="history">
          <summary>📜 ประวัติการแก้ไข ({a.history.length} ครั้ง)</summary>
          <div><span className="muted">ก่อนแก้:</span> {a.first || '—'}</div>
          <div><span className="muted">หลังแก้ (ล่าสุด):</span> {a.final || '—'}</div>
          <ol>
            {a.history.map((h, i) => (
              <li key={i}>{h.text} <span className="muted">— {playerName(state, h.by)}</span></li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function ChoiceList({ slot, work, choiceKey }: { slot: AnswerSlot; work: Work; choiceKey: string }) {
  const { setState } = useStarted();
  const chosen = work.answers[slot.key]?.final ?? '';
  const pick = (c: string) =>
    setState((s) => updateWork(s, work.id, (w) => ({ ...w, answers: { ...w.answers, [slot.key]: { ...(w.answers[slot.key] ?? { first: '', history: [] }), final: c } }, participants: addOnce(w.participants, activePlayer(s).id) })));
  return (
    <div className="choices" role="radiogroup" aria-label={slot.label}>
      {slot.choices!.map((c) => (
        <label key={c} className={`choice ${chosen === c ? 'on' : ''}`}>
          <input type="radio" name={`${work.id}-${choiceKey}`} checked={chosen === c} onChange={() => pick(c)} /> {c}
        </label>
      ))}
      <span className="muted small">การเลือกเป็นเพียงจุดเริ่ม ต้องอธิบายเหตุผลและปรับถ้อยคำด้วยตนเองในช่องถัดไป</span>
    </div>
  );
}

const WHAT_IDEAS: Record<ZoneId, string[]> = {
  0: ['ประโยคขาดคำ', 'เรียงคำสับสน', 'ประโยคไม่ตรงกับภาพ'],
  1: ['ประโยคสั้นเกินไป', 'ไม่บอกลักษณะ', 'ไม่บอกเวลาและสถานที่'],
  2: ['พูดไม่เหมาะกับผู้ฟัง', 'พูดห้วนไม่สุภาพ', 'ไม่บอกว่าต้องการอะไร'],
};
const HOW_IDEAS = ['เรียงบล็อกคำใหม่', 'เพิ่มคำขยาย', 'เลือกถ้อยคำให้เหมาะกับผู้ฟัง', 'ถามเพื่อนในทีม', 'เปิดศูนย์การเรียนรู้'];

/** 1. สถานการณ์ปัญหา: บันทึกความคิดก่อนลงมือทำ */
export function ProblemStep({ work, zone }: { work: Work; zone: ZoneId }) {
  const { setState } = useStarted();
  const p = work.problem ?? { what: '', how: '' };
  const set = (k: 'what' | 'how', v: string) => setState((s) => updateWork(s, work.id, (w) => ({ ...w, problem: { ...(w.problem ?? { what: '', how: '' }), [k]: v } })));
  const add = (k: 'what' | 'how', v: string) => set(k, p[k].includes(v) ? p[k] : `${p[k] ? `${p[k]} ` : ''}${v}`);
  return (
    <div className="problem-step">
      <label className="slot-label" htmlFor={`what-${work.id}`}>❓ เกิดปัญหาอะไร? <SpeakButton text="เกิดปัญหาอะไร" /></label>
      <div className="idea-chips">{WHAT_IDEAS[zone].map((x) => <button type="button" key={x} className="idea" onClick={() => add('what', x)}>+ {x}</button>)}</div>
      <textarea id={`what-${work.id}`} className="answer" rows={2} value={p.what} onChange={(e) => set('what', e.target.value)} placeholder="พิมพ์หรือแตะเลือกด้านบน" />
      <label className="slot-label" htmlFor={`how-${work.id}`}>🛠️ เราจะแก้ได้อย่างไร? <SpeakButton text="เราจะแก้ได้อย่างไร" /></label>
      <div className="idea-chips">{HOW_IDEAS.map((x) => <button type="button" key={x} className="idea" onClick={() => add('how', x)}>+ {x}</button>)}</div>
      <textarea id={`how-${work.id}`} className="answer" rows={2} value={p.how} onChange={(e) => set('how', e.target.value)} placeholder="แนวทางของทีม" />
    </div>
  );
}

const EX_KINDS: { kind: ExchangeKind; label: string; icon: string; ph: string }[] = [
  { kind: 'listen', label: 'รับฟังความคิดเพื่อน', icon: '👂', ph: 'ฉันชอบตรงที่… / ฉันเข้าใจว่าเพื่อนหมายถึง…' },
  { kind: 'alternative', label: 'เสนอแบบอื่น', icon: '🔀', ph: 'อีกแบบหนึ่งคือ…' },
  { kind: 'improve', label: 'ช่วยปรับประโยค', icon: '🛠️', ph: 'ลองเพิ่ม/เปลี่ยน… เพราะ…' },
];

/** 4. ศูนย์แลกเปลี่ยนเรียนรู้: ผลัดกันเสนอความคิดบนเครื่องเดียว (pass-and-play) */
export function ExchangePanel({ work }: { work: Work }) {
  const { state, setState } = useStarted();
  const others = state.players.filter((p) => p.id !== work.authorId);
  const spoke = (id: string) => work.exchange.some((e) => e.by === id);
  const firstSilent = others.find((p) => !spoke(p.id));
  const [speaker, setSpeaker] = useState<string>(firstSilent?.id ?? others[0]?.id ?? work.authorId);
  const [kind, setKind] = useState<ExchangeKind>('listen');
  const [text, setText] = useState('');
  const isAuthor = speaker === work.authorId;

  const submit = () => {
    if (!text.trim()) return;
    const k: ExchangeKind = isAuthor ? 'reply' : kind;
    setState((s) => updateWork(s, work.id, (w) => ({ ...w, exchange: [...w.exchange, { by: speaker, kind: k, text: text.trim(), at: Date.now() }], participants: addOnce(w.participants, speaker) })));
    setText('');
    const next = others.find((p) => p.id !== speaker && !spoke(p.id));
    if (next) setSpeaker(next.id);
  };

  return (
    <div className="exchange">
      <p className="muted">
        💬 เพื่อนทุกคนผลัดกันเสนอความคิดอย่างน้อยคนละ 1 ครั้ง ส่งเครื่องให้คนที่ถึงตาพูด แล้ว{playerName(state, work.authorId)} (ผู้เขียน) ตอบกลับหรือปรับคำตอบได้
      </p>
      <div className="speakers" role="radiogroup" aria-label="ใครกำลังพูด">
        {[...others, ...state.players.filter((p) => p.id === work.authorId)].map((p) => (
          <button key={p.id} type="button" role="radio" aria-checked={speaker === p.id} className={`speaker ${speaker === p.id ? 'on' : ''}`} onClick={() => setSpeaker(p.id)} style={{ borderColor: p.color }}>
            {p.avatar} {p.name} {p.id === work.authorId ? '(ผู้เขียน)' : spoke(p.id) ? '✅' : '⏳'}
          </button>
        ))}
      </div>
      {!isAuthor && (
        <div className="ex-kinds">
          {EX_KINDS.map((k) => (
            <button key={k.kind} type="button" className={`btn ${kind === k.kind ? '' : 'ghost'}`} onClick={() => setKind(k.kind)} aria-pressed={kind === k.kind}>
              {k.icon} {k.label}
            </button>
          ))}
        </div>
      )}
      <textarea className="answer" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={isAuthor ? 'ตอบกลับเพื่อน หรือบอกว่าจะปรับอะไร' : EX_KINDS.find((k) => k.kind === kind)!.ph} aria-label="ข้อความแลกเปลี่ยน" />
      <button type="button" className="btn" onClick={submit} disabled={!text.trim()}>📨 บันทึกความคิดของ {playerName(state, speaker)}</button>
      {work.exchange.length > 0 && (
        <ul className="ex-log">
          {work.exchange.map((e, i) => (
            <li key={i}>
              <strong>{playerName(state, e.by)}</strong> <span className="muted">{e.kind === 'reply' ? '↩️ ตอบกลับ' : EX_KINDS.find((k) => k.kind === e.kind)?.icon + ' ' + EX_KINDS.find((k) => k.kind === e.kind)?.label}</span>: {e.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const everyoneExchanged = (work: Work, playerIds: string[]) => playerIds.filter((id) => id !== work.authorId).every((id) => work.exchange.some((e) => e.by === id));

/** 7. การโค้ช: ครูรับรอง (PIN) หรือเพื่อนทุกคนเห็นพ้อง (ตั้งค่าตอนเริ่มเกม) */
export function ApprovalPanel({ work, onApprove, onRevise, onNote, ready, readyHint }: {
  work: Work;
  onApprove: (by: 'coach' | 'peer', text: string) => void;
  onRevise: (text: string) => void;
  onNote: (text: string) => void;
  ready: boolean;
  readyHint?: string;
}) {
  const { state, coachUnlocked, setCoachUnlocked, toast } = useStarted();
  const [pin, setPin] = useState('');
  const [text, setText] = useState('');
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const peer = state.settings.approvalMode === 'peer';

  if (work.status === 'approved') {
    return <div className="approved-box">✅ ผลงานนี้ได้รับการรับรองแล้ว {work.feedback.filter((f) => f.kind === 'approve').map((f) => f.text).join(' ')}</div>;
  }
  return (
    <div className="approval">
      {!ready && readyHint && <div className="tip">⏳ {readyHint}</div>}
      {work.feedback.filter((f) => f.kind !== 'approve').length > 0 && (
        <ul className="feedback">
          {work.feedback.filter((f) => f.kind !== 'approve').map((f, i) => (
            <li key={i}>{f.kind === 'revise' ? '🔁 ให้ปรับปรุง' : '📝 ข้อสังเกต'}: {f.text}</li>
          ))}
        </ul>
      )}
      {peer ? (
        <div className="peer-approve">
          <p>🤝 โหมดเพื่อนรับรอง: ทุกคนอ่านคำตอบแล้วติ๊กเห็นพ้องว่าตรงเกณฑ์ (ครูตรวจย้อนหลังได้ที่แดชบอร์ด)</p>
          {state.players.map((p) => (
            <label key={p.id} className="agree">
              <input type="checkbox" checked={!!agree[p.id]} onChange={(e) => setAgree({ ...agree, [p.id]: e.target.checked })} /> {p.avatar} {p.name} เห็นพ้อง
            </label>
          ))}
          <button type="button" className="btn good" disabled={!ready || !state.players.every((p) => agree[p.id])} onClick={() => onApprove('peer', '')}>✅ ทีมรับรองผ่าน</button>
        </div>
      ) : !coachUnlocked ? (
        <div className="pin-row">
          <label htmlFor={`pin-${work.id}`}>🧑‍🏫 ครู/โค้ชใส่ PIN เพื่อตรวจ</label>
          <input id={`pin-${work.id}`} type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} size={6}
            onKeyDown={(e) => { if (e.key === 'Enter') (pin === state.settings.pin ? setCoachUnlocked(true) : toast('PIN ไม่ถูกต้อง')); }} />
          <button type="button" className="btn" onClick={() => (pin === state.settings.pin ? setCoachUnlocked(true) : toast('PIN ไม่ถูกต้อง'))}>🔓 เข้าโหมดครู</button>
        </div>
      ) : (
        <div className="coach-actions">
          <textarea className="answer" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="ข้อความถึงนักเรียน / ข้อสังเกต (ไม่บังคับ)" aria-label="ข้อความของครู" />
          <div className="row-actions">
            <button type="button" className="btn good" disabled={!ready} onClick={() => { onApprove('coach', text); setText(''); }}>✅ รับรองผ่าน</button>
            <button type="button" className="btn warn" onClick={() => { onRevise(text); setText(''); }}>🔁 ให้ปรับปรุง</button>
            <button type="button" className="btn ghost" disabled={!text.trim()} onClick={() => { onNote(text); setText(''); }}>📝 บันทึกข้อสังเกต</button>
          </div>
        </div>
      )}
    </div>
  );
}
