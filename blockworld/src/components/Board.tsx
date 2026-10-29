import { useState } from 'react';
import { BOSSES, RING, SPACE_STATION, ZONES, areaInfo, missionAt, station } from '../data';
import { useGame, zoneComplete } from '../store';

export const ZONE_CENTERS: [number, number][] = [[235, 640], [550, 235], [865, 640]];
export const TOWER_POS: [number, number] = [550, 640];
const R = 140;
const VB = [1100, 880];

// ชื่อสถานีเต็มตาม stations.json แบ่งเป็น 2 บรรทัดบนกระดาน
const LINES: Record<string, string[]> = {
   'ศูนย์การเรียนรู้': ['ศูนย์', 'การเรียนรู้'],
  'เครื่องมือทางปัญญา': ['เครื่องมือ', 'ทางปัญญา'],
  'ศูนย์แลกเปลี่ยนเรียนรู้': ['ศูนย์แลกเปลี่ยน', 'เรียนรู้'],
  'ศูนย์ส่งเสริมการคิดสร้างสรรค์': ['ศูนย์ส่งเสริม', 'การคิดสร้างสรรค์'],
  'ฐานการช่วยเหลือ': ['ฐาน', 'การช่วยเหลือ'],
  'ประตูบอส': ['ประตูบอส'],
};

