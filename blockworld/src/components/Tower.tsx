// 5. ศูนย์ส่งเสริมการคิดสร้างสรรค์ — เป้าหมายสุดท้ายกลางกระดาน
// ปลดล็อกเมื่อได้คริสตัลครบ 3 ดวง แล้วจัด "นิทรรศการความคิดสร้างสรรค์" 4 ชั้น (F / FL / O / E)
// ทุกคนเลือกผลงานของตนจากภารกิจด้านเดียวกันทั้ง 3 โซน อธิบายเหตุผล → ครูรับรอง → ชั้นของหอคอยสว่าง (ไม่เพิ่มภารกิจใหม่นอกตารางที่ 2)
import { useState } from 'react';
import { AREAS, AREA_ORDER, MISSIONS, ZONES } from '../data/quests';
import { INDICATORS } from '../data/learning';
import { useStarted } from '../game/store';
import { addCoachNote, answerOf, approveWork, createWork, requestRevision, setAnswer, sheetKey, towerUnlocked, updateWork, workForRef } from '../game/rules';
import type { CreativityTag, Work } from '../game/types';
import { ApprovalPanel } from './Answering';
import { piecesOf } from './Boss';
import { SupportBar } from './MissionModal';
import { Modal, SpeakButton, StatusChip } from './ui';

export function TowerModal() {
  const { state, setState, close } = useStarted();
  const [tab, setTab] = useState(() => Math.max(0, state.towerProgress.findIndex((x) => !x)));
  if (!towerUnlocked(state)) {
    return (
      <Modal title="5. ศูนย์ส่งเสริมการคิดสร้างสรรค์" icon="🗼" onClose={close}>
        <div className="boss-stage locked">
          <div className="boss-big" aria-hidden="true">🗼🔒</div>
          <div>
            <p>ประตูยังล็อกอยู่ ต้องรวบรวมคริสตัลให้ครบ 3 ดวง (ตอนนี้มี {state.crystalCount} ดวง)</p>
            <p className="muted">ผ่านด่านตรวจของบอสแต่ละโซนเพื่อรับคริสตัลสีฟ้า สีเขียว และสีแดง</p>
          </div>
        </div>
      </Modal>
    );
  }
  const area = AREA_ORDER[tab];
  const work = workForRef(state, 'tower', area);
  const ind = INDICATORS.find((g) => g.tag === area)!;
  const intro = `ชั้น${AREAS[area].name}: ทุกคนเลือกผลงานที่ภูมิใจที่สุดจากภารกิจ${AREAS[area].name}ทั้ง 3 โซน แล้วอธิบายว่าผลงานนี้แสดง${AREAS[area].name}อย่างไร`;

  return (
    <Modal title="5. ศูนย์ส่งเสริมการคิดสร้างสรรค์ · นิทรรศการหอคอย" icon="🗼" onClose={close} wide tone="#f5b700">
      <div className="tower-progress">
        {AREA_ORDER.map((t, i) => (
          <button key={t} type="button" className={`step ${tab === i ? 'on' : ''}`} onClick={() => setTab(i)}>
            {state.towerProgress[i] ? '✅' : AREAS[t].symbol} ชั้น {t} {AREAS[t].name}
          </button>
        ))}
      </div>
      <SupportBar />
      <p className="prompt">🎯 {intro} <SpeakButton text={intro} /></p>
      <p className="muted small">ตัวบ่งชี้ด้านนี้: {ind.items.map((x) => `${x.code} ${x.text}`).join(' · ')}</p>
      {!work ? (
        <button type="button" className="btn big" onClick={() => setState((s) => createWork(s, { kind: 'tower', refId: area, title: `นิทรรศการชั้น${AREAS[area].name}`, creativityTags: [area] })[0])}>
          ✨ เปิดชั้น{AREAS[area].name}
        </button>
      ) : (
        <Floor work={work} area={area} />
      )}
    </Modal>
  );
}

function Floor({ work, area }: { work: Work; area: CreativityTag }) {
  const { state, setState, toast } = useStarted();
  const missions = MISSIONS.filter((m) => m.area === area);
  const locked = work.status === 'approved';
  const set = (pid: string, part: string, text: string) => setState((s) => updateWork(s, work.id, (w) => setAnswer(w, sheetKey(pid, `${area}.${part}`), text, pid)));
  const ready = state.players.every((p) => answerOf(work, p.id, `${area}.pick`).trim() && answerOf(work, p.id, `${area}.why`).trim());

  return (
    <div>
      <StatusChip status={work.status} />
      <div className="exhibit">
        {state.players.map((p) => {
          const options = missions.flatMap((m) => piecesOf(state, m, p.id).map((x) => ({ text: x, from: `${ZONES[m.zone].short}: ${m.title}` })));
          const drawing = missions.map((m) => workForRef(state, 'mission', m.id)?.drawings?.[p.id]).filter(Boolean).pop();
          return (
            <article key={p.id} className="exhibit-card" style={{ borderColor: p.color }}>
              <header>{p.avatar} <strong>{p.name}</strong></header>
              <select disabled={locked} value="" aria-label={`เลือกผลงานของ${p.name}`}
                onChange={(e) => { const o = options[Number(e.target.value)]; if (o) { set(p.id, 'pick', o.text); set(p.id, 'from', o.from); } }}>
                <option value="">— เลือกผลงานจาก 3 โซน ({options.length} ชิ้น) —</option>
                {options.map((o, i) => <option key={i} value={i}>{o.from} · {o.text.length > 50 ? `${o.text.slice(0, 50)}…` : o.text}</option>)}
              </select>
              <blockquote className="exhibit-pick">{answerOf(work, p.id, `${area}.pick`) || <span className="muted">ยังไม่ได้เลือก</span>}</blockquote>
              {answerOf(work, p.id, `${area}.from`) && <div className="muted small">จาก {answerOf(work, p.id, `${area}.from`)}</div>}
              {area === 'O' && drawing && <img className="thumb" src={drawing} alt={`ภาพประกอบของ${p.name}`} />}
              <textarea className="answer" rows={2} disabled={locked} value={answerOf(work, p.id, `${area}.why`)} onChange={(e) => set(p.id, 'why', e.target.value)}
                placeholder={`ผลงานนี้แสดง${AREAS[area].name}อย่างไร เพราะอะไร`} aria-label={`เหตุผลของ${p.name}`} />
            </article>
          );
        })}
      </div>
      <ApprovalPanel
        work={work}
        ready={!!ready}
        readyHint={ready ? undefined : 'ทุกคนเลือกผลงานและเขียนเหตุผลก่อน'}
        onApprove={(by, text) => { setState((s) => approveWork(s, work.id, by, text)); toast(`🌟 ชั้น${AREAS[area].name}ของหอคอยสว่างแล้ว!`); }}
        onRevise={(text) => setState((s) => requestRevision(s, work.id, text))}
        onNote={(text) => setState((s) => addCoachNote(s, { text, workId: work.id }))}
      />
    </div>
  );
}
