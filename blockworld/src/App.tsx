import { useEffect, useRef, useState } from 'react';
import { BOSSES, QUESTS, ZONES } from './data/quests';
import { ELEMENTS, SPACE_INFO } from './data/learning';
import { GameProvider, useGame, useStarted, type Modal } from './game/store';
import { DICE_FACES, SPACES_PER_ZONE, activePlayer, addLog, endTurn, questsOfZone, recordRoll, rollDie, spaceKind, stepActive } from './game/rules';
import { Board } from './components/Board';
import { BossModal } from './components/Boss';
import { CoachPanel } from './components/Coach';
import { HelpCenter } from './components/Help';
import { MissionBoard, MissionModal } from './components/MissionModal';
import { BuilderModal, CityModal, EndingModal, ExchangeLogModal, HistoryModal, IntroModal, ProblemModal, RulesModal, SpaceModal } from './components/Panels';
import { LearningCenter } from './components/Resources';
import { Setup } from './components/Setup';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TowerModal } from './components/Tower';
import { StatusChip, Toasts } from './components/ui';

const DIE_DOTS = ['⚀', '⚀', '⚁', '⚂'];
const STEP_MS = 380;

function TurnPanel() {
  const { state, setState, open, openDrawer, modal, drawer } = useStarted();
  const [face, setFace] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const me = activePlayer(state);
  const here = spaceKind(state.zone, state.positions[state.activePlayer]);

  const land = (kind: ReturnType<typeof spaceKind>) => {
    setState((s) => ({ ...s, phase: 'action' }));
    setRolling(false);
    const firstTodo = questsOfZone(state.zone).find((q) => state.topicProgress[q.topic - 1] !== 'done');
    switch (kind) {
      case 'mission': return open({ type: 'missionBoard', fromSpace: true });
      case 'learn': return openDrawer({ type: 'learning', topic: firstTodo?.topic ?? state.zone * 5 + 1 });
      case 'build': return open({ type: 'city' });
      case 'bonus':
        setState((s) => addLog({ ...s, blocks: s.blocks + 1 }, `🎁 ${me.name} ได้บล็อกก่อสร้างฟรี 1 ก้อน`));
        return open({ type: 'space', kind });
      case 'gate':
        if (state.bossStatus[state.zone] === 'available' || state.bossStatus[state.zone] === 'attempted') return open({ type: 'boss' });
        return open({ type: 'space', kind });
      default: return open({ type: 'space', kind });
    }
  };

  const roll = () => {
    if (state.phase !== 'roll' || rolling) return;
    setRolling(true);
    const value = rollDie();
    const final = (state.positions[state.activePlayer] + value) % SPACES_PER_ZONE;
    const kind = spaceKind(state.zone, final);
    let t = 0;
    const spin = setInterval(() => setFace(DICE_FACES[t++ % DICE_FACES.length]), 90);
    setTimeout(() => {
      clearInterval(spin);
      setFace(value);
      setState((s) => recordRoll(s, value));
      let k = 0;
      const step = () => {
        setState(stepActive);
        if (++k < value) setTimeout(step, STEP_MS);
        else setTimeout(() => land(kind), STEP_MS);
      };
      setTimeout(step, STEP_MS);
    }, 600);
  };

  const finish = () => {
    setFace(null);
    setState(endTurn);
  };

  // คีย์ลัด
  const keys = useRef({ roll, finish });
  keys.current = { roll, finish };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (modal || drawer || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'r') keys.current.roll();
      else if (k === 'e') keys.current.finish();
      else if (k === 'm') open({ type: 'missionBoard' });
      else if (k === 'h') openDrawer({ type: 'help' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, drawer, open, openDrawer]);

  return (
    <section className="panel turn" aria-label="ตาของผู้เล่น" style={{ borderColor: me.color }}>
      <div className="turn-who">
        <span className="big-avatar" style={{ background: me.color }} aria-hidden="true">{me.avatar}</span>
        <div>
          <div className="muted small">ถึงตา</div>
          <div className="turn-name">{me.name}</div>
          <div className="small">ยืนอยู่: {SPACE_INFO[here].icon} {SPACE_INFO[here].name}</div>
        </div>
        <div className={`die ${rolling ? 'rolling' : ''}`} aria-live="polite" aria-label={face ? `ลูกเต๋าได้ ${face}` : 'ยังไม่ทอย'}>
          {face ? DIE_DOTS[face] : '🎲'}
          {face && <small>{face}</small>}
        </div>
      </div>
      <div className="row-actions">
        <button type="button" className="btn big" onClick={roll} disabled={state.phase !== 'roll' || rolling}>🎲 ทอยลูกเต๋า (1–3)</button>
        <button type="button" className="btn big ghost" onClick={finish} disabled={rolling}>⏭️ จบตา</button>
      </div>
      {state.phase === 'action' && !rolling && (
        <button type="button" className="btn small ghost" onClick={() => land(here)}>↩️ เปิดผลของช่องนี้อีกครั้ง</button>
      )}
    </section>
  );
}