export function spacePos(zone: number, i: number, r = R): [number, number] {
  const [cx, cy] = ZONE_CENTERS[zone - 1];
  const a = (-90 + i * 30) * (Math.PI / 180);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function SvgOptionalImage({ href, x, y, w, h }: { href: string; x: number; y: number; w: number; h: number }) {
  const [ok, setOk] = useState(true);
  return ok ? <image href={href} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" onError={() => setOk(false)} opacity={0.9} /> : null;
}

const ZONE_TINT = ['#fde2e4', '#dbeafe', '#fef3c7'];
const ZONE_EDGE = ['#e05a8a', '#3b82f6', '#f59e0b'];

export function Board({ onSpace, onTower }: { onSpace: (zone: number, i: number) => void; onTower: () => void }) {
  const { game } = useGame();
  const current = game.players[game.current];

  return (
    <svg className="board" viewBox={`0 0 ${VB[0]} ${VB[1]}`} role="img" aria-label="แผนที่สามโซนของ BLOCK WORLD">
      <defs>
        <radialGradient id="sea" cx="50%" cy="50%" r="70%"><stop offset="0" stopColor="#e7f6ef" /><stop offset="1" stopColor="#bfe3d3" /></radialGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.25" /></filter>
      </defs>
      <rect x="0" y="0" width={VB[0]} height={VB[1]} rx="28" fill="url(#sea)" />
      <SvgOptionalImage href="assets/board/board.png" x={0} y={0} w={VB[0]} h={VB[1]} />

      {/* เส้นทางเชื่อมโซน */}
      <path d={`M${spacePos(1, 0).join(' ')} Q 250 110 ${spacePos(2, 0).join(' ')}`} className="road" />
      <path d={`M${spacePos(2, 0).join(' ')} Q 850 110 ${spacePos(3, 0).join(' ')}`} className="road" />
      {[1, 2, 3].map((z) => <line key={z} x1={spacePos(z, 9)[0]} y1={spacePos(z, 9)[1]} x2={TOWER_POS[0]} y2={TOWER_POS[1]} className="bridge" />)}

      {ZONES.map((zone) => {
        const z = zone.id;
        const [cx, cy] = ZONE_CENTERS[z - 1];
        const locked = z > game.zone;
        const active = z === game.zone;
        const boss = BOSSES[z - 1];
        return (
          <g key={z} className={`zone ${locked ? 'locked' : ''} ${active ? 'active' : ''}`} data-testid={`zone-${z}`}>
            <circle cx={cx} cy={cy} r={R + 78} fill={ZONE_TINT[z - 1]} stroke={ZONE_EDGE[z - 1]} strokeWidth={active ? 6 : 3} />
            <SvgOptionalImage href={`assets/board/zone-${z}.png`} x={cx - R - 78} y={cy - R - 78} w={2 * R + 156} h={2 * R + 156} />
            <circle cx={cx} cy={cy} r={R} className="ring" />
            <text x={cx} y={cy - 26} className="zone-num">โซน {z}</text>
            <text x={cx} y={cy + 2} className="zone-name">{zone.name}</text>
            <text x={cx} y={cy + 44} className="zone-boss">{game.bossDefeated[z] ? '💎' : boss.emoji}</text>
            <text x={cx} y={cy + 66} className="zone-sub">{game.bossDefeated[z] ? boss.crystal : zoneComplete(game, z) ? 'บอสรออยู่ที่ประตู!' : `บอส: ${boss.name}`}</text>
            {RING.map((sp, i) => {
              const [x, y] = spacePos(z, i);
              const isMission = sp.kind === 'mission';
              const m = isMission ? missionAt(z, sp.area!) : null;
              const done = m && game.completed[m.id];
              const st = sp.kind === 'gate' ? null : station(SPACE_STATION[sp.kind]);
              const label = sp.kind === 'gate' ? 'ประตูบอส' : isMission ? areaInfo(sp.area!).th : st!.name;
              const lines = LINES[label] ?? (isMission ? ['การคิด', label.replace('การคิด', '')] : [label]);
              const [lx, ly] = spacePos(z, i, R + 50);
              return (
                <g key={i} className={`space s-${sp.kind} ${done ? 'done' : ''}`} transform={`translate(${x} ${y})`} role="button" tabIndex={locked ? -1 : 0}
                  aria-label={`${label}${isMission ? ' (สถานการณ์ปัญหา)' : ''}`} data-testid={`space-${z}-${i}`}
                  onClick={() => onSpace(z, i)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSpace(z, i)}>
                  <circle r={27} filter="url(#shadow)" fill={isMission ? areaInfo(sp.area!).color : sp.kind === 'gate' ? '#3f3d56' : '#fff'} />
                  <text className="space-icon" y={7}>{sp.kind === 'gate' ? '⛩️' : isMission ? (done ? '✓' : areaInfo(sp.area!).shape) : st!.icon}</text>
                  <text className="space-label" x={lx - x} y={ly - y - (lines.length - 1) * 6 + 4}>
                    {lines.map((t, k) => <tspan key={k} x={lx - x} dy={k ? 13 : 0}>{t}</tspan>)}
                  </text>
                </g>
              );
            })}
            {locked && <text x={cx} y={cy - 62} className="lock">🔒</text>}
          </g>
        );
      })}

      {/* หอคอยกลาง: ศูนย์ส่งเสริมการคิดสร้างสรรค์ */}
      <g className="tower" transform={`translate(${TOWER_POS[0]} ${TOWER_POS[1]})`} role="button" tabIndex={0} aria-label="ศูนย์ส่งเสริมการคิดสร้างสรรค์"
        onClick={onTower} onKeyDown={(e) => e.key === 'Enter' && onTower()} data-testid="tower">
        <circle r={70} fill="#fff8e7" stroke="#b7791f" strokeWidth={4} filter="url(#shadow)" />
        <SvgOptionalImage href="assets/components/tower.png" x={-60} y={-80} w={120} h={120} />
        <text y={-8} className="tower-icon">🏰</text>
        <text y={22} className="tower-label">ศูนย์ส่งเสริม</text>
        <text y={40} className="tower-label">การคิดสร้างสรรค์</text>
        {[1, 2, 3].map((z, i) => <text key={z} x={-30 + i * 30} y={62} className="tower-crystal" opacity={game.bossDefeated[z] ? 1 : 0.2}>💎</text>)}
      </g>

      {/* ตัวเดิน */}
      {game.zone <= 3 && game.players.map((p, k) => {
        const [x, y] = spacePos(game.zone, p.pos);
        const off = [[-12, -12], [12, -12], [-12, 12], [12, 12]][k];
        return (
          <g key={p.id} className={`pawn ${p.id === current?.id ? 'current' : ''}`} style={{ transform: `translate(${x + off[0]}px, ${y + off[1] - 30}px)` }} data-testid={`pawn-${k}`} data-pos={p.pos}>
            <circle r={15} fill={p.color} stroke="#fff" strokeWidth={3} />
            <text y={6} className="pawn-token">{p.token}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Dice({ value, rolling, disabled, onRoll }: { value: number | null; rolling: boolean; disabled: boolean; onRoll: () => void }) {
  const dots: Record<number, [number, number][]> = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[25, 25], [50, 50], [75, 75]] };
  const v = value ?? 1;
  return (
    <button className={`dice ${rolling ? 'rolling' : ''}`} disabled={disabled} onClick={onRoll} aria-label={`ทอยลูกเต๋า${value ? ` (ล่าสุด ${value})` : ''}`} data-testid="dice">
      <svg viewBox="0 0 100 100" width="64" height="64">
        <rect x="4" y="4" width="92" height="92" rx="18" fill="#fff" stroke="#3f3d56" strokeWidth="5" />
        {dots[v].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="10" fill="#3f3d56" />)}
      </svg>
      <span>{rolling ? 'กำลังทอย…' : 'ทอยเต๋า (1–3)'}</span>
    </button>
  );
}
