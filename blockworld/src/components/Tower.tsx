import { useState } from 'react';
import { BOSSES } from '../content';
import { MISSIONS, TOWER, ZONES } from '../data';
import { crystals, getWork, missionPassed, type GameState, type Update } from '../store';

// หอคอย ศูนย์ส่งเสริมการคิดสร้างสรรค์: รวบรวมผลงานสี่ด้านจากสามโซน + สะท้อนคิด (ไม่ใช่แบบวัด)
export default function Tower({ state, update, onMission }: { state: GameState; update: Update; onMission: (id: string) => void }) {
  const [who, setWho] = useState(state.players[0].id);
  const player = state.players.find((p) => p.id === who)!;
  return (
    <div className="tower-view" data-testid="tower-view">
      <h2>🏰 {TOWER.tower_name}</h2>
      <p className="muted">{TOWER.purpose}</p>
      <div className="crystals-row">
        {BOSSES.map((b, i) => (
          <div key={b.zone} className={`crystal ${state.bossDefeated[i] ? 'on' : ''}`} style={{ ['--c' as string]: b.crystalColor }}>
            <span>💎</span><small>{b.crystal}</small>
          </div>
        ))}
      </div>
      {state.finished && <div className="callout ok big-msg">🎉 ทีมรวบรวมคริสตัลครบ {crystals(state)} ก้อน อาณาจักรนักสร้างโลกแห่งคำกลับมาสดใสแล้ว!</div>}

      <div className="row gap wrap">
        <span>ผลงานของ</span>
        {state.players.map((p) => (
          <button key={p.id} className={`chip ${p.id === who ? 'on' : ''}`} onClick={() => setWho(p.id)}>{p.name}</button>
        ))}
      </div>

      {TOWER.areas.map((a) => (
        <section key={a.area_id} className="tower-area">
          <h3>{a.area}</h3>
          <div className="tower-grid">
            {ZONES.map((z) => {
              const m = MISSIONS.find((x) => x.zone === z.zone && x.area_id === a.area_id)!;
              const w = getWork(state, m.id, who);
              return (
                <button key={z.zone} className={`tower-cell ${missionPassed(state, m.id) ? 'passed' : ''}`} onClick={() => onMission(m.id)}>
                  <b>โซน {z.zone} {z.name}</b>
                  <small>ตัวชี้วัด {m.indicator} · {w.status === 'approved' ? 'ครูรับรองแล้ว ✓' : `${w.entries.length} ประโยค`}</small>
                  {w.entries.slice(0, 3).map((e) => <span key={e.id} className="quote">“{e.text}”</span>)}
                  {w.drawings[0] && <img src={w.drawings[0]} alt="ภาพประกอบ" />}
                </button>
              );
            })}
          </div>
          <label className="field">
            <span>สะท้อนคิดของ {player.name}: {TOWER.reflection_prompts.join(' · ')}</span>
            <textarea className="input" rows={2} value={state.reflections[a.area_id]?.[who] ?? ''}
              onChange={(e) => { const v = e.target.value; update((d) => { (d.reflections[a.area_id] ??= {})[who] = v; }); }} />
          </label>
        </section>
      ))}
    </div>
  );
}
