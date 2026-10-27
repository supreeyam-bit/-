// สู้บอสด้วยภาษา: ทำภารกิจย่อยครบ 3 ข้อ พลังบอสหมด แล้วให้ครู/โค้ชรับรองชัยชนะ → ได้คริสตัล
import { useState } from 'react';
import { BOSSES, ZONES } from '../data/quests';
import { useStarted } from '../game/store';
import { activePlayer, addCoachNote, approveWork, createWork, requestRevision, runChecks, setAnswer, updateWork, workForRef } from '../game/rules';
import { ApprovalPanel, ExchangePanel, SlotEditor, everyoneExchanged } from './Answering';
import { SupportBar } from './MissionModal';
import { Checks, Modal, SpeakButton, StatusChip } from './ui';
import type { Work } from '../game/types';

const doneKey = (k: string) => `done:${k}`;

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
          <p>ประตูยังล็อกอยู่ ต้องทำภารกิจครบ 5 หัวข้อของ{zone.name}และได้รับการรับรองก่อน</p>
          <p>ตอนนี้ผ่านแล้ว {state.topicProgress.slice(zoneId * 5, zoneId * 5 + 5).filter((t) => t === 'done').length}/5 หัวข้อ</p>
        </div>
      </Modal>
    );
  }

  const begin = () => {
    setState((s) => {
      const [s2, id] = createWork(s, { kind: 'boss', refId, title: `บอส: ${boss.name}`, zone: boss.zone, creativityTags: ['FL', 'E'] });
      return { ...s2, currentMission: id };
    });
  };

  if (!work) {
    return (
      <Modal title={`ท้าสู้ ${boss.name}`} icon="⚡" onClose={close} tone={zone.colors.main}>
        <div className="boss-stage">
          <div className="boss-big" aria-hidden="true">{boss.emoji}</div>
          <p className="story">{boss.intro} <SpeakButton text={boss.intro} /></p>
          <p className="muted">สู้ด้วยภาษา ไม่ใช่การตี: ทำภารกิจย่อยครบ 3 ข้อ พลังของบอสจะหมดลง</p>
          <button type="button" className="btn big" onClick={begin}>⚔️ เริ่มสู้ด้วยภาษา</button>
        </div>
      </Modal>
    );
  }
  return <BossFight work={work} />;
}

function BossFight({ work }: { work: Work }) {
  const { state, setState, close, toast } = useStarted();
  const boss = BOSSES[work.zone!];
  const zone = ZONES[work.zone!];
  const tasksDone = boss.tasks.filter((t) => work.checklist?.[doneKey(t.key)]).length;
  const hp = boss.tasks.length - tasksDone;
  const exchanged = everyoneExchanged(work, state.players.map((p) => p.id));
  const defeated = work.status === 'approved';

  const hit = (key: string) => {
    setState((s) => updateWork(s, work.id, (w) => ({ ...w, checklist: { ...w.checklist, [doneKey(key)]: true } })));
    toast('💥 ภาษาของทีมทำให้พลังบอสลดลง!');
  };

  return (
    <Modal title={`สู้บอส: ${boss.name}`} icon={boss.emoji} onClose={close} wide tone={zone.colors.main}>
      <div className={`boss-stage ${defeated ? 'won' : ''}`}>
        <div className="boss-big" aria-hidden="true">{defeated ? '💎' : boss.emoji}</div>
        <div>
          <div className="hp" aria-label={`พลังบอสเหลือ ${hp} จาก ${boss.tasks.length}`}>
            พลังความสับสน: {Array.from({ length: boss.tasks.length }, (_, i) => <span key={i} className={i < hp ? 'heart' : 'heart off'}>{i < hp ? '🟣' : '⚪'}</span>)}
          </div>
          <StatusChip status={state.bossStatus[work.zone!]} />
          {defeated && <p className="won-text">🎉 {boss.defeatText} ทีมได้รับ{boss.crystal}!</p>}
        </div>
      </div>
      <SupportBar />
      {boss.tasks.map((t, i) => {
        const done = !!work.checklist?.[doneKey(t.key)];
        const keys = t.slots.map((s) => `${t.key}.${s.key}`);
        const values = Object.fromEntries(t.slots.map((s) => [s.key, work.answers[`${t.key}.${s.key}`]?.final ?? '']));
        const filled = keys.every((k) => (work.answers[k]?.final ?? '').trim());
        return (
          <details key={t.key} className={`boss-task ${done ? 'done' : ''}`} open={!done && (i === 0 || !!work.checklist?.[doneKey(boss.tasks[i - 1].key)])}>
            <summary>{done ? '✅' : '⚔️'} ภารกิจย่อย {i + 1}: {t.title}</summary>
            <p className="prompt">🎯 {t.prompt} <SpeakButton text={t.prompt} /></p>
            <fieldset className="plain" disabled={defeated}>
              {t.slots.map((s) => (
                <SlotEditor key={s.key} slot={{ ...s, key: `${t.key}.${s.key}` }} work={work} words={t.starterWords}
                  onChange={(text) => setState((st) => updateWork(st, work.id, (w) => setAnswer(w, `${t.key}.${s.key}`, text, activePlayer(st).id)))} />
              ))}
              {t.selfChecklist && (
                <div className="self-check">
                  <strong>📋 ตรวจความชัดเจน</strong>
                  {t.selfChecklist.map((c) => (
                    <label key={c} className="agree">
                      <input type="checkbox" checked={!!work.checklist?.[c]} onChange={(e) => setState((st) => updateWork(st, work.id, (w) => ({ ...w, checklist: { ...w.checklist, [c]: e.target.checked } })))} /> {c}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <Checks results={runChecks(t.autoChecks, values)} />
            {!done && <button type="button" className="btn" disabled={!filled} onClick={() => hit(t.key)}>💥 ใช้ภาษาโจมตี</button>}
          </details>
        );
      })}
      {tasksDone === boss.tasks.length && !defeated && (
        <section>
          <h3>💬 ทีมช่วยกันทบทวนก่อนให้ครูรับรอง</h3>
          <ExchangePanel work={work} />
          <ApprovalPanel
            work={work}
            ready={exchanged}
            readyHint={exchanged ? undefined : 'เพื่อนทุกคนเสนอความคิดอย่างน้อยคนละ 1 ครั้งก่อน'}
            onApprove={(by, text) => { setState((s) => approveWork(s, work.id, by, text)); toast(`💎 ชนะ${boss.name}! ได้รับ${boss.crystal}`); }}
            onRevise={(text) => setState((s) => requestRevision(s, work.id, text))}
            onNote={(text) => setState((s) => addCoachNote(s, { text, workId: work.id }))}
          />
        </section>
      )}
      {defeated && <div className="row-actions"><button type="button" className="btn big" onClick={close}>{work.zone! < 2 ? '➡️ ไปโซนถัดไป' : '🗼 ไปหอคอยกลาง'}</button></div>}
    </Modal>
  );
}
