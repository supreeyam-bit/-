import { useState } from 'react';
import { areaOf, missionsOfZone, station, TRACK, ZONES, type StationId } from '../data';
import { BOSSES } from '../content';
import { missionPassed, zoneCleared, type GameState } from '../store';

const CENTERS = [
  { x: 250, y: 500 },
  { x: 500, y: 200 },
  { x: 750, y: 500 },
];
const RX = 175;
const RY = 135;
const TOWER = { x: 500, y: 520 };
const GATES = [
  { x: 335, y: 285 },
  { x: 665, y: 285 },
  { x: 500, y: 700 },
];
const ZONE_TINT = ['#fde3d6', '#dbe8fb', '#daf2e3'];

export const nodePos = (zone: number, i: number) => {
  const a = -Math.PI / 2 + (i / TRACK.length) * Math.PI * 2;
  const c = CENTERS[zone - 1];
  return { x: c.x + RX * Math.cos(a), y: c.y + RY * Math.sin(a) };
};

interface Props {
  state: GameState;
  onStation: (id: StationId) => void;
  onMission: (missionId: string) => void;
  onBoss: (zone: number) => void;
}

// แผนที่สามโซน: แต่ละโซนเป็นเส้นทางวน 10 ช่อง หอคอยกลางคือศูนย์ส่งเสริมการคิดสร้างสรรค์
export default function BoardMap({ state, onStation, onMission, onBoss }: Props) {
  const [whole, setWhole] = useState(false);
  const c = CENTERS[state.zone - 1];
  const viewBox = whole ? '0 0 1000 780' : `${c.x - 270} ${c.y - 215} 540 430`;
  const creative = station('creative');

  return (
    <div className="board-wrap">
      <div className="row gap board-tools">
        <button className="btn small" onClick={() => setWhole(!whole)} data-testid="toggle-map">{whole ? '🔍 ซูมโซนปัจจุบัน' : '🗺️ ดูแผนที่ทั้งหมด'}</button>
      </div>
      <svg className="board" viewBox={viewBox} role="img" aria-label="แผนที่ BLOCK WORLD สามโซน">
        <defs>
          <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity=".25" /></filter>
        </defs>
        {/* เส้นทางเชื่อมโซน */}
        <path d={`M${CENTERS[0].x + 60} ${CENTERS[0].y - RY} Q ${GATES[0].x} ${GATES[0].y} ${CENTERS[1].x - RX} ${CENTERS[1].y + 30}`} className="link" />
        <path d={`M${CENTERS[1].x + RX} ${CENTERS[1].y + 30} Q ${GATES[1].x} ${GATES[1].y} ${CENTERS[2].x - 60} ${CENTERS[2].y - RY}`} className="link" />
        <path d={`M${CENTERS[2].x - 40} ${CENTERS[2].y + RY} Q ${GATES[2].x} ${GATES[2].y + 40} ${TOWER.x} ${TOWER.y + 70}`} className="link" />

        {ZONES.map((z) => {
          const zc = CENTERS[z.zone - 1];
          const open = z.zone <= state.zone;
          return (
            <g key={z.zone} className={`zone ${open ? '' : 'locked'} ${z.zone === state.zone ? 'current' : ''}`}>
              <ellipse cx={zc.x} cy={zc.y} rx={RX + 62} ry={RY + 58} fill={ZONE_TINT[z.zone - 1]} stroke="#2b2350" strokeOpacity=".15" strokeWidth="3" />
              <ellipse cx={zc.x} cy={zc.y} rx={RX} ry={RY} fill="none" stroke="#8a7f9c" strokeWidth="10" strokeDasharray="2 16" strokeLinecap="round" />
              <text x={zc.x} y={zc.y - 8} textAnchor="middle" className="zone-title">โซน {z.zone}</text>
              <text x={zc.x} y={zc.y + 22} textAnchor="middle" className="zone-name">{z.name}</text>
              {!open && <text x={zc.x} y={zc.y + 62} textAnchor="middle" fontSize="34">🔒</text>}
              {TRACK.map((sp, i) => {
                const p = nodePos(z.zone, i);
                if (sp.kind === 'station') {
                  const st = station(sp.station);
                  return (
                    <g key={i} className="node" transform={`translate(${p.x} ${p.y})`} onClick={() => open && onStation(sp.station)} role="button" aria-label={st.name} data-testid={`node-z${z.zone}-${i}`}>
                      <circle r="30" fill="#fffaf0" stroke="#2b2350" strokeWidth="3" filter="url(#sh)" />
                      <text y="10" textAnchor="middle" fontSize="28">{st.icon}</text>
                      <text y="48" textAnchor="middle" className="node-label">{st.name}</text>
                    </g>
                  );
                }
                const m = missionsOfZone(z.zone).find((x) => x.area_id === sp.area)!;
                const ar = areaOf(sp.area);
                const done = missionPassed(state, m.id);
                return (
                  <g key={i} className="node mission-node" transform={`translate(${p.x} ${p.y})`} onClick={() => onMission(m.id)} role="button" aria-label={`ภารกิจ ${m.area}`} data-testid={`node-z${z.zone}-${i}`}>
                    <circle r="32" fill={ar.color} stroke="#2b2350" strokeWidth="3" filter="url(#sh)" />
                    <text y="11" textAnchor="middle" fontSize="30" fill="#fff">{done ? '✓' : ar.shape}</text>
                    <text y="50" textAnchor="middle" className="node-label">{m.area}</text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* ประตูบอส */}
        {BOSSES.map((b, i) => {
          const g = GATES[i];
          const ready = b.zone === state.zone && zoneCleared(state, b.zone) && !state.bossDefeated[i];
          const beaten = state.bossDefeated[i];
          return (
            <g key={b.zone} className={`node gate ${ready ? 'ready' : ''}`} transform={`translate(${g.x} ${g.y})`} onClick={() => onBoss(b.zone)} role="button" aria-label={`บอส ${b.name}`} data-testid={`boss-${b.zone}`}>
              <rect x="-34" y="-34" width="68" height="68" rx="14" fill={beaten ? b.crystalColor : ready ? '#2b2350' : '#cfc7da'} stroke="#2b2350" strokeWidth="3" filter="url(#sh)" />
              <text y="12" textAnchor="middle" fontSize="32">{beaten ? '💎' : b.icon}</text>
              <text y="54" textAnchor="middle" className="node-label">{beaten ? b.crystal : b.name}</text>
            </g>
          );
        })}

        {/* หอคอยกลาง */}
        <g className="node tower" transform={`translate(${TOWER.x} ${TOWER.y})`} onClick={() => onStation('creative')} role="button" aria-label={creative.name} data-testid="tower">
          <path d="M-46 60 L-36 -30 L-48 -30 L-48 -56 L-30 -56 L-30 -44 L-12 -44 L-12 -56 L12 -56 L12 -44 L30 -44 L30 -56 L48 -56 L48 -30 L36 -30 L46 60 Z" fill="#f4e1b0" stroke="#2b2350" strokeWidth="3" filter="url(#sh)" />
          {[0, 1, 2].map((k) => <circle key={k} cx={-24 + k * 24} cy={-8} r="9" fill={state.bossDefeated[k] ? BOSSES[k].crystalColor : '#fff'} stroke="#2b2350" strokeWidth="2" />)}
          <text y="34" textAnchor="middle" fontSize="26">🏰</text>
          <text y="80" textAnchor="middle" className="node-label strong">{creative.name}</text>
        </g>

        {/* ตัวเดิน */}
        {state.players.map((p, k) => {
          const base = nodePos(state.zone, p.pos);
          const off = [[-16, -26], [16, -26], [-16, 26], [16, 26]][k];
          return (
            <g key={p.id} className="token" style={{ transform: `translate(${base.x + off[0]}px, ${base.y + off[1]}px)` }} data-testid={`token-${k}`} data-pos={p.pos}>
              <circle r="15" fill={p.color} stroke="#fff" strokeWidth="3" filter="url(#sh)" />
              <text y="6" textAnchor="middle" fontSize="15" fill="#fff" fontWeight="700">{k + 1}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