function StationBar() {
  const { open, openDrawer } = useStarted();
  const act: Record<string, () => void> = {
    problem: () => open({ type: 'problem' }),
    learning: () => openDrawer({ type: 'learning' }),
    tools: () => open({ type: 'builder' }),
    exchange: () => open({ type: 'exchangeLog' }),
    creative: () => open({ type: 'tower' }),
    help: () => openDrawer({ type: 'help' }),
    coach: () => openDrawer({ type: 'coach' }),
  };
  return (
    <nav className="stations" aria-label="เจ็ดองค์ประกอบของสิ่งแวดล้อมการเรียนรู้">
      {ELEMENTS.map((e) => (
        <button key={e.key} type="button" className={`station st-${e.key}`} onClick={act[e.key]} title={e.desc}>
          <span aria-hidden="true">{e.icon}</span> {e.name}
        </button>
      ))}
    </nav>
  );
}

function MissionSummary() {
  const { state, open } = useStarted();
  const z = ZONES[state.zone];
  return (
    <section className="panel" aria-label="ภารกิจในโซนนี้">
      <h2 style={{ color: z.colors.dark }}>🗺️ {z.name}</h2>
      <ul className="mini-missions">
        {QUESTS.filter((q) => q.zone === state.zone).map((q) => (
          <li key={q.id}><span>{q.topic}. {q.topicName}</span> <StatusChip status={state.topicProgress[q.topic - 1]} /></li>
        ))}
        <li><span>{BOSSES[state.zone].emoji} บอส {BOSSES[state.zone].name}</span> <StatusChip status={state.bossStatus[state.zone]} /></li>
      </ul>
      <div className="row-actions">
        <button type="button" className="btn" onClick={() => open({ type: 'missionBoard' })}>📋 กระดานภารกิจ (M)</button>
        <button type="button" className="btn ghost" disabled={state.bossStatus[state.zone] === 'locked'} onClick={() => open({ type: 'boss' })}>⚡ สู้บอส</button>
      </div>
    </section>
  );
}

function TeamPanel() {
  const { state } = useStarted();
  return (
    <section className="panel" aria-label="ทีมและบันทึก">
      <h2>👥 ทีมนักสร้างโลก</h2>
      <ul className="team">
        {state.players.map((p, i) => (
          <li key={p.id} className={i === state.activePlayer ? 'active' : ''}>
            <span className="dot" style={{ background: p.color }} aria-hidden="true">{p.avatar}</span> {p.name}
            <span className="muted small"> ช่อง {state.positions[i] + 1} · ผลงาน {state.responsesByStudent[p.id]?.length ?? 0}</span>
          </li>
        ))}
      </ul>
      {state.wordBank.length > 0 && <p className="small">🔤 คลังคำของทีม: {state.wordBank.join(' · ')}</p>}
      <details>
        <summary>📰 เหตุการณ์ล่าสุด</summary>
        <ul className="log">{[...state.log].reverse().slice(0, 10).map((l, i) => <li key={i}>{l.text}</li>)}</ul>
      </details>
    </section>
  );
}

