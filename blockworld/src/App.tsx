import { useEffect, useRef, useState } from 'react';
import BoardMap from './components/BoardMap';
import BossScene from './components/BossScene';
import Dashboard from './components/Dashboard';
import Dice from './components/Dice';
import MissionView from './components/MissionView';
import Setup from './components/Setup';
import StationView from './components/Stations';
import Tower from './components/Tower';
import { BOSSES, ZONE_STORY } from './content';
import { areaOf, DICE_FACES, missionById, MISSIONS, missionsOfZone, station, TRACK, ZONES, type StationId } from './data';
import { addLog, crystals, getWork, missionPassed, newGame, useGame, zoneCleared } from './store';

type View = 'map' | 'missions' | 'tower' | 'dashboard';
type Modal = { kind: 'station'; id: StationId } | { kind: 'mission'; id: string; player?: string } | { kind: 'boss'; zone: number } | { kind: 'intro' } | null;

const INTRO = [
  'กาลครั้งหนึ่ง ในอาณาจักรที่สร้างจากบล็อกคำ ทุกสิ่งมีชีวิตได้เพราะประโยคที่สมบูรณ์',
  'วันหนึ่ง ยุ่งเหยิงทั้งสามตื่นขึ้น ป้ายพัง สีหาย และเสียงดังไปทั้งเมือง',
  'นักสร้างโลกต้องผ่าน 3 โซน ทำภารกิจ 4 ด้าน และนำคริสตัล 3 ก้อนกลับสู่หอคอยกลางเมือง',
];

