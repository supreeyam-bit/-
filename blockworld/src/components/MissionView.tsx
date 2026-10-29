import { useCallback, useState } from 'react';
import { areaOf, INDICATOR_TEXT, type Mission } from '../data';
import { getWork, hasIdea, missionPassed, missionUnlocked, type GameState, type Update } from '../store';
import CoachPanel from './CoachPanel';
import ExchangePanel from './ExchangePanel';
import HelpBase from './HelpBase';
import Timer from './Timer';
import WorkEditor from './WorkEditor';

export function ScenarioCard({ mission }: { mission: Mission }) {
  return (
    <div className="scenario" data-scenario={mission.scenario_id}>
      <div className="scenario-art" aria-hidden>{mission.emoji.split(' ').map((e, i) => <span key={i} style={{ animationDelay: `${i * 0.3}s` }}>{e}</span>)}</div>
      <div>
        <p className="label">ภาพสถานการณ์ (สื่อฝึก): {mission.scenario}</p>
        <p>{mission.scenario_text}</p>
      </div>
    </div>
  );
}

export default function MissionView({ state, update, mission, initialPlayer, teacher }: {
  state: GameState; update: Update; mission: Mission; initialPlayer?: string; teacher: boolean;
}) {
  const [playerId, setPlayerId] = useState(initialPlayer ?? state.players[state.turn].id);
  const [timeUp, setTimeUp] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const onTimeUp = useCallback((up: boolean) => setTimeUp(up), []);
  const locked = !missionUnlocked(state, mission.id);
  const area = areaOf(mission.area_id);
  const passed = missionPassed(state, mission.id);
  const indicators = mission.indicator.split(',').map((s) => s.trim());

  return (
    <div className="mission" data-testid="mission-view" data-mission={mission.id}>
      <header className="mission-head" style={{ ['--c' as string]: area.color }}>
        <div className="mission-badges">
          <span className="badge">โซน {mission.zone} {mission.zone_name}</span>
          <span className="badge area">{area.shape} {mission.area} ({mission.area_en})</span>
          <span className="badge">ตัวชี้วัด {mission.indicator}</span>
          {mission.time_limit_minutes && <span className="badge time">⏱️ {mission.time_limit_minutes} นาที</span>}
          {passed && <span className="badge ok">✓ ทีมผ่านภารกิจนี้แล้ว</span>}
        </div>
      </header>

      <ScenarioCard mission={mission} />

      <section className="instruction" data-testid="instruction">
        <p className="label">ภารกิจ (ข้อความตามตารางที่ 2)</p>
        <blockquote>{mission.instruction_exact_from_table_2}</blockquote>
        <details>
          <summary className="muted">ตัวชี้วัด</summary>
          <ul>{indicators.map((i) => <li key={i}>{INDICATOR_TEXT[i] ?? i}</li>)}</ul>
        </details>
      </section>

      {mission.time_limit_minutes && !locked && <Timer minutes={mission.time_limit_minutes} onTimeUpChange={onTimeUp} />}

      <ExchangePanel state={state} update={update} missionId={mission.id} locked={locked} />

      <div className="player-tabs" role="tablist" aria-label="ผลงานของผู้เล่น">
        {state.players.map((p) => {
          const w = getWork(state, mission.id, p.id);
          return (
            <button key={p.id} role="tab" aria-selected={p.id === playerId} className={p.id === playerId ? 'on' : ''} style={{ ['--c' as string]: p.color }} onClick={() => setPlayerId(p.id)}>
              {p.name} <small>{w.status === 'approved' ? '✓' : w.status === 'submitted' ? '📤' : w.status === 'revise' ? '↺' : w.entries.length ? `${w.entries.length}` : ''}{hasIdea(state, mission.id, p.id) ? ' 💬' : ''}</small>
            </button>
          );
        })}
      </div>

      <WorkEditor state={state} update={update} mission={mission} playerId={playerId} locked={locked} timeUp={timeUp} />

      <div className="row gap">
        <button className="btn" onClick={() => setShowHelp(!showHelp)} data-testid="open-help">🛟 ฐานการช่วยเหลือ</button>
      </div>
      {showHelp && <HelpBase state={state} update={update} mission={mission} playerId={playerId} />}

      {teacher ? <CoachPanel state={state} update={update} mission={mission} /> : <p className="muted small">ครูเปิด "โหมดครู" ที่แถบด้านบนเพื่อรับรองคำตอบ ให้ปรับปรุง หรือบันทึกข้อสังเกต</p>}
    </div>
  );
}
