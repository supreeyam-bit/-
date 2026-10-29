// บอสประจำโซน = ด่านตรวจความสำเร็จของภารกิจหลัก 4 ด้านในโซน
// ผนึก 4 ดวง (F / FL / O / E): ทุกคนเลือกผลงานที่ดีที่สุดของตนจากภารกิจด้านนั้น ปรับให้ตรงเกณฑ์ของโซน และอธิบายเหตุผล → ครูรับรอง → ได้คริสตัล
import { useState } from 'react';
import { AREAS, AREA_ORDER, BOSSES, MISSIONS, ZONES, missionOf } from '../data/quests';
import { useStarted } from '../game/store';
import {
  addCoachNote, answerOf, approveWork, createWork, missionSlotKeys, missionsOfZone, playerName, requestRevision, setAnswer, sheetKey, updateWork, workForRef,
} from '../game/rules';
import type { CreativityTag, GameState, Mission, Work } from '../game/types';
import { ApprovalPanel, ExchangePanel, everyoneExchanged } from './Answering';
import { SupportBar } from './MissionModal';
import { Modal, SpeakButton, StatusChip } from './ui';

const sealKey = (area: CreativityTag) => `seal:${area}`;

export function BossModal() {
  const { state, setState, close } = useStarted();
  // ตรึงโซนไว้ตอนเปิดหน้าต่าง: ชนะบอสแล้วเกมย้ายไปโซนถัดไปทันที แต่หน้าต่างนี้ยังต้องแสดงฉากชัยชนะ
  const [zoneId] = useState(state.zone);
  const boss = BOSSES[zoneId];
  const zone = ZONES[zoneId];
  const status = state.bossStatus[zoneId];
  const refId = `B${boss.zone + 1}`;
  const work = workForRef(state, 'boss', refId);

  if (status === 'locked') {
    return (
      <Modal title={`ประตูบอส · ${boss.name}`} icon="🔒" onClose={close} tone={zone.colors.main}>
        <div className="boss-stage locked">
          <div className="boss-big" aria-hidden="true">{boss.emoji}</div>
          <div>
            <p>ประตูยังล็อกอยู่ ต้องผ่านภารกิจหลักครบ 4 ด้านของ{zone.name}และได้รับการรับรองก่อน</p>
            <p>ตอนนี้ผ่านแล้ว {missionsOfZone(zoneId).filter((m) => state.missionProgress[MISSIONS.indexOf(m)] === 'done').length}/4 ด้าน</p>
          </div>
        </div>
      </Modal>
    );
  }

  if (!work) {
    return (
      <Modal title={`ท้าสู้ ${boss.name}`} icon="⚡" onClose={close} tone={zone.colors.main}>
        <div className="boss-stage">
          <div className="boss-big" aria-hidden="true">{boss.emoji}</div>
          <p className="story">{boss.intro} <SpeakButton text={boss.intro} /></p>
        </div>
        <p>เกณฑ์ของ{zone.name}: {boss.criteria.join(' · ')}</p>
        <button type="button" className="btn big" onClick={() => setState((s) => {
          const [s2, id] = createWork(s, { kind: 'boss', refId, title: `ด่านตรวจ: ${boss.name}`, zone: boss.zone, creativityTags: ['E'], indicators: ['4.2', '4.3'] });
          return { ...s2, currentMission: id };
        })}>⚔️ เริ่มทำลายผนึกด้วยภาษา</button>
      </Modal>
    );
  }
  return <BossFight work={work} />;
}

function BossFight({ work }: { work: Work }) {
  const { state, setState, close, toast } = useStarted();
  const boss = BOSSES[work.zone!];
  const zone = ZONES[work.zone!];
  const sealsDone = AREA_ORDER.filter((a) => work.checklist?.[sealKey(a)]).length;
  const hp = 4 - sealsDone;
  const exchanged = everyoneExchanged(work, state.players.map((p) => p.id));
  const defeated = work.status === 'approved';

  return (
    <Modal title={`ด่านตรวจ: ${boss.name}`} icon={boss.emoji} onClose={close} wide tone={zone.colors.main}>
      <div className={`boss-stage ${defeated ? 'won' : ''}`}>
        <div className="boss-big" aria-hidden="true">{defeated ? '💎' : boss.emoji}</div>
        <div>
          <div className="hp" aria-label={`ผนึกเหลือ ${hp} จาก 4`}>
            ผนึกที่เหลือ: {AREA_ORDER.map((a) => <span key={a} className="seal" style={{ opacity: work.checklist?.[sealKey(a)] ? 0.25 : 1 }}>{AREAS[a].symbol}</span>)}
          </div>
          <StatusChip status={state.bossStatus[work.zone!]} />
          {defeated && <p className="won-text">🎉 {boss.defeatText} ทีมได้รับ{boss.crystal}!</p>}
        </div>
      </div>
      <SupportBar />
      <p>📏 เกณฑ์ของ{zone.name}: <strong>{boss.criteria.join(' · ')}</strong></p>
      {AREA_ORDER.map((a) => <Seal key={a} work={work} area={a} />)}
      {sealsDone === 4 && !defeated && (
        <section>
          <h3>💬 ทีมช่วยกันทบทวนก่อนให้ครูรับรอง</h3>
          <ExchangePanel work={work} />
          <ApprovalPanel
            work={work}
            ready={exchanged}
            readyHint={exchanged ? undefined : 'เพื่อนทุกคนเสนอความคิดอย่างน้อยคนละ 1 ครั้งก่อน'}
            onApprove={(by, text) => { setState((s) => approveWork(s, work.id, by, text)); toast(`💎 ผ่านด่านตรวจ${boss.name}! ได้รับ${boss.crystal}`); }}
            onRevise={(text) => setState((s) => requestRevision(s, work.id, text))}
            onNote={(text) => setState((s) => addCoachNote(s, { text, workId: work.id }))}
          />
        </section>
      )}
      {defeated && <div className="row-actions"><button type="button" className="btn big" onClick={close}>{work.zone! < 2 ? '➡️ ไปโซนถัดไป' : '🗼 ไปศูนย์ส่งเสริมการคิดสร้างสรรค์'}</button></div>}
    </Modal>
  );
}