export default function App() {
  const { state, setState, update } = useGame();
  const [view, setView] = useState<View>('map');
  const [modal, setModal] = useState<Modal>(null);
  const [teacher, setTeacher] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!state) {
    return (
      <Setup
        onStart={(players, pin) => {
          setState(newGame(players, pin));
          setModal({ kind: 'intro' });
          setIntroStep(0);
        }}
      />
    );
  }

  const current = state.players[state.turn];

  const roll = () => {
    if (rolling) return;
    const face = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
    const moverIdx = state.turn;
    const mover = state.players[moverIdx];
    setRolling(true);
    update((d) => { d.lastRoll = face; addLog(d, `${mover.name} ทอยได้ ${face}`); });
    for (let s = 1; s <= face; s++) {
      timers.current.push(window.setTimeout(() => update((d) => { d.players[moverIdx].pos = (d.players[moverIdx].pos + 1) % TRACK.length; }), 450 + s * 380));
    }
    timers.current.push(window.setTimeout(() => {
      const pos = (mover.pos + face) % TRACK.length;
      const sp = TRACK[pos];
      update((d) => { d.turn = (moverIdx + 1) % d.players.length; });
      setRolling(false);
      if (sp.kind === 'mission') {
        const m = missionsOfZone(state.zone).find((x) => x.area_id === sp.area)!;
        setModal({ kind: 'mission', id: m.id, player: mover.id });
      } else setModal({ kind: 'station', id: sp.station });
    }, 450 + face * 380 + 450));
  };

  const askTeacher = () => {
    if (teacher) return setTeacher(false);
    if (!state.teacherPin || prompt('ใส่รหัสโหมดครู') === state.teacherPin) setTeacher(true);
    else alert('รหัสไม่ถูกต้อง');
  };
  const openDashboard = () => {
    if (!teacher && state.teacherPin) {
      if (prompt('ใส่รหัสโหมดครู') !== state.teacherPin) return alert('รหัสไม่ถูกต้อง');
      setTeacher(true);
    }
    setView('dashboard');
  };
  const openMission = (id: string) => setModal({ kind: 'mission', id });
  const cleared = zoneCleared(state, state.zone) && !state.bossDefeated[state.zone - 1];

  let modalTitle = '';
  let modalBody: React.ReactNode = null;
  if (modal?.kind === 'station') {
    const st = station(modal.id);
    modalTitle = `${st.icon} ${st.name}`;
    modalBody = <StationView id={modal.id} state={state} update={update} onMission={openMission} onTower={() => { setModal(null); setView('tower'); }} />;
  } else if (modal?.kind === 'mission') {
    const m = missionById(modal.id);
    modalTitle = `ภารกิจ: ${m.area} · ${m.zone_name}`;
    modalBody = <MissionView key={modal.id} state={state} update={update} mission={m} initialPlayer={modal.player} teacher={teacher} />;
  } else if (modal?.kind === 'boss') {
    modalTitle = `บอสโซน ${modal.zone}`;
    modalBody = <BossScene state={state} update={update} zone={modal.zone} onClose={() => { setModal(null); if (state.finished || modal.zone === 3) setView('tower'); }} />;
  } else if (modal?.kind === 'intro') {
    modalTitle = 'BLOCK WORLD';
    modalBody = (
      <div className="boss intro" data-testid="intro">
        <div className="boss-face">🏰</div>
        <p className="cut-line" key={introStep}>{INTRO[introStep]}</p>
        {introStep < INTRO.length - 1
          ? <button className="btn primary" onClick={() => setIntroStep(introStep + 1)}>ต่อไป ▶</button>
          : <button className="btn accent" onClick={() => setModal(null)} data-testid="intro-done">เริ่มที่โซน 1 การสร้างประโยค</button>}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo-blocks small"><i style={{ background: '#d63a2f' }} /><i style={{ background: '#e8a800' }} /><i style={{ background: '#2058b8' }} /></span>
          <div>
            <b>BLOCK WORLD</b>
            <small>อาณาจักรนักสร้างโลกแห่งคำ</small>
          </div>
        </div>
        <div className="inventory" aria-label="คลังของทีม">
          {BOSSES.map((b, i) => <span key={b.zone} className={`gem ${state.bossDefeated[i] ? 'on' : ''}`} style={{ ['--c' as string]: b.crystalColor }} title={b.crystal}>💎</span>)}
          <small>{crystals(state)}/3</small>
        </div>
        <button className={`btn small ${teacher ? 'accent' : ''}`} onClick={askTeacher} data-testid="teacher-toggle">{teacher ? '🦉 โหมดครู: เปิด' : '🦉 โหมดครู'}</button>
      </header>
      <nav className="tabs main-tabs" role="tablist">
        <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>🗺️ แผนที่</button>
        <button className={view === 'missions' ? 'on' : ''} onClick={() => setView('missions')} data-testid="tab-missions">📜 ภารกิจ 12 ใบ</button>
        <button className={view === 'tower' ? 'on' : ''} onClick={() => setView('tower')}>🏰 หอคอย</button>
        <button className={view === 'dashboard' ? 'on' : ''} onClick={openDashboard} data-testid="tab-dashboard">📊 ครู</button>
      </nav>

      <main className="content">
        {view === 'map' && (
          <div className="map-layout">
            <BoardMap state={state} onStation={(id) => setModal({ kind: 'station', id })} onMission={openMission} onBoss={(zone) => setModal({ kind: 'boss', zone })} />
            <aside className="side">
              <div className="card turn">
                <p className="label">เทิร์นของ</p>
                <h2 data-testid="current-player"><span className="dot big" style={{ background: current.color }} /> {current.name}</h2>
                <div className="row gap">
                  <Dice value={state.lastRoll} rolling={rolling} />
                  <button className="btn primary big" onClick={roll} disabled={rolling || state.finished} data-testid="roll">🎲 ทอยลูกเต๋า</button>
                </div>
                <p className="muted small">ลูกเต๋า 6 หน้า: 1 1 2 2 3 3 · ตกช่องไหนเปิดช่องนั้น กดช่องบนแผนที่เพื่อเปิดสถานีได้ตลอด</p>
              </div>
              {cleared && (
                <button className="btn accent wide pulse" onClick={() => setModal({ kind: 'boss', zone: state.zone })} data-testid="face-boss">
                  {BOSSES[state.zone - 1].icon} ผ่านครบ 4 ด้านแล้ว! เผชิญหน้า {BOSSES[state.zone - 1].name}
                </button>
              )}
              <div className="card">
                <p className="label">โซน {state.zone}: {ZONES[state.zone - 1].name}</p>
                <p className="small">{ZONE_STORY[state.zone - 1]}</p>
                <ul className="zone-missions">
                  {missionsOfZone(state.zone).map((m) => (
                    <li key={m.id}>
                      <button className="linklike" onClick={() => openMission(m.id)}>
                        <span style={{ color: areaOf(m.area_id).color }}>{areaOf(m.area_id).shape}</span> {m.area} {missionPassed(state, m.id) ? '✓' : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <p className="label">ผู้เล่น</p>
                {state.players.map((p, i) => (
                  <div key={p.id} className={`pl ${i === state.turn ? 'now' : ''}`}>
                    <span className="dot" style={{ background: p.color }} /> {p.name}
                    <small className="muted"> · {(() => { const sp = TRACK[p.pos]; return sp.kind === 'station' ? station(sp.station).name : `ภารกิจ${areaOf(sp.area).name}`; })()}</small>
                  </div>
                ))}
              </div>
              <ul className="log small">{state.log.slice(0, 5).map((l, i) => <li key={i}>{l.text}</li>)}</ul>
            </aside>
          </div>
        )}

        {view === 'missions' && (
          <div className="missions-list" data-testid="missions-list">
            {ZONES.map((z) => (
              <section key={z.zone}>
                <h2>โซน {z.zone} {z.name} {z.zone > state.zone ? '🔒' : ''}</h2>
                <div className="mission-cards">
                  {MISSIONS.filter((m) => m.zone === z.zone).map((m) => {
                    const a = areaOf(m.area_id);
                    const done = state.players.filter((p) => getWork(state, m.id, p.id).status === 'approved').length;
                    return (
                      <button key={m.id} className={`mission-card ${missionPassed(state, m.id) ? 'passed' : ''}`} style={{ ['--c' as string]: a.color }} onClick={() => openMission(m.id)} data-testid={`mission-card-${m.id}`}>
                        <span className="mc-shape">{a.shape}</span>
                        <b>{m.area}</b>
                        <small>{m.area_en} · ตัวชี้วัด {m.indicator}{m.time_limit_minutes ? ` · ⏱️ ${m.time_limit_minutes} นาที` : ''}</small>
                        <span className="mc-scene">{m.emoji} {m.scenario}</span>
                        <span className="mc-text">{m.instruction_exact_from_table_2}</span>
                        <small>ครูรับรอง {done}/{state.players.length} คน</small>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {view === 'tower' && <Tower state={state} update={update} onMission={openMission} />}
        {view === 'dashboard' && (
          <Dashboard
            state={state}
            onMission={openMission}
            onImport={(s) => { setState(s); update((d) => addLog(d, 'นำเข้าไฟล์เกม')); }}
            onReset={() => { setState(null); setTeacher(false); setView('map'); }}
          />
        )}
      </main>

      {modal && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && modal.kind !== 'intro' && setModal(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label={modalTitle}>
            <div className="modal-head">
              <h2>{modalTitle}</h2>
              {modal.kind !== 'intro' && <button className="btn small ghost" onClick={() => setModal(null)} aria-label="ปิด" data-testid="close-modal">✕ ปิด</button>}
            </div>
            <div className="modal-body">{modalBody}</div>
          </div>
        </div>
      )}
    </div>
  );
}
