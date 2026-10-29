import { useState } from 'react';
import { BOSSES } from '../content';
import { areaOf, missionsOfZone } from '../data';
import { addLog, getWork, missionPassed, zoneCleared, type GameState, type Update } from '../store';

// คัตซีนบอสประจำโซน: เป็นกลไกเรื่องราว ทีมนำผลงานที่ครูรับรองแล้วมาเล่า ไม่มีการสอบเพิ่ม
export default function BossScene({ state, update, zone, onClose }: { state: GameState; update: Update; zone: number; onClose: () => void }) {
  const boss = BOSSES[zone - 1];
  const [step, setStep] = useState(0);
  const beaten = state.bossDefeated[zone - 1];
  const ready = zone === state.zone && zoneCleared(state, zone);
  const missions = missionsOfZone(zone);

  if (!ready && !beaten) {
    return (
      <div className="boss" data-testid="boss-locked">
        <div className="boss-face">{boss.icon}</div>
        <h3>{boss.name}</h3>
        <p>ทีมต้องผ่านภารกิจครบ 4 ด้านในโซน {zone} ก่อน จึงจะเผชิญหน้าบอสได้</p>
        <ul>{missions.map((m) => <li key={m.id}>{missionPassed(state, m.id) ? '✓' : '○'} {m.area}</li>)}</ul>
        <p className="muted">ภารกิจผ่านเมื่อทุกคนเสนอไอเดียในศูนย์แลกเปลี่ยนเรียนรู้ และครูรับรองผลงานของทุกคนแล้ว</p>
      </div>
    );
  }
  const frames = boss.intro.length;
  if (beaten && step <= frames) {
    return (
      <div className="boss done">
        <div className="boss-face">💎</div>
        <p>{boss.outro}</p>
      </div>
    );
  }

  const win = () => {
    update((d) => {
      d.bossDefeated[zone - 1] = true;
      addLog(d, `ทีมผ่านบอส ${boss.name} ได้รับ${boss.crystal}`);
      if (zone < 3) {
        d.zone = zone + 1;
        d.players.forEach((p) => (p.pos = 0));
      } else d.finished = true;
    });
    setStep(frames + 1);
  };

  return (
    <div className="boss" data-testid="boss-scene">
      <div className={`boss-face ${step <= frames ? 'shake' : ''}`}>{boss.icon}</div>
      <h3>{boss.name}</h3>
      {step < frames && (
        <>
          <p className="cut-line" key={step}>{boss.intro[step]}</p>
          <button className="btn primary" onClick={() => setStep(step + 1)}>ต่อไป ▶</button>
        </>
      )}
      {step === frames && (
        <>
          <p>ผลัดกันอ่านผลงานที่ครูรับรองแล้วของแต่ละด้านให้ยุ่งเหยิงฟัง</p>
          <div className="grid2">
            {missions.map((m) => (
              <div key={m.id} className="card" style={{ borderColor: areaOf(m.area_id).color }}>
                <b>{areaOf(m.area_id).shape} {m.area}</b>
                {state.players.map((p) => {
                  const e = getWork(state, m.id, p.id).entries[0];
                  return <p key={p.id}><small>{p.name}:</small> {e ? `“${e.text}”` : '(ผลงานภาพ)'}</p>;
                })}
              </div>
            ))}
          </div>
          <button className="btn accent" onClick={win} data-testid="boss-win">ทีมนำเสนอผลงานครบทุกด้านแล้ว ✨</button>
        </>
      )}
      {step > frames && (
        <div className="victory">
          <div className="crystal-pop" style={{ ['--c' as string]: boss.crystalColor }}>💎</div>
          <p>{boss.outro}</p>
          <button className="btn primary" onClick={onClose}>{zone < 3 ? `ไปโซน ${zone + 1}` : 'ไปที่หอคอย'}</button>
        </div>
      )}
    </div>
  );
}
