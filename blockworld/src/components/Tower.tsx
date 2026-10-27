// 5. ศูนย์ส่งเสริมการคิดสร้างสรรค์ — หอคอยกลาง 4 ด่าน F / FL / O / E
import { useState } from 'react';
import { ELAB_PARTS, FLEX_WAYS, ORIGINALITY_SETS, TOWER_STAGES } from '../data/quests';
import { useStarted } from '../game/store';
import {
  TOWER_SECONDS_F, activePlayer, addCoachNote, approveWork, createWork, playerName, requestRevision, setAnswer, towerUnlocked, updateWork, workForRef,
} from '../game/rules';
import type { CreativityTag, Work } from '../game/types';
import { ApprovalPanel, SlotEditor } from './Answering';
import { SelfChecklist, SupportBar } from './MissionModal';
import { Modal, Scene, SpeakButton, StatusChip, Timer } from './ui';
import { words } from '../data/quests';

export function TowerModal() {
  const { state, setState, close } = useStarted();
  const [tab, setTab] = useState(() => Math.max(0, state.towerProgress.findIndex((x) => !x)));
  if (!towerUnlocked(state)) {
    return (
      <Modal title="หอคอยแห่งการคิดสร้างสรรค์" icon="🗼" onClose={close}>
        <div className="boss-stage locked">
          <div className="boss-big" aria-hidden="true">🗼🔒</div>
          <p>ประตูหอคอยยังล็อกอยู่ ต้องรวบรวมคริสตัลให้ครบ 3 ดวง (ตอนนี้มี {state.crystalCount} ดวง)</p>
          <p className="muted">ชนะบอสแต่ละโซนเพื่อรับคริสตัลสีฟ้า สีเขียว และสีแดง</p>
        </div>
      </Modal>
    );
  }
  const stage = TOWER_STAGES[tab];
  const work = workForRef(state, 'tower', stage.tag);
  const begin = () => setState((s) => createWork(s, { kind: 'tower', refId: stage.tag, title: stage.title, creativityTags: [stage.tag] })[0]);

  return (
    <Modal title="5. ศูนย์ส่งเสริมการคิดสร้างสรรค์ · หอคอยกลาง" icon="🗼" onClose={close} wide tone="#f5b700">
      <div className="tower-progress">
        {TOWER_STAGES.map((t, i) => (
          <button key={t.tag} type="button" className={`step ${tab === i ? 'on' : ''}`} onClick={() => setTab(i)}>
            {state.towerProgress[i] ? '✅' : '⭐'} {t.tag} {t.name}
          </button>
        ))}
      </div>
      <SupportBar />
      <h3>{stage.title}</h3>
      <p className="prompt">🎯 {stage.prompt} <SpeakButton text={stage.prompt} /></p>
      <p className="muted small">ℹ️ {stage.note}</p>
      {!work ? (
        <button type="button" className="btn big" onClick={begin}>✨ เริ่มด่าน {stage.tag}</button>
      ) : (
        <>
          <StatusChip status={work.status} />
          {stage.tag === 'F' && <FluencyStage work={work} />}
          {stage.tag === 'FL' && <FlexStage work={work} />}
          {stage.tag === 'O' && <OriginalStage work={work} />}
          {stage.tag === 'E' && <ElabStage work={work} />}
          <TowerApproval work={work} tag={stage.tag} />
        </>
      )}
    </Modal>
  );
}

function stageReady(w: Work, tag: CreativityTag) {
  const items = w.items ?? [];
  const a = (k: string) => (w.answers[k]?.final ?? '').trim();
  if (tag === 'F') return items.length >= 1;
  if (tag === 'FL') return items.length >= 3 && new Set(items.map((i) => i.tag)).size >= 3;
  if (tag === 'O') return !!a('story') && !!w.reason.trim();
  return ELAB_PARTS.every((p) => a(p.key)) && !!a('sentence');
}

function TowerApproval({ work, tag }: { work: Work; tag: CreativityTag }) {
  const { setState, toast } = useStarted();
  const ready = stageReady(work, tag);
  return (
    <ApprovalPanel
      work={work}
      ready={ready}
      readyHint={ready ? undefined : tag === 'FL' ? 'ต้องมีอย่างน้อย 3 แนวทางที่ต่างกัน' : 'ทำด่านนี้ให้ครบก่อน'}
      onApprove={(by, text) => { setState((s) => approveWork(s, work.id, by, text)); toast(`🌟 ผ่านด่าน ${tag} แล้ว หอคอยสว่างขึ้นอีกชั้น!`); }}
      onRevise={(text) => setState((s) => requestRevision(s, work.id, text))}
      onNote={(text) => setState((s) => addCoachNote(s, { text, workId: work.id }))}
    />
  );
}

