// ใบงานรายคนของภารกิจหลัก: ผู้เล่นทุกคนสร้างคำตอบด้วยตนเอง (ผลัดกันใช้เครื่อง) เพื่อเก็บผลงานรายบุคคลตามตัวบ่งชี้
import { useState } from 'react';
import { MISSIONS, SCENARIOS } from '../data/quests';
import { useStarted } from '../game/store';
import { addOnce, answerOf, runChecks, setAnswer, sheetKey, sheetMissing, updateWork, workForRef } from '../game/rules';
import type { Item, Mission, Work } from '../game/types';
import { SlotEditor } from './Answering';
import { DrawingPad, ListenerCard, StoryCubes } from './Mechanics';
import { SentenceBuilder } from './SentenceBuilder';
import { Checks, SpeakButton, Timer } from './ui';

export function PlayerTabs({ work, mission, pid, setPid }: { work: Work; mission: Mission; pid: string; setPid: (id: string) => void }) {
  const { state } = useStarted();
  return (
    <div className="speakers" role="tablist" aria-label="ใบงานของใคร">
      {state.players.map((p) => {
        const done = sheetMissing(work, mission, p.id).length === 0;
        return (
          <button key={p.id} type="button" role="tab" aria-selected={pid === p.id} className={`speaker ${pid === p.id ? 'on' : ''}`} style={{ borderColor: p.color }} onClick={() => setPid(p.id)}>
            {p.avatar} ใบงานของ{p.name} {done ? '✅' : '✏️'}
          </button>
        );
      })}
    </div>
  );
}

/** ตัวจับเวลารายคน (ภารกิจที่ตารางที่ 2 กำหนดเวลา 5 นาที) */
function useSheetTimer(work: Work, mission: Mission, pid: string) {
  const { setState } = useStarted();
  const endsAt = work.timers?.[pid];
  const [, force] = useState(0);
  if (!mission.minutes) return { notStarted: false, expired: false, node: null };
  const running = !!endsAt && Date.now() < endsAt;
  const start = () => setState((s) => updateWork(s, work.id, (w) => ({ ...w, timers: { ...w.timers, [pid]: Date.now() + mission.minutes! * 60_000 } })));
  const node = (
    <div className="timer-bar">
      {endsAt ? <Timer endsAt={endsAt} onDone={() => force((n) => n + 1)} /> : <span className="muted">⏱️ ภารกิจนี้มีเวลา {mission.minutes} นาที กดเริ่มเมื่อพร้อม</span>}
      {!endsAt && <button type="button" className="btn small" onClick={start}>▶️ เริ่มจับเวลา {mission.minutes} นาที</button>}
      {endsAt && !running && <RestartTimer onRestart={start} />}
    </div>
  );
  return { notStarted: !endsAt, expired: !!endsAt && !running, node };
}

function RestartTimer({ onRestart }: { onRestart: () => void }) {
  const { coachUnlocked } = useStarted();
  return (
    <>
      <span className="muted small">หมดเวลาแล้ว — เพิ่มข้อใหม่ไม่ได้ แต่ยังแก้ไขคำตอบเดิมได้ (ระบบเก็บก่อนแก้/หลังแก้)</span>
      {coachUnlocked && <button type="button" className="btn small ghost" onClick={onRestart}>🔁 ให้เวลาใหม่ (ครู/โค้ช)</button>}
    </>
  );
}

