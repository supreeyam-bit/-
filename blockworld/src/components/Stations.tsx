import { useState } from 'react';
import { AREAS, BOSSES, LESSONS, MISSIONS, SITUATIONS, TOWER, ZONES, areaInfo, missionAt, station } from '../data';
import { logEvent, missionUnlocked, playerStars, readWork, useGame, zoneComplete, zoneMissions } from '../store';
import { DrawingPad } from './DrawingPad';
import { ExchangePanel } from './Exchange';
import { SentenceBuilder } from './SentenceBuilder';
import { OptionalImage, SituationArt, StatusBadge } from './ui';

export function ProblemStation({ onOpen }: { onOpen: (id: string) => void }) {
  const { game } = useGame();
  return (
    <div>
      <p>ภาพสถานการณ์ 4 เรื่องเป็นสื่อฝึกเดิมตลอดทั้งสามโซน แต่ละเรื่องคือด้านหนึ่งของการคิดสร้างสรรค์</p>
      <div className="sit-grid">
        {SITUATIONS.map((s) => {
          const m = missionAt(Math.min(game.zone, 3), s.area_en as never);
          return (
            <div key={s.area_en} className="sit-card">
              <SituationArt area={s.area_en as never} title={s.title} small />
              <b>{s.area}</b><small>{s.description}</small>
              <button className="btn sm" onClick={() => onOpen(m.id)}>เปิดการ์ดภารกิจโซน {m.zone}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LearningStation() {
  const { game } = useGame();
  const [zone, setZone] = useState(Math.min(game.zone, 3));
  const [shown, setShown] = useState<string | null>(null);
  return (
    <div>
      <div className="tabs">{ZONES.map((z) => <button key={z.id} className={`tab ${zone === z.id ? 'on' : ''}`} onClick={() => setZone(z.id)}>โซน {z.id} {z.name}</button>)}</div>
      <div className="lessons">
        {LESSONS[zone].map((l) => (
          <div key={l.title} className="lesson">
            <h4>{l.title}</h4><p>{l.body}</p>
            {l.parts && (
              <div className="parts">{l.parts.map(([w, role], i) => (
                <button key={i} className={`part p${i}`} onClick={() => setShown(`${l.title}${i}`)}>
                  {w}{shown === `${l.title}${i}` && <small>{role}</small>}
                </button>
              ))}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const DIAGRAM = [['ใคร/อะไร', 'ภาคประธาน', 'b-subject'], ['ทำอะไร', 'กริยา', 'b-verb'], ['กับอะไร', 'กรรม', 'b-object'], ['อย่างไร เมื่อไร ที่ไหน', 'คำขยาย', 'b-mod']];

export function ToolsStation() {
  const [tool, setTool] = useState<'builder' | 'draw' | 'diagram'>('builder');
  const [made, setMade] = useState<string[]>([]);
  return (
    <div>
      <p className="note">เครื่องมือสำหรับฝึกคิดอิสระ ผลที่ทำตรงนี้ไม่ถูกบันทึกเป็นชิ้นงาน (ชิ้นงานจริงทำในการ์ดภารกิจ)</p>
      <div className="tabs">
        <button className={`tab ${tool === 'builder' ? 'on' : ''}`} onClick={() => setTool('builder')}>🧱 เรียงบล็อกคำ</button>
        <button className={`tab ${tool === 'diagram' ? 'on' : ''}`} onClick={() => setTool('diagram')}>🗺️ ผังส่วนประกอบประโยค</button>
        <button className={`tab ${tool === 'draw' ? 'on' : ''}`} onClick={() => setTool('draw')}>🎨 กระดานวาดภาพ</button>
      </div>
      {tool === 'builder' && (
        <>
          <SentenceBuilder saveLabel="ลองอ่านประโยค" onSave={(_, t) => setMade([t, ...made])} />
          {made.length > 0 && <ul className="carry-list">{made.map((m, i) => <li key={i}>{m}</li>)}</ul>}
        </>
      )}
      {tool === 'diagram' && (
        <div className="diagram">
          {DIAGRAM.map(([q, n, cls]) => <div key={n} className={`dg ${cls}`}><b>{n}</b><small>{q}</small></div>)}
          <p>ตัวอย่าง: <span className="block b-subject">นักเรียน</span><span className="block b-mod">ชั้น ป.3</span><span className="block b-verb">กวาด</span><span className="block b-object">ห้องเรียน</span><span className="block b-mod">หลังเลิกเรียน</span></p>
          <h4>เกณฑ์ตรวจประโยค</h4>
          <ol><li>มีภาคประธาน (ใคร/อะไร)</li><li>มีภาคแสดง (ทำอะไร/เป็นอย่างไร)</li><li>เรียงคำถูกลำดับ คำขยายอยู่ติดคำที่ขยาย</li><li>ชนิดประโยคตรงกับที่ต้องการ</li><li>ถ้อยคำเหมาะกับผู้ฟัง</li><li>อ่านแล้วสื่อความหมายได้ถูกต้องสมบูรณ์</li></ol>
        </div>
      )}
      {tool === 'draw' && <DrawingPad onSave={() => undefined} />}
    </div>
  );
}

export function ExchangeStation() {
  const { game } = useGame();
  const options = MISSIONS.filter((m) => missionUnlocked(game, m.zone));
  const [mid, setMid] = useState(zoneMissions(Math.min(game.zone, 3))[0].id);
  return (
    <div>
      <div className="row"><span>ภารกิจ</span>
        <select value={mid} onChange={(e) => setMid(e.target.value)} aria-label="เลือกภารกิจ">
          {options.map((m) => <option key={m.id} value={m.id}>โซน {m.zone} {m.zone_name} · {m.area}</option>)}
        </select>
      </div>
      <ExchangePanel key={mid} missionId={mid} />
    </div>
  );
}

/** หอคอยกลาง: รวบรวมผลงานที่ครูรับรองจากทั้งสามโซน ครบสี่ด้าน และพื้นที่สะท้อนคิด */
export function TowerStation() {
  const { game, update } = useGame();
  const [pid, setPid] = useState(game.players[0]?.id);
  const [ar, setAr] = useState(false);
  const pname = (id: string) => game.players.find((p) => p.id === id);
  return (
    <div className="tower-panel">
      <OptionalImage src="assets/components/tower.png" alt="หอคอย" className="tower-img" />
      <p>{station('creative').role}</p>
      <div className="crystals">{BOSSES.map((b) => (
        <span key={b.zone} className={`crystal ${game.bossDefeated[b.zone] ? 'on' : ''}`} style={{ ['--cc' as string]: b.crystalColor }}>💎 {b.crystal}</span>
      ))}</div>

      <table className="gallery">
        <thead><tr><th>ด้าน</th>{ZONES.map((z) => <th key={z.id}>โซน {z.id} {z.name}</th>)}</tr></thead>
        <tbody>{TOWER.areas.map((a) => (
          <tr key={a.area_en}>
            <th style={{ color: areaInfo(a.area_en as never).color }}>{areaInfo(a.area_en as never).shape} {a.area}</th>
            {ZONES.map((z) => {
              const m = missionAt(z.id, a.area_en as never);
              return (
                <td key={z.id}>
                  <small className="muted">ตัวชี้วัด {(a.zones as Record<string, string>)[String(z.id)]}</small>
                  {game.players.map((p) => {
                    const w = readWork(game, m.id, p.id);
                    if (w.status !== 'approved') return null;
                    const texts = Object.values(w.items).flat().map((e) => e.text).filter(Boolean).slice(0, 2);
                    const img = Object.values(w.drawings)[0];
                    return <div key={p.id} className="g-item" style={{ borderColor: p.color }}><b>{p.token}</b> {texts.join(' · ')}{img && <img src={img} alt="ภาพ" />}</div>;
                  })}
                </td>
              );
            })}
          </tr>
        ))}</tbody>
      </table>

      <h3>🪞 สะท้อนคิด</h3>
      <p className="muted">คำถามปลายเปิดเพื่อทบทวนการเรียนรู้ ไม่มีการให้คะแนน</p>
      <div className="player-tabs">{game.players.map((p) => <button key={p.id} className={`ptab ${p.id === pid ? 'on' : ''}`} style={{ ['--pc' as string]: p.color }} onClick={() => setPid(p.id)}>{p.token} {p.name}</button>)}</div>
      <div className="reflect-grid">
        {TOWER.areas.map((a) => (
          <label key={a.area_en} className="reflect">
            <b>{a.area}</b>
            {a.reflection_prompts.map((q) => <small key={q}>• {q}</small>)}
            <textarea rows={3} value={game.reflections[pid]?.[a.area_en] ?? ''} aria-label={`สะท้อนคิด ${a.area}`}
              onChange={(e) => update((g) => { (g.reflections[pid] ??= {})[a.area_en] = e.target.value; })} placeholder={`${pname(pid)?.name ?? ''} คิดว่า…`} />
          </label>
        ))}
      </div>

      <h3>ตัวอย่างการแสดงผล AR</h3>
      <p className="muted">ภาพเคลื่อนไหวจำลองเพื่อแสดงแนวคิดเท่านั้น ยังไม่ใช่ WebAR ที่ทำงานกับกล้องจริง</p>
      <button className="btn" onClick={() => setAr(!ar)}>{ar ? 'ปิด' : 'เปิด'}ตัวอย่างการแสดงผล AR</button>
      {ar && (
        <div className="ar-sim" aria-label="ตัวอย่างการแสดงผล AR (จำลอง)">
          <span className="ar-tag">ตัวอย่างการแสดงผล AR · จำลอง</span>
          <div className="ar-stage">
            {BOSSES.map((b, i) => <div key={b.zone} className={`ar-crystal ${game.bossDefeated[b.zone] ? 'on' : ''}`} style={{ ['--cc' as string]: b.crystalColor, animationDelay: `${i * 0.4}s` }}>💎</div>)}
            <div className="ar-tower">🏰</div>
          </div>
        </div>
      )}
    </div>
  );
}

/** บอสประจำโซน: กลไกเรื่องราว ใช้ผลงานที่ครูรับรองแล้ว ไม่มีการสอบเพิ่ม */
export function BossPanel({ zone, onDone }: { zone: number; onDone: () => void }) {
  const { game, update } = useGame();
  const boss = BOSSES[zone - 1];
  const ready = zoneComplete(game, zone);
  const chosen = game.bossPower[zone] ?? {};
  const allChosen = game.players.every((p) => chosen[p.id]);
  const [won, setWon] = useState(!!game.bossDefeated[zone]);

  if (!ready) {
    const left = zoneMissions(zone).filter((m) => !game.completed[m.id]);
    return (
      <div className="boss">
        <div className="boss-emoji">{boss.emoji}</div>
        <p>{boss.name} ยังไม่ออกมา ทำภารกิจในโซนนี้ให้ครบทั้ง 4 ด้านก่อน</p>
        <ul>{left.map((m) => <li key={m.id}>{areaInfo(m.area_en).shape} {m.area} — ยังไม่สำเร็จ</li>)}</ul>
      </div>
    );
  }

  const attack = () => {
    update((g) => {
      g.bossDefeated[zone] = true;
      logEvent(g, `ทีมชนะ${boss.name} ได้รับ${boss.crystal}`);
      if (g.zone === zone) {
        g.zone = zone + 1;
        g.players.forEach((p) => { p.pos = 0; });
        g.phase = 'roll';
      }
    });
    setWon(true);
  };

  return (
    <div className={`boss ${won ? 'won' : ''}`}>
      <OptionalImage src={`assets/components/boss-${zone}.png`} alt={boss.name} className="boss-img" />
      <div className="boss-emoji">{won ? '💎' : boss.emoji}</div>
      <p className="boss-story">{boss.story}</p>
      {won ? (
        <>
          <h3 style={{ color: boss.crystalColor }}>ได้รับ {boss.crystal}!</h3>
          <p>{zone < 3 ? `ทีมเดินทางสู่โซน ${zone + 1} ${ZONES[zone].name}` : 'ทีมได้คริสตัลครบสามเม็ด นำไปวางที่หอคอยศูนย์ส่งเสริมการคิดสร้างสรรค์'}</p>
          <button className="btn primary" onClick={onDone}>ไปต่อ</button>
        </>
      ) : (
        <>
          <p><b>รวมพลังคำ:</b> แต่ละคนเลือกผลงานที่ครูรับรองแล้วในโซนนี้ 1 ชิ้น แล้วอ่านออกเสียงให้ทีมฟัง</p>
          {game.players.map((p) => {
            const options = zoneMissions(zone).flatMap((m) => Object.values(readWork(game, m.id, p.id).items).flat()).map((e) => e.text).filter(Boolean);
            return (
              <div key={p.id} className="row boss-pick">
                <b style={{ color: p.color }}>{p.token} {p.name}</b>
                <select value={chosen[p.id] ?? ''} aria-label={`ผลงานของ ${p.name}`} onChange={(e) => update((g) => { (g.bossPower[zone] ??= {})[p.id] = e.target.value; })}>
                  <option value="">— เลือกผลงานที่จะอ่าน —</option>
                  {options.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
                {chosen[p.id] && '🔊'}
              </div>
            );
          })}
          <button className="btn primary big" disabled={!allChosen} onClick={attack}>⚡ ปล่อยพลังคำ!</button>
        </>
      )}
    </div>
  );
}

export function MissionList({ onOpen }: { onOpen: (id: string) => void }) {
  const { game, teacher } = useGame();
  return (
    <div className="mlist">
      {ZONES.map((z) => (
        <div key={z.id} className={`mlist-zone ${z.id > game.zone ? 'locked' : ''}`}>
          <h3>โซน {z.id} {z.name} {game.bossDefeated[z.id] && '💎'} {z.id > game.zone && !teacher && '🔒'}</h3>
          <div className="mlist-grid">
            {AREAS.map((a) => {
              const m = missionAt(z.id, a.en);
              return (
                <button key={m.id} className={`mcard ${game.completed[m.id] ? 'done' : ''}`} style={{ borderColor: a.color }} onClick={() => onOpen(m.id)} data-testid={`mcard-${m.id}`}>
                  <span className="mcard-shape" style={{ color: a.color }}>{a.shape}</span>
                  <b>{a.th}</b><small>{m.situation} · {m.indicator}{m.timed_minutes ? ' · ⏱ 5 นาที' : ''}</small>
                  <span className="mcard-status">{game.players.map((p) => <StatusBadge key={p.id} status={readWork(game, m.id, p.id).status} />)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Inventory() {
  const { game } = useGame();
  return (
    <div>
      <div className="crystals">{BOSSES.map((b) => <span key={b.zone} className={`crystal ${game.bossDefeated[b.zone] ? 'on' : ''}`} style={{ ['--cc' as string]: b.crystalColor }}>💎 {b.crystal}</span>)}</div>
      <table className="table">
        <thead><tr><th>ผู้เล่น</th><th>⭐ ผลงานที่ครูรับรอง</th><th>💡 ไอเดียที่เสนอ</th><th>🛟 ใช้ความช่วยเหลือ</th></tr></thead>
        <tbody>{game.players.map((p) => (
          <tr key={p.id}><td><b style={{ color: p.color }}>{p.token} {p.name}</b></td><td>{playerStars(game, p.id)} / 12</td>
            <td>{Object.values(game.exchange).flat().filter((m) => m.playerId === p.id && m.kind === 'idea').length}</td>
            <td>{game.helpLog.filter((h) => h.playerId === p.id).length} ครั้ง (ไม่หักคะแนน)</td></tr>
        ))}</tbody>
      </table>
      <h3>บันทึกการเดินทาง</h3>
      <ul className="events">{game.events.slice(0, 30).map((e, i) => <li key={i}>{e.text}</li>)}</ul>
      <p className="muted">ภารกิจ: {MISSIONS.filter((m) => game.completed[m.id]).length} / 12 สำเร็จ · ข้อมูลเก็บในเครื่องนี้</p>
    </div>
  );
}