/** เลือกว่าใครกำลังเพิ่มคำตอบ (เก็บชิ้นงานแยกรายคน) */
function WhoPicker({ who, setWho }: { who: string; setWho: (id: string) => void }) {
  const { state } = useStarted();
  return (
    <div className="speakers" role="radiogroup" aria-label="ใครกำลังตอบ">
      {state.players.map((p) => (
        <button key={p.id} type="button" role="radio" aria-checked={who === p.id} className={`speaker ${who === p.id ? 'on' : ''}`} style={{ borderColor: p.color }} onClick={() => setWho(p.id)}>
          {p.avatar} {p.name}
        </button>
      ))}
    </div>
  );
}

function ItemList({ work }: { work: Work }) {
  const { state } = useStarted();
  const items = work.items ?? [];
  if (!items.length) return <p className="muted">ยังไม่มีคำตอบ</p>;
  return (
    <>
      <ol className="items">
        {items.map((it, i) => (
          <li key={i}>{it.text} <span className="muted">— {playerName(state, it.by)}{it.tag ? ` · ${it.tag}` : ''}</span></li>
        ))}
      </ol>
      <p className="muted small">
        แยกรายคน: {state.players.map((p) => `${p.name} ${items.filter((i) => i.by === p.id).length} ข้อ`).join(' · ')} (ยิ่งหลากหลายยิ่งดี ไม่มีใครผิด)
      </p>
    </>
  );
}

function useAddItem(work: Work) {
  const { setState } = useStarted();
  return (text: string, by: string, tag?: string) =>
    setState((s) => updateWork(s, work.id, (w) => ({ ...w, items: [...(w.items ?? []), { text, by, tag, at: Date.now() }], participants: w.participants.includes(by) ? w.participants : [...w.participants, by] })));
}

function FluencyStage({ work }: { work: Work }) {
  const { state, setState } = useStarted();
  const [who, setWho] = useState(activePlayer(state).id);
  const [text, setText] = useState('');
  const add = useAddItem(work);
  const timer = state.timer?.label === work.id ? state.timer : null;
  const running = !!timer && Date.now() < timer.endsAt;
  const start = () => setState((s) => ({ ...s, timer: { label: work.id, endsAt: Date.now() + TOWER_SECONDS_F * 1000 } }));
  const submit = () => {
    if (!text.trim()) return;
    add(text.trim(), who);
    setText('');
  };
  return (
    <div>
      <Scene icons={TOWER_STAGES[0].scene!} caption="เทศกาลว่าวที่ทุ่งนาใกล้โรงเรียน มีเด็ก ๆ ขนม ลม และสุนัขวิ่งเล่น" tone="#f5b700" />
      <div className="row-actions">
        {timer ? <Timer endsAt={timer.endsAt} /> : <span className="muted">กดเริ่มจับเวลา 2 นาที (กิจกรรมฝึก)</span>}
        <button type="button" className="btn small" onClick={start} disabled={running || work.status === 'approved'}>⏱️ {timer ? 'เริ่มรอบใหม่' : 'เริ่มจับเวลา'}</button>
      </div>
      <WhoPicker who={who} setWho={setWho} />
      <div className="builder-free">
        <input value={text} onChange={(e) => setText(e.target.value)} disabled={!running} placeholder={running ? 'พิมพ์ประโยคแล้วกด Enter' : 'เริ่มจับเวลาก่อน'} aria-label="ประโยคจากภาพ"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }} />
        <button type="button" className="btn small" onClick={submit} disabled={!running || !text.trim()}>➕ เพิ่ม</button>
      </div>
      <ItemList work={work} />
    </div>
  );
}