function Header() {
  const { state, setState, open, coachUnlocked } = useStarted();
  return (
    <header className="top">
      <div className="brand">
        <span aria-hidden="true">🧱</span>
        <div>
          <h1>BLOCK WORLD</h1>
          <div className="small">อาณาจักรนักสร้างโลกแห่งคำ</div>
        </div>
      </div>
      <div className="hud" aria-label="สถานะทีม">
        <span title="คริสตัล">💎 {BOSSES.map((b, i) => <span key={i} className="crystal" style={{ background: i < state.crystalCount ? b.crystalColor : '#cbd5e1' }} aria-label={i < state.crystalCount ? b.crystal : 'ยังไม่ได้'} />)} {state.crystalCount}/3</span>
        <span title="บล็อกก่อสร้าง">🧱 {state.blocks}</span>
        <span title="หอคอย">🗼 {state.towerProgress.filter(Boolean).length}/4</span>
      </div>
      <div className="top-actions">
        <button type="button" className="btn small ghost" onClick={() => open({ type: 'rules' })}>📜 วิธีเล่น</button>
        <button type="button" className="btn small ghost" onClick={() => open({ type: 'city' })}>🏗️ เมือง</button>
        <button type="button" className="btn small ghost" onClick={() => open({ type: 'history' })}>🗂️ ประวัติผลงาน</button>
        <button type="button" className="btn small ghost" aria-pressed={state.settings.speech} onClick={() => setState((s) => ({ ...s, settings: { ...s.settings, speech: !s.settings.speech } }))}>
          {state.settings.speech ? '🔊 เสียงอ่าน: เปิด' : '🔈 เสียงอ่าน: ปิด'}
        </button>
        <button type="button" className="btn small" onClick={() => open({ type: 'dashboard' })}>📊 แดชบอร์ดครู{coachUnlocked ? ' 🔓' : ''}</button>
      </div>
    </header>
  );
}

function ModalLayer({ modal }: { modal: Modal }) {
  const { close } = useStarted();
  switch (modal.type) {
    case 'mission': return <MissionModal key={modal.workId} workId={modal.workId} />;
    case 'missionBoard': return <MissionBoard />;
    case 'boss': return <BossModal />;
    case 'tower': return <TowerModal />;
    case 'city': return <CityModal />;
    case 'rules': return <RulesModal onClose={close} />;
    case 'intro': return <IntroModal />;
    case 'space': return <SpaceModal kind={modal.kind} />;
    case 'problem': return <ProblemModal />;
    case 'builder': return <BuilderModal />;
    case 'exchangeLog': return <ExchangeLogModal />;
    case 'history': return <HistoryModal />;
    case 'dashboard': return <TeacherDashboard />;
    case 'ending': return <EndingModal />;
  }
}

function Game() {
  const { state, modal, drawer, open, close, openDrawer } = useStarted();
  const shownEnding = useRef(state.finished);
  useEffect(() => {
    if (state.finished && !shownEnding.current) {
      shownEnding.current = true;
      open({ type: 'ending' });
    }
  }, [state.finished, open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (drawer) openDrawer(null);
      else if (modal) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer, modal, close, openDrawer]);

  return (
    <div className={`app zone-${state.zone}`}>
      <Header />
      <StationBar />
      <main className="layout">
        <div className="map-col">
          <Board />
          {state.finished && <button type="button" className="btn big" onClick={() => open({ type: 'ending' })}>🌟 ดูฉากจบและสรุปผลงาน</button>}
        </div>
        <aside className="side-col">
          <TurnPanel />
          <MissionSummary />
          <TeamPanel />
        </aside>
      </main>
      <footer className="foot muted small">
        ต้นแบบนวัตกรรมการเรียนรู้ภาษาไทย ป.3 · คะแนนในเกมเป็นกิจกรรมฝึก แยกจากแบบวัดการคิดสร้างสรรค์และแบบทดสอบจริง · ข้อมูลเก็บในเครื่องนี้เท่านั้น
      </footer>
      {modal && <ModalLayer modal={modal} />}
      {drawer?.type === 'learning' && <LearningCenter key={drawer.topic ?? 0} topic={drawer.topic} />}
      {drawer?.type === 'help' && <HelpCenter />}
      {drawer?.type === 'coach' && <CoachPanel />}
    </div>
  );
}

function Root() {
  const { state } = useGame();
  return (
    <>
      {state ? <Game /> : <Setup />}
      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Root />
    </GameProvider>
  );
}
