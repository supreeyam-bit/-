import { useState } from 'react';
import { BOSSES, LESSONS, ZONE_STORY } from '../content';
import { COACH, MISSIONS, missionsOfZone, station, STORY_CUBES, TABLE2_FACES, type StationId } from '../data';
import type { GameState, Update } from '../store';
import ExchangePanel from './ExchangePanel';
import HelpBase from './HelpBase';
import { ScenarioCard } from './MissionView';
import SentenceBuilder from './SentenceBuilder';

export default function StationView({ id, state, update, onMission, onTower }: {
  id: StationId; state: GameState; update: Update; onMission: (id: string) => void; onTower: () => void;
}) {
  const st = station(id);
  return (
    <div className="station" data-testid={`station-${id}`}>
      <p className="muted">{st.role}</p>
      {id === 'problem' && <Problem state={state} />}
      {id === 'learning' && <Learning zone={state.zone} />}
      {id === 'tools' && <Tools />}
      {id === 'exchange' && (
        <div>
          {missionsOfZone(state.zone).map((m) => (
            <details key={m.id} className="card">
              <summary><b>{m.area}</b> · {m.scenario}</summary>
              <ExchangePanel state={state} update={update} missionId={m.id} />
              <button className="btn small" onClick={() => onMission(m.id)}>ไปที่ภารกิจ</button>
            </details>
          ))}
        </div>
      )}
      {id === 'help' && <HelpBase state={state} update={update} />}
      {id === 'coach' && <CoachLadder />}
      {id === 'creative' && <button className="btn primary" onClick={onTower}>เข้าหอคอย {st.name}</button>}
    </div>
  );
}

function Problem({ state }: { state: GameState }) {
  const boss = BOSSES[state.zone - 1];
  const first = MISSIONS.filter((m) => m.zone === 1);
  return (
    <div>
      <div className="callout story">
        <p>{ZONE_STORY[state.zone - 1]}</p>
        <p>{boss.icon} บอสประจำโซน: <b>{boss.name}</b> — ผ่านภารกิจครบ 4 ด้านในโซนนี้เพื่อเผชิญหน้าบอส</p>
      </div>
      <h4>สถานการณ์ทั้ง 4 เรื่อง (ใช้ต่อเนื่องครบสามโซน)</h4>
      <div className="grid2">{first.map((m) => <div key={m.id} className="card"><b>{m.area}</b><ScenarioCard mission={m} /></div>)}</div>
    </div>
  );
}

function Learning({ zone }: { zone: number }) {
  const [z, setZ] = useState(zone);
  const [pick, setPick] = useState<number | null>(null);
  const l = LESSONS[z - 1];
  return (
    <div>
      <div className="tabs">
        {LESSONS.map((x) => <button key={x.zone} className={x.zone === z ? 'on' : ''} onClick={() => { setZ(x.zone); setPick(null); }}>โซน {x.zone} {x.title}</button>)}
      </div>
      <h4>{l.title}</h4>
      <ul>{l.points.map((p) => <li key={p}>{p}</li>)}</ul>
      <div className="ar-preview" aria-label="ตัวอย่างการแสดงผล AR">
        <span className="ar-tag">ตัวอย่างการแสดงผล AR (ภาพจำลอง ยังไม่ใช่ WebAR ที่ใช้กล้องจริง)</span>
        <div className="ar-stage">
          {l.ar.map((w, i) => <span key={w + i} className="ar-block" style={{ animationDelay: `${i * 0.5}s`, ['--i' as string]: i }}>{w}</span>)}
        </div>
      </div>
      <div className="card">
        <p><b>ฝึกสั้น ๆ:</b> {l.practice.q}</p>
        <div className="chips">
          {l.practice.choices.map((c, i) => (
            <button key={c} className={`chip ${pick === i ? (i === l.practice.answer ? 'done' : 'broken') : ''}`} onClick={() => setPick(i)}>{c}</button>
          ))}
        </div>
        {pick !== null && <p>{pick === l.practice.answer ? '✓ ใช่แล้ว' : 'ลองอ่านหลักอีกครั้ง แล้วเลือกใหม่'}</p>}
      </div>
    </div>
  );
}

function Tools() {
  const [tab, setTab] = useState<'builder' | 'organizer' | 'cubes'>('builder');
  const [org, setOrg] = useState<Record<string, string>>({});
  const [table2, setTable2] = useState(true);
  const [faces, setFaces] = useState<Record<string, number>>({});
  const roll = () => {
    const f: Record<string, number> = {};
    for (const c of STORY_CUBES) f[c.id] = table2 && c.id in TABLE2_FACES ? TABLE2_FACES[c.id] : Math.floor(Math.random() * 6);
    setFaces(f);
  };
  const slots = ['ใคร', 'ทำอะไร', 'กับอะไร', 'ลักษณะ', 'ที่ไหน', 'เมื่อไร', 'อย่างไร'];
  return (
    <div>
      <div className="tabs">
        <button className={tab === 'builder' ? 'on' : ''} onClick={() => setTab('builder')}>แท่นเรียงบล็อกคำ</button>
        <button className={tab === 'organizer' ? 'on' : ''} onClick={() => setTab('organizer')}>ผังประโยค</button>
        <button className={tab === 'cubes' ? 'on' : ''} onClick={() => setTab('cubes')}>ลูกเต๋าเรื่องเล่า</button>
      </div>
      {tab === 'builder' && <SentenceBuilder config={{ checklist: ['มีภาคประธาน', 'มีภาคแสดง', 'สื่อความหมายได้ถูกต้องสมบูรณ์'] }} />}
      {tab === 'organizer' && (
        <div>
          <div className="organizer">
            {slots.map((s) => (
              <label key={s} className="field"><span>{s}?</span><input className="input" value={org[s] ?? ''} onChange={(e) => setOrg({ ...org, [s]: e.target.value })} /></label>
            ))}
          </div>
          <p className="callout">ลองต่อเป็นประโยค: <b>{slots.map((s) => org[s]).filter(Boolean).join(' ') || '…'}</b></p>
        </div>
      )}
      {tab === 'cubes' && (
        <div>
          <label className="check"><input type="checkbox" checked={table2} onChange={(e) => setTable2(e.target.checked)} /> ตั้งหน้า ลม · ว่าว · ทุ่งนา ไว้ตามตารางที่ 2</label>
          <button className="btn primary" onClick={roll}>🎲 ทอยลูกเต๋าเรื่องเล่า</button>
          <div className="cubes">
            {STORY_CUBES.map((c) => {
              const f = faces[c.id];
              return (
                <div key={c.id} className={`cube r-${c.role}`}>
                  <span className="big">{f === undefined ? '❔' : c.faces[f][0]}</span>
                  <small>{f === undefined ? c.name : c.faces[f][1]}</small>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CoachLadder() {
  return (
    <div>
      <p>คำถามโค้ชแบ่ง 2 ขั้น: ขั้นแรกถามให้คิดเอง ขั้นที่สองชี้แนะมากขึ้น โดยไม่บอกคำตอบ ครูรับรองคำตอบได้ในแผงครูของแต่ละภารกิจ</p>
      {COACH.map((c) => (
        <details key={c.situation} className="card">
          <summary>{c.situation}</summary>
          <div className="ladder">
            <div><b>ขั้น 1</b><ul>{c.step1.map((q) => <li key={q}>{q}</li>)}</ul></div>
            <div><b>ขั้น 2</b><ul>{c.step2.map((q) => <li key={q}>{q}</li>)}</ul></div>
          </div>
        </details>
      ))}
    </div>
  );
}