export function Sheet({ work, mission, pid }: { work: Work; mission: Mission; pid: string }) {
  const { state, setState } = useStarted();
  const timer = useSheetTimer(work, mission, pid);
  // ยังไม่เริ่มจับเวลา = ยังเขียนไม่ได้ · หมดเวลา = เพิ่มข้อใหม่ไม่ได้ แต่แก้ไขคำตอบเดิมได้
  const locked = timer.notStarted || work.status === 'approved' || work.status === 'pending';
  const noNew = locked || timer.expired;
  const [cubeWords, setCubeWords] = useState<string[]>(() => (work.cubes?.[pid] ?? []).map((x) => x.split(' ').slice(1).join(' ')));
  const scen = SCENARIOS[mission.scenario];
  const change = (slot: string, text: string) => setState((s) => updateWork(s, work.id, (w) => setAnswer(w, sheetKey(pid, slot), text, pid)));
  const values: Record<string, string> = Object.fromEntries(Object.entries(work.answers).filter(([k]) => k.startsWith(`${pid}|`)).map(([k, a]) => [k.split('|')[1], a.final]));
  const prev = mission.reuse ? workForRef(state, 'mission', mission.reuse.from) : undefined;
  const prevMission = mission.reuse ? MISSIONS.find((x) => x.id === mission.reuse!.from) : undefined;
  const prevText = mission.reuse?.slot ? answerOf(prev, pid, mission.reuse.slot) : '';
  const prevDrawing = prev?.drawings?.[pid] ?? (prevMission?.reuse?.drawing ? workForRef(state, 'mission', prevMission.reuse.from)?.drawings?.[pid] : undefined);
  const firstSlot = mission.groups[0]?.slots[0]?.key;
  const missing = sheetMissing(work, mission, pid);
  const extra = [...cubeWords, ...(mission.parts ?? []).map((p) => values[p.key]).filter(Boolean)];

  return (
    <div className="sheet">
      {timer.node}
      {mission.reuse && (
        <div className="reuse">
          <strong>♻️ {mission.reuse.label}</strong>
          {prevText ? <p className="reuse-text">“{prevText}”</p> : <p className="muted">ยังไม่มีคำตอบจากภารกิจก่อน ({prevMission?.title}) — แต่งใหม่ได้</p>}
          {mission.reuse.drawing && prevDrawing && <img className="reuse-img" src={prevDrawing} alt="ภาพเรื่องราวที่วาดไว้" />}
          {prevText && firstSlot && !locked && !values[firstSlot] && (
            <button type="button" className="btn small ghost" onClick={() => change(firstSlot, prevText)}>⬇️ นำมาใช้เป็นจุดเริ่มต้น</button>
          )}
        </div>
      )}
      {mission.baseSentence && <div className="base-sentence">ประโยคตั้งต้น: <strong>{mission.baseSentence}</strong> <SpeakButton text={mission.baseSentence} /></div>}
      {mission.broken && (
        <div className="broken">
          <strong>🪧 ป้ายที่ผิด</strong>
          <ul>{mission.broken.map((b) => <li key={b}>❌ {b}</li>)}</ul>
        </div>
      )}
      {mission.listeners && <div className="listeners">{mission.listeners.map((l) => <ListenerCard key={l} id={l} compact={mission.listeners!.length > 1} />)}</div>}
      {mission.cubes && <StoryCubes work={work} pid={pid} onWords={setCubeWords} />}

      <fieldset className="plain" disabled={locked}>
        {mission.parts && (
          <div className="elab-grid">
            {mission.parts.map((p) => (
              <label key={p.key} className="elab-field">
                <span>{p.label}</span>
                <input value={values[p.key] ?? ''} placeholder={p.placeholder} onChange={(e) => change(p.key, e.target.value)} />
              </label>
            ))}
          </div>
        )}
        {mission.list && <ItemsEditor work={work} mission={mission} pid={pid} extra={extra} locked={locked} noNew={noNew} />}
        {mission.groups.map((g) => (
          <div key={g.title} className="slot-group">
            <h4>{g.title}</h4>
            {g.slots[0]?.listener && mission.groups.length > 1 && <ListenerCard id={g.slots[0].listener} />}
            {g.slots.map((slot) => (
              <SlotEditor key={slot.key} slot={{ ...slot, key: sheetKey(pid, slot.key) }} work={work} words={mission.starterWords} extraWords={extra}
                disabled={locked} onChange={(t) => change(slot.key, t)} />
            ))}
          </div>
        ))}
        {mission.drawing && (
          <div className="slot">
            <div className="slot-label">🖍️ ภาพประกอบ{mission.drawing === 'required' ? ' (ต้องวาด)' : ''} — วาดให้สอดคล้องกับประโยค</div>
            <DrawingPad key={`${work.id}-${pid}`} value={work.drawings?.[pid]} base={prevDrawing} disabled={locked}
              onSave={(url) => setState((s) => updateWork(s, work.id, (w) => ({ ...w, drawings: { ...w.drawings, [pid]: url }, participants: addOnce(w.participants, pid) })))} />
          </div>
        )}
        {mission.needReason && (
          <SlotEditor slot={{ key: sheetKey(pid, 'reason'), label: `💭 ${mission.reasonLabel ?? 'อธิบายเหตุผล'}`, multiline: true, placeholder: 'เพราะ…' }} work={work} words={[]} disabled={locked}
            onChange={(t) => change('reason', t)} />
        )}
      </fieldset>

      <Checks results={runChecks(mission.autoChecks, values)} />
      <div className="self-check">
        <strong>📋 ตรวจด้วยตนเองตามเงื่อนไขภารกิจ</strong>
        {mission.criteria.map((c) => {
          const k = sheetKey(pid, c);
          return (
            <label key={c} className="agree">
              <input type="checkbox" checked={!!work.checklist?.[k]} onChange={(e) => setState((s) => updateWork(s, work.id, (w) => ({ ...w, checklist: { ...w.checklist, [k]: e.target.checked } })))} /> {c}
            </label>
          );
        })}
      </div>
      {missing.length > 0 ? <div className="tip">⏳ ใบงานนี้ยังขาด: {missing.join(' · ')}</div> : <div className="ok-text">✅ ใบงานนี้ครบตามเงื่อนไขแล้ว</div>}
      <p className="muted small">สถานการณ์: {scen.name} — {scen.text}</p>
    </div>
  );
}