/** ตัวเลือกผลงานของผู้เล่นจากภารกิจด้านนี้ในโซนนี้ */
export function piecesOf(state: GameState, m: Mission, pid: string): string[] {
  const w = workForRef(state, 'mission', m.id);
  const answers = missionSlotKeys(m).filter((k) => k !== 'reason').map((k) => answerOf(w, pid, k)).filter(Boolean);
  const items = (w?.items ?? []).filter((i) => i.by === pid).map((i) => i.text);
  return [...items, ...answers];
}

function Seal({ work, area }: { work: Work; area: CreativityTag }) {
  const { state, setState, toast } = useStarted();
  const boss = BOSSES[work.zone!];
  const mission = missionOf(work.zone!, area);
  const done = !!work.checklist?.[sealKey(area)];
  const defeated = work.status === 'approved';
  const ok = (pid: string) => !!answerOf(work, pid, `${area}.pick`).trim() && !!answerOf(work, pid, `${area}.why`).trim() && boss.criteria.every((c) => work.checklist?.[`${pid}|${area}|${c}`]);
  const allOk = state.players.every((p) => ok(p.id));
  const set = (pid: string, part: string, text: string) => setState((s) => updateWork(s, work.id, (w) => setAnswer(w, sheetKey(pid, `${area}.${part}`), text, pid)));

  return (
    <details className={`boss-task ${done ? 'done' : ''}`} open={!done}>
      <summary>{done ? '✅' : AREAS[area].symbol} ผนึก{AREAS[area].name} — จากภารกิจ “{mission.title}”</summary>
      {state.players.map((p) => {
        const pieces = piecesOf(state, mission, p.id);
        return (
          <div key={p.id} className="seal-row" style={{ borderColor: p.color }}>
            <strong>{p.avatar} {p.name}</strong>
            <label className="small">เลือกผลงานที่ดีที่สุดของฉัน{' '}
              <select disabled={done || defeated} value="" onChange={(e) => e.target.value && set(p.id, 'pick', e.target.value)} aria-label={`เลือกผลงานของ${p.name}`}>
                <option value="">— เลือก ({pieces.length} ชิ้น) —</option>
                {pieces.map((x, i) => <option key={i} value={x}>{x.length > 60 ? `${x.slice(0, 60)}…` : x}</option>)}
              </select>
            </label>
            <textarea className="answer" rows={2} disabled={done || defeated} value={answerOf(work, p.id, `${area}.pick`)} onChange={(e) => set(p.id, 'pick', e.target.value)}
              placeholder="ผลงานที่เลือก (ปรับให้ตรงเกณฑ์ได้ ระบบเก็บก่อนแก้/หลังแก้)" aria-label={`ผลงานที่เลือกของ${p.name}`} />
            <div className="checks-inline">
              {boss.criteria.map((c) => {
                const k = `${p.id}|${area}|${c}`;
                return (
                  <label key={c} className="agree small">
                    <input type="checkbox" disabled={done || defeated} checked={!!work.checklist?.[k]} onChange={(e) => setState((s) => updateWork(s, work.id, (w) => ({ ...w, checklist: { ...w.checklist, [k]: e.target.checked } })))} /> {c}
                  </label>
                );
              })}
            </div>
            <textarea className="answer" rows={2} disabled={done || defeated} value={answerOf(work, p.id, `${area}.why`)} onChange={(e) => set(p.id, 'why', e.target.value)}
              placeholder="ทำไมผลงานนี้ผ่านเกณฑ์ / ปรับอะไรไป เพราะอะไร" aria-label={`เหตุผลของ${p.name}`} />
          </div>
        );
      })}
      {!done && (
        <button type="button" className="btn" disabled={!allOk} onClick={() => { setState((s) => updateWork(s, work.id, (w) => ({ ...w, checklist: { ...w.checklist, [sealKey(area)]: true } }))); toast(`💥 ผนึก${AREAS[area].name}แตกแล้ว!`); }}>
          💥 ทำลายผนึก{AREAS[area].name}
        </button>
      )}
      {!allOk && !done && <p className="muted small">ทุกคนต้องเลือกผลงาน ติ๊กเกณฑ์ครบ และเขียนเหตุผล ({state.players.filter((p) => !ok(p.id)).map((p) => playerName(state, p.id)).join(', ')} ยังไม่ครบ)</p>}
    </details>
  );
}
