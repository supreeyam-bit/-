import { useCallback, useEffect, useRef, useState } from 'react';
import { BOSSES, DIE_FACES, PLAYER_COLORS, RING, SPACE_STATION, ZONES, missionAt, station } from './data';
import { Ctx, logEvent, makePlayers, missionUnlocked, useGameState, zoneComplete } from './store';
import { Board, Dice } from './components/Board';
import { CoachStation } from './components/Coach';
import { Dashboard } from './components/Dashboard';
import { HelpPanel } from './components/Help';
import { MissionPanel } from './components/MissionPanel';
import { BossPanel, ExchangeStation, Inventory, LearningStation, MissionList, ProblemStation, ToolsStation, TowerStation } from './components/Stations';
import { Modal } from './components/ui';

type Panel =
  | { type: 'mission'; id: string }
  | { type: 'station'; id: string }
  | { type: 'boss'; zone: number }
  | { type: 'missions' | 'inventory' | 'dashboard' }
  | null;

function Setup({ onStart }: { onStart: (players: { name: string; color: string; token: string }[], pin: string) => void }) {
  const [n, setN] = useState(2);
  const [names, setNames] = useState(PLAYER_COLORS.map((c) => `นักสร้าง${c.name}`));
  const [pin, setPin] = useState('');
  return (
    <div className="setup">
      <h1>BLOCK WORLD</h1>
      <p className="subtitle">อาณาจักรนักสร้างโลกแห่งคำ · กิจกรรมฝึกการแต่งประโยคเชิงสร้างสรรค์ ชั้น ป.3</p>
      <div className="setup-card">
        <h2>จำนวนผู้เล่น (ผลัดกันเล่นบนเครื่องเดียว)</h2>
        <div className="row">{[2, 3, 4].map((k) => <button key={k} className={`btn ${n === k ? 'primary' : ''}`} onClick={() => setN(k)}>{k} คน</button>)}</div>
        {PLAYER_COLORS.slice(0, n).map((c, i) => (
          <label key={i} className="setup-player" style={{ borderColor: c.color }}>
            <span className="setup-token" style={{ background: c.color }}>{c.token}</span>
            <input value={names[i]} maxLength={20} aria-label={`ชื่อผู้เล่น ${i + 1}`} onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))} />
          </label>
        ))}
        <label className="row">รหัสโหมดครู (ไม่บังคับ) <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="เว้นว่างได้" aria-label="รหัสโหมดครู" style={{ maxWidth: 140 }} /></label>
        <button className="btn primary big" onClick={() => onStart(PLAYER_COLORS.slice(0, n).map((c, i) => ({ name: names[i].trim() || `ผู้เล่น ${i + 1}`, color: c.color, token: c.token })), pin.trim())}>เริ่มสร้างโลก ▶</button>
        <p className="muted">ใช้ชื่อสมมติได้ · ข้อมูลเก็บในเครื่องนี้เท่านั้น · เกมนี้เป็นกิจกรรมฝึก ไม่ใช่แบบทดสอบ</p>
      </div>
    </div>
  );
}