function ItemsEditor({ work, mission, pid, extra, locked, noNew }: { work: Work; mission: Mission; pid: string; extra: string[]; locked: boolean; noNew: boolean }) {
  const { setState } = useStarted();
  const spec = mission.list!;
  const [text, setText] = useState('');
  const [tag, setTag] = useState(spec.tags?.[0] ?? '');
  const [showBuilder, setShowBuilder] = useState(false);
  const all = work.items ?? [];
  const mine = all.map((it, i) => ({ it, i })).filter((x) => x.it.by === pid);
  const add = () => {
    if (!text.trim()) return;
    const item: Item = { text: text.trim(), first: text.trim(), by: pid, tag: spec.tags ? tag : undefined, at: Date.now() };
    setState((s) => updateWork(s, work.id, (w) => ({ ...w, items: [...(w.items ?? []), item], participants: addOnce(w.participants, pid) })));
    setText('');
  };
  const edit = (i: number, t: string) => setState((s) => updateWork(s, work.id, (w) => ({ ...w, items: (w.items ?? []).map((x, k) => (k === i ? { ...x, text: t } : x)) })));
  const remove = (i: number) => setState((s) => updateWork(s, work.id, (w) => ({ ...w, items: (w.items ?? []).filter((_, k) => k !== i) })));
  const tags = new Set(mine.map((x) => x.it.tag));

  return (
    <div className="items-editor">
      <h4>📝 {spec.label} <span className="muted small">(ของฉัน {mine.length} ข้อ{spec.minDistinctTags ? ` · ต่างกัน ${tags.size}/${spec.minDistinctTags} รูปแบบ` : ''})</span></h4>
      {!noNew && (
        <>
          <div className="builder-free">
            {spec.tags && (
              <select value={tag} onChange={(e) => setTag(e.target.value)} aria-label={spec.tagLabel}>
                {spec.tags.map((t) => <option key={t}>{t}</option>)}
              </select>
            )}
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={spec.placeholder} aria-label={spec.label}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
            <button type="button" className="btn small" onClick={add} disabled={!text.trim()}>➕ เพิ่ม</button>
            <button type="button" className="btn small ghost" onClick={() => setShowBuilder((v) => !v)} aria-expanded={showBuilder}>🧱 บล็อกคำ</button>
          </div>
          {showBuilder && <SentenceBuilder words={mission.starterWords} extraWords={extra} onUse={(t) => setText(t)} />}
        </>
      )}
      <ol className="items">
        {mine.map(({ it, i }) => {
          const checks = runChecks(spec.itemChecks ?? [], { '': it.text });
          return (
            <li key={i}>
              {spec.tags && <span className="tag-badge">{it.tag}</span>}
              <input className="item-input" value={it.text} onChange={(e) => edit(i, e.target.value)} disabled={locked} aria-label={`แก้ข้อ ${i + 1}`} />
              {!locked && <button type="button" className="icon-btn small" onClick={() => remove(i)} aria-label="ลบข้อนี้">✕</button>}
              {checks.map((c) => <span key={c.label} className={`mini-check ${c.ok ? 'ok' : ''}`}>{c.ok ? '✔️' : '💭'} {c.label}</span>)}
              {it.first !== it.text && <span className="muted small"> (เดิม: {it.first})</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