function FlexStage({ work }: { work: Work }) {
  const { state } = useStarted();
  const [who, setWho] = useState(activePlayer(state).id);
  const [way, setWay] = useState(FLEX_WAYS[0]);
  const [text, setText] = useState('');
  const add = useAddItem(work);
  const ways = new Set((work.items ?? []).map((i) => i.tag));
  return (
    <div>
      <div className="base-sentence">ประโยคตั้งต้น: <strong>แมวกินปลา</strong> 🐱🐟</div>
      <WhoPicker who={who} setWho={setWho} />
      <label className="slot-label" htmlFor="flex-way">แนวทางที่เปลี่ยน</label>
      <select id="flex-way" value={way} onChange={(e) => setWay(e.target.value)}>
        {FLEX_WAYS.map((w) => <option key={w}>{w}</option>)}
      </select>
      <div className="builder-free">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="ประโยคแบบใหม่" aria-label="ประโยคแบบใหม่" disabled={work.status === 'approved'}
          onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) { e.preventDefault(); add(text.trim(), who, way); setText(''); } }} />
        <button type="button" className="btn small" disabled={!text.trim()} onClick={() => { add(text.trim(), who, way); setText(''); }}>➕ เพิ่ม</button>
      </div>
      <p className={ways.size >= 3 ? 'ok-text' : 'muted'}>แนวทางที่ต่างกันตอนนี้: {ways.size}/3 {ways.size >= 3 && '✔️'}</p>
      <ItemList work={work} />
    </div>
  );
}

function OriginalStage({ work }: { work: Work }) {
  const { setState } = useStarted();
  const setIdx = Number(work.answers.wordset?.final ?? 0);
  const set = ORIGINALITY_SETS[setIdx] ?? ORIGINALITY_SETS[0];
  const change = (k: string, t: string) => setState((s) => updateWork(s, work.id, (w) => setAnswer(w, k, t, activePlayer(s).id)));
  return (
    <div>
      <div className="word-cards">
        {set.map((w) => <span key={w} className="word-card">{w}</span>)}
        <button type="button" className="btn small ghost" disabled={work.status === 'approved'} onClick={() => change('wordset', String((setIdx + 1) % ORIGINALITY_SETS.length))}>🔄 เปลี่ยนชุดคำ</button>
      </div>
      <SlotEditor slot={{ key: 'story', label: 'เรื่องราวแปลกใหม่ของทีม (ใช้ครบ 3 คำ)', builder: true, multiline: true }} work={work} words={set.map((text) => ({ text, role: 'other' as const }))} onChange={(t) => change('story', t)} />
      <label className="slot-label" htmlFor={`o-reason-${work.id}`}>💭 เรื่องนี้แปลกใหม่ตรงไหน และทำไมยังมีเหตุผล</label>
      <textarea id={`o-reason-${work.id}`} className="answer" rows={2} value={work.reason} onChange={(e) => setState((s) => updateWork(s, work.id, (w) => ({ ...w, reason: e.target.value })))} />
      {(() => {
        const story = work.answers.story?.final ?? '';
        const used = set.filter((w) => story.includes(w));
        return <p className={used.length === 3 ? 'ok-text' : 'muted'}>ใช้คำแล้ว {used.length}/3 {used.length === 3 && '✔️'}</p>;
      })()}
    </div>
  );
}

function ElabStage({ work }: { work: Work }) {
  const { setState } = useStarted();
  const change = (k: string, t: string) => setState((s) => updateWork(s, work.id, (w) => setAnswer(w, k, t, activePlayer(s).id)));
  const parts = ELAB_PARTS.map((p) => work.answers[p.key]?.final ?? '').filter(Boolean);
  return (
    <div>
      <div className="base-sentence">ประโยคสั้น: <strong>นกบิน</strong> 🐦</div>
      <div className="elab-grid">
        {ELAB_PARTS.map((p) => (
          <label key={p.key} className="elab-field">
            <span>{p.label}</span>
            <input value={work.answers[p.key]?.final ?? ''} placeholder={p.placeholder} onChange={(e) => change(p.key, e.target.value)} disabled={work.status === 'approved'} />
          </label>
        ))}
      </div>
      <SlotEditor slot={{ key: 'sentence', label: 'ประโยคที่ขยายแล้ว', builder: true }} work={work} words={[...words('S:นก|V:บิน'), ...parts.map((text) => ({ text, role: 'modifier' as const }))]} onChange={(t) => change('sentence', t)} />
      <SelfChecklist work={work} items={['มีลักษณะของนก', 'มีอาการของการบิน', 'มีเวลา', 'มีสถานที่', 'อ่านทวนแล้วลื่นไหล เข้าใจง่าย']} />
    </div>
  );
}