export default function App() {
  const { game, update, saveError } = useGameState();
  const [teacher, setTeacherRaw] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState<number | null>(game.lastRoll);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const setTeacher = (v: boolean) => {
    if (v && game.teacherPin && prompt('รหัสโหมดครู') !== game.teacherPin) return alert('รหัสไม่ถูกต้อง');
    setTeacherRaw(v);
  };

  const openSpace = useCallback((zone: number, i: number) => {
    const sp = RING[i];
    if (sp.kind === 'mission') return setPanel({ type: 'mission', id: missionAt(zone, sp.area!).id });
    if (sp.kind === 'gate') return setPanel({ type: 'boss', zone });
    setPanel({ type: 'station', id: SPACE_STATION[sp.kind] });
  }, []);

  const roll = () => {
    if (game.phase !== 'roll' || rolling || game.zone > 3) return;
    const result = DIE_FACES[Math.floor(Math.random() * DIE_FACES.length)];
    const zone = game.zone;
    const start = game.players[game.current].pos;
    setRolling(true);
    let k = 0;
    const spin = window.setInterval(() => setFace(DIE_FACES[k++ % 6]), 80);
    timers.current.push(window.setTimeout(() => {
      clearInterval(spin);
      setFace(result);
      setRolling(false);
      update((g) => { g.phase = 'moving'; g.lastRoll = result; logEvent(g, `${g.players[g.current].name} ทอยได้ ${result}`); });
      for (let s = 1; s <= result; s++) {
        timers.current.push(window.setTimeout(() => {
          update((g) => { const p = g.players[g.current]; p.pos = (p.pos + 1) % RING.length; if (s === result) g.phase = 'landed'; });
          if (s === result) openSpace(zone, (start + result) % RING.length);
        }, s * 380));
      }
    }, 650));
  };

  const endTurn = () => update((g) => { if (g.phase === 'landed') { g.current = (g.current + 1) % g.players.length; g.phase = 'roll'; } });
  const close = () => { setPanel(null); endTurn(); };

  if (!game.started) {
    return <Setup onStart={(ps, pin) => update((g) => { g.players = makePlayers(ps); g.started = true; g.teacherPin = pin; logEvent(g, 'เริ่มการเดินทางในโซนการสร้างประโยค'); })} />;
  }

  const cur = game.players[game.current];
  const space = game.zone <= 3 ? RING[cur.pos] : null;

  return (
    <Ctx.Provider value={{ game, update, teacher, setTeacher }}>
      <div className="app">
        <header className="hud">
          <div className="brand"><b>BLOCK WORLD</b><small>อาณาจักรนักสร้างโลกแห่งคำ</small></div>
          <div className="zone-progress">
            {ZONES.map((z) => <span key={z.id} className={`zp ${z.id === game.zone ? 'on' : ''} ${game.bossDefeated[z.id] ? 'done' : ''}`}>{game.bossDefeated[z.id] ? '💎' : z.id} {z.name}</span>)}
          </div>
          <nav className="hud-btns">
            <button className="btn sm" onClick={() => setPanel({ type: 'missions' })}>🧩 ภารกิจ 12 ใบ</button>
            <button className="btn sm" onClick={() => setPanel({ type: 'inventory' })}>🎒 คลังของทีม</button>
            <button className="btn sm" onClick={() => setPanel({ type: 'station', id: 'help' })}>🛟 ขอความช่วยเหลือ</button>
            {teacher && <button className="btn sm" onClick={() => setPanel({ type: 'dashboard' })}>📊 แดชบอร์ดครู</button>}
            <label className={`teacher-toggle ${teacher ? 'on' : ''}`}><input type="checkbox" checked={teacher} onChange={(e) => setTeacher(e.target.checked)} /> โหมดครู</label>
          </nav>
        </header>
        {saveError && <div className="note warn">{saveError}</div>}

        <main className="main">
          <Board onSpace={(z, i) => (missionUnlocked(game, z) || teacher ? openSpace(z, i) : setPanel({ type: 'station', id: 'locked' }))}
            onTower={() => setPanel({ type: 'station', id: 'creative' })} />
          <aside className="side">
            {game.zone > 3 ? (
              <div className="turn-card finale"><h2>🎉 สร้างโลกแห่งคำสำเร็จ!</h2><p>ทีมได้คริสตัลครบ 3 เม็ด ไปดูผลงานและสะท้อนคิดที่หอคอยกันเถอะ</p>
                <button className="btn primary" onClick={() => setPanel({ type: 'station', id: 'creative' })}>🏰 ไปหอคอย</button></div>
            ) : (
              <div className="turn-card" style={{ borderColor: cur.color }}>
                <small>ตาของ</small>
                <h2 style={{ color: cur.color }} data-testid="current-player">{cur.token} {cur.name}</h2>
                <Dice value={face} rolling={rolling} disabled={game.phase !== 'roll' || rolling} onRoll={roll} />
                <p className="muted">{game.phase === 'roll' ? 'ทอยลูกเต๋าเพื่อเดิน (หน้าเต๋า 1,1,2,2,3,3)' : game.phase === 'moving' ? 'กำลังเดิน…' : `หยุดที่: ${space?.kind === 'gate' ? 'ประตูบอส' : space?.kind === 'mission' ? 'สถานการณ์ปัญหา' : station(SPACE_STATION[space!.kind]).name}`}</p>
                {game.phase === 'landed' && <div className="row"><button className="btn sm" onClick={() => openSpace(game.zone, cur.pos)}>เปิดช่องนี้อีกครั้ง</button><button className="btn sm primary" onClick={endTurn}>จบตา ➜</button></div>}
                {zoneComplete(game, game.zone) && <button className="btn warn" onClick={() => setPanel({ type: 'boss', zone: game.zone })}>{BOSSES[game.zone - 1].emoji} เผชิญหน้าบอสประจำโซน</button>}
              </div>
            )}
            <div className="players">
              {game.players.map((p, i) => (
                <div key={p.id} className={`pcard ${i === game.current ? 'on' : ''}`} style={{ borderColor: p.color }}>
                  <span className="setup-token" style={{ background: p.color }}>{p.token}</span><b>{p.name}</b>
                </div>
              ))}
            </div>
            <div className="legend">
              <h3>สถานีบนกระดาน (7 องค์ประกอบ)</h3>
              <ul>{['problem', 'learning', 'tools', 'exchange', 'creative', 'help', 'coach'].map((id) => {
                const s = station(id);
                return <li key={id}><button className="link" onClick={() => setPanel(id === 'problem' ? { type: 'station', id } : { type: 'station', id })}>{s.icon} {s.name}</button></li>;
              })}</ul>
            </div>
            <ul className="events">{game.events.slice(0, 6).map((e, i) => <li key={i}>{e.text}</li>)}</ul>
          </aside>
        </main>

        {panel?.type === 'mission' && <MissionPanel key={panel.id} missionId={panel.id} onClose={close} />}
        {panel?.type === 'boss' && <Modal icon="⚔️" title={`บอสประจำโซน ${panel.zone}: ${BOSSES[panel.zone - 1].name}`} onClose={close}><BossPanel zone={panel.zone} onDone={close} /></Modal>}
        {panel?.type === 'missions' && <Modal wide icon="🧩" title="การ์ดภารกิจ 12 ใบ (ตารางที่ 2)" onClose={close}><MissionList onOpen={(id) => setPanel({ type: 'mission', id })} /></Modal>}
        {panel?.type === 'inventory' && <Modal icon="🎒" title="คลังของทีม: คริสตัลและผลงาน" onClose={close}><Inventory /></Modal>}
        {panel?.type === 'dashboard' && <Modal wide icon="📊" title="แดชบอร์ดครู" onClose={close}><Dashboard /></Modal>}
        {panel?.type === 'station' && (
          panel.id === 'locked'
            ? <Modal icon="🔒" title="โซนนี้ยังไม่เปิด" onClose={close}><p>ทำภารกิจในโซนปัจจุบันให้ครบ 4 ด้าน แล้วชนะบอสเพื่อรับคริสตัล จึงจะเดินทางไปโซนถัดไปได้</p></Modal>
            : <Modal wide icon={station(panel.id).icon} title={station(panel.id).name} onClose={close}>
              {panel.id === 'problem' && <ProblemStation onOpen={(id) => setPanel({ type: 'mission', id })} />}
              {panel.id === 'learning' && <LearningStation />}
              {panel.id === 'tools' && <ToolsStation />}
              {panel.id === 'exchange' && <ExchangeStation />}
              {panel.id === 'creative' && <TowerStation />}
              {panel.id === 'help' && <HelpPanel />}
              {panel.id === 'coach' && <CoachStation onOpen={(id) => setPanel({ type: 'mission', id })} />}
            </Modal>
        )}
      </div>
    </Ctx.Provider>
  );
}
