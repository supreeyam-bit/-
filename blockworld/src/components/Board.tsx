// แผนที่กระดาน 3D Isometric Fantasy Adventure (SVG แบบ voxel) — เกาะลอยฟ้า 3 โซน น้ำตก สะพานไม้ ช่องเดิน 27 ช่อง ตัวเดิน และหอคอยกลาง
// ข้อความทั้งหมดเป็นข้อความจริงในเลเยอร์ SVG/HTML ไม่ได้ฝังในภาพ
import { AREAS, BOSSES, ZONES } from '../data/quests';
import { SPACE_INFO, ZONE_LAYOUTS } from '../data/learning';
import { useStarted } from '../game/store';
import { SPACES_PER_ZONE } from '../game/rules';
import type { CreativityTag, SpaceKind, ZoneId } from '../game/types';

const HW = 28; // ครึ่งความกว้างของช่องกริด isometric
const HH = 14; // ครึ่งความสูงของช่องกริด
const BH = 14; // ความสูงของบล็อก 1 ชั้น
const N = 3; // เกาะกว้าง 6 × 6 ช่อง (−3…3)
const DEPTH = 3; // ความหนาของเกาะ (ชั้นดิน)

const CENTERS: { x: number; y: number }[] = [
  { x: 235, y: 200 },
  { x: 765, y: 200 },
  { x: 500, y: 585 },
];
const TOWER = { x: 500, y: 325 };

type Pt = { x: number; y: number };
const iso = (c: Pt, gx: number, gy: number, gz = 0): Pt => ({ x: c.x + (gx - gy) * HW, y: c.y + (gx + gy) * HH - gz * BH });
const pts = (p: Pt[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

/** ลูกบาศก์ isometric 1 ก้อน: ฐานที่ (gx,gy) สูง z0 → z0+h ขนาดด้าน s ช่อง */
function Cube({ c, gx, gy, z0 = 0, h = 1, s = 1, color, stroke = '#1e1b4b33' }: { c: Pt; gx: number; gy: number; z0?: number; h?: number; s?: number; color: string; stroke?: string }) {
  const d = s / 2;
  const top = [iso(c, gx - d, gy - d, z0 + h), iso(c, gx + d, gy - d, z0 + h), iso(c, gx + d, gy + d, z0 + h), iso(c, gx - d, gy + d, z0 + h)];
  const left = [iso(c, gx - d, gy + d, z0 + h), iso(c, gx + d, gy + d, z0 + h), iso(c, gx + d, gy + d, z0), iso(c, gx - d, gy + d, z0)];
  const right = [iso(c, gx + d, gy + d, z0 + h), iso(c, gx + d, gy - d, z0 + h), iso(c, gx + d, gy - d, z0), iso(c, gx + d, gy + d, z0)];
  return (
    <g>
      <polygon points={pts(left)} fill={shade(color, 0.68)} stroke={stroke} />
      <polygon points={pts(right)} fill={shade(color, 0.84)} stroke={stroke} />
      <polygon points={pts(top)} fill={color} stroke={stroke} />
    </g>
  );
}

function Tree({ c, gx, gy, leaf }: { c: Pt; gx: number; gy: number; leaf: string }) {
  return (
    <g aria-hidden="true">
      <Cube c={c} gx={gx} gy={gy} h={0.8} s={0.3} color="#8b5a2b" />
      <Cube c={c} gx={gx} gy={gy} z0={0.8} h={0.9} s={0.9} color={leaf} />
      <Cube c={c} gx={gx} gy={gy} z0={1.7} h={0.5} s={0.5} color={shade(leaf, 1.12)} />
    </g>
  );
}

/** ตำแหน่งช่องเดินบนวงรอบ (วงกลมในกริด = วงรีบนจอแบบ isometric) */
export function tileGrid(i: number) {
  const t = Math.PI / 4 + (i * 2 * Math.PI) / SPACES_PER_ZONE;
  return { gx: 2.15 * Math.cos(t), gy: 2.15 * Math.sin(t) };
}
export function tilePos(zone: ZoneId, i: number): Pt {
  const g = tileGrid(i);
  return iso(CENTERS[zone], g.gx, g.gy, 0.5);
}

const tileColor = (kind: SpaceKind) => (kind in AREAS ? AREAS[kind as CreativityTag].color : SPACE_INFO[kind].color);

function Island({ z, locked, cleared, onTile }: { z: ZoneId; locked: boolean; cleared: boolean; onTile: (i: number) => void }) {
  const c = CENTERS[z];
  const zone = ZONES[z];
  const top = [iso(c, -N, -N), iso(c, N, -N), iso(c, N, N), iso(c, -N, N)];
  const left = [iso(c, -N, N), iso(c, N, N), iso(c, N, N, -DEPTH), iso(c, -N, N, -DEPTH)];
  const right = [iso(c, N, N), iso(c, N, -N), iso(c, N, -N, -DEPTH), iso(c, N, N, -DEPTH)];
  const leaf = ['#8b7cf8', '#4ade80', '#fb923c'][z];
  const tiles = Array.from({ length: SPACES_PER_ZONE }, (_, i) => ({ i, ...tileGrid(i) }));
  const back = tiles.filter((t) => t.gx + t.gy < 0);
  const front = tiles.filter((t) => t.gx + t.gy >= 0);
  const ring = tiles.map((t) => iso(c, t.gx, t.gy, 0.02));

  const tile = (t: { i: number; gx: number; gy: number }) => {
    const kind = ZONE_LAYOUTS[z][t.i];
    const info = SPACE_INFO[kind];
    const p = iso(c, t.gx, t.gy, 0.5);
    const big = kind === 'gate';
    return (
      <g key={t.i} className="tile" role="button" tabIndex={locked ? -1 : 0} aria-label={`${zone.short} ช่อง ${t.i + 1} ${info.name}`}
        onClick={() => onTile(t.i)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTile(t.i)}>
        <Cube c={c} gx={t.gx} gy={t.gy} h={0.5} s={big ? 1.05 : 0.85} color={tileColor(kind)} stroke="#ffffffcc" />
        <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize={big ? 19 : 16} aria-hidden="true">{kind === 'gate' ? BOSSES[z].emoji : info.icon}</text>
      </g>
    );
  };

  return (
    <g className={`island ${locked ? 'locked' : ''}`}>
      {/* น้ำตกไหลจากขอบเกาะ */}
      {[-1.5, 0.5, 2].map((g, k) => {
        const a = iso(c, g - 0.35, N, -DEPTH);
        const b = iso(c, g + 0.35, N, -DEPTH);
        return <polygon key={`l${k}`} className="fall" points={pts([a, b, { x: b.x, y: b.y + 90 + k * 14 }, { x: a.x, y: a.y + 90 + k * 14 }])} fill="url(#fall)" />;
      })}
      {[-1, 1.4].map((g, k) => {
        const a = iso(c, N, g - 0.35, -DEPTH);
        const b = iso(c, N, g + 0.35, -DEPTH);
        return <polygon key={`r${k}`} className="fall" points={pts([a, b, { x: b.x, y: b.y + 80 + k * 18 }, { x: a.x, y: a.y + 80 + k * 18 }])} fill="url(#fall)" />;
      })}
      {/* ตัวเกาะ voxel: ด้านซ้าย ด้านขวา และพื้นหญ้าด้านบน */}
      <polygon points={pts(left)} fill={zone.colors.side} />
      <polygon points={pts(right)} fill={shade(zone.colors.side, 1.25)} />
      {[1, 2].map((k) => (
        <g key={k} stroke="#00000033">
          <line x1={iso(c, -N, N, -k).x} y1={iso(c, -N, N, -k).y} x2={iso(c, N, N, -k).x} y2={iso(c, N, N, -k).y} />
          <line x1={iso(c, N, N, -k).x} y1={iso(c, N, N, -k).y} x2={iso(c, N, -N, -k).x} y2={iso(c, N, -N, -k).y} />
        </g>
      ))}
      {Array.from({ length: 2 * N - 1 }, (_, k) => k - N + 1).map((g) => (
        <g key={g} stroke="#00000026">
          <line x1={iso(c, g, N).x} y1={iso(c, g, N).y} x2={iso(c, g, N, -DEPTH).x} y2={iso(c, g, N, -DEPTH).y} />
          <line x1={iso(c, N, g).x} y1={iso(c, N, g).y} x2={iso(c, N, g, -DEPTH).x} y2={iso(c, N, g, -DEPTH).y} />
        </g>
      ))}
      <polygon points={pts(top)} fill={zone.colors.main} stroke={shade(zone.colors.main, 1.2)} strokeWidth={2} />
      {Array.from({ length: 2 * N - 1 }, (_, k) => k - N + 1).map((g) => (
        <g key={g} stroke="#ffffff30">
          <line x1={iso(c, g, -N).x} y1={iso(c, g, -N).y} x2={iso(c, g, N).x} y2={iso(c, g, N).y} />
          <line x1={iso(c, -N, g).x} y1={iso(c, -N, g).y} x2={iso(c, N, g).x} y2={iso(c, N, g).y} />
        </g>
      ))}
      <polygon points={pts(ring)} className="path" />
      <Tree c={c} gx={-2.55} gy={-2.55} leaf={leaf} />
      <Tree c={c} gx={2.55} gy={-2.45} leaf={leaf} />
      <Tree c={c} gx={-2.5} gy={2.5} leaf={leaf} />
      {back.map(tile)}
      {/* แลนด์มาร์กกลางเกาะ */}
      <Cube c={c} gx={0} gy={0} h={1.2} s={1.4} color={zone.colors.light} />
      <Cube c={c} gx={0} gy={0} z0={1.2} h={0.4} s={1.1} color={zone.colors.dark} />
      <text x={iso(c, 0, 0, 2.3).x} y={iso(c, 0, 0, 2.3).y + 12} textAnchor="middle" fontSize="38" aria-hidden="true">{zone.landmark[0]}</text>
      <text x={iso(c, 0.9, -0.9, 2.6).x} y={iso(c, 0.9, -0.9, 2.6).y} textAnchor="middle" fontSize="22" aria-hidden="true" className="float">{zone.landmark[1]}</text>
      {front.map(tile)}

      <g transform={`translate(${c.x}, ${c.y - N * 2 * HH - 30})`}>
        <rect x={-118} y={-21} width={236} height={38} rx={19} fill="#ffffffee" stroke={zone.colors.dark} strokeWidth={3} />
        <text textAnchor="middle" y={5} className="zone-title" fill={zone.colors.dark}>{zone.name}</text>
      </g>
      <text x={c.x} y={c.y + N * 2 * HH + DEPTH * BH + 22} textAnchor="middle" className="place-label">{zone.place} · บอส {BOSSES[z].name}</text>

      {locked && (
        <g>
          <polygon points={pts([iso(c, -N, -N), iso(c, N, -N), iso(c, N, -N, -DEPTH), iso(c, N, N, -DEPTH), iso(c, -N, N, -DEPTH), iso(c, -N, N)])} fill="#1e1b4b" opacity={0.62} />
          <text x={c.x} y={c.y + 10} textAnchor="middle" fontSize="42" aria-hidden="true">🔒</text>
          <text x={c.x} y={c.y + 44} textAnchor="middle" className="lock-label">ผ่านด่านตรวจโซนก่อนหน้าเพื่อปลดล็อก</text>
        </g>
      )}
      {cleared && (
        <g transform={`translate(${iso(c, N, -N).x - 20}, ${iso(c, N, -N).y - 40})`}>
          <circle r={22} fill={BOSSES[z].crystalColor} stroke="#fff" strokeWidth={3} />
          <text textAnchor="middle" y={8} fontSize="22" aria-hidden="true">💎</text>
        </g>
      )}
    </g>
  );
}

function Tower() {
  const { state, open } = useStarted();
  const c = TOWER;
  const lit = state.towerProgress;
  const floors: CreativityTag[] = ['F', 'FL', 'O', 'E'];
  return (
    <g className={`tower ${state.finished ? 'lit' : ''}`} role="button" tabIndex={0} aria-label="หอคอยกลาง ศูนย์ส่งเสริมการคิดสร้างสรรค์"
      onClick={() => open({ type: 'tower' })} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open({ type: 'tower' })}>
      <circle cx={c.x} cy={c.y - 60} r={state.finished ? 140 : 70 + lit.filter(Boolean).length * 14} fill="url(#glow)" className="tower-glow" />
      {/* ฐานหิน */}
      <Cube c={c} gx={0} gy={0} z0={-1.5} h={1.5} s={3.2} color="#a78bfa" />
      {floors.map((t, i) => (
        <Cube key={t} c={c} gx={0} gy={0} z0={i * 1.6} h={1.6} s={1.9 - i * 0.28} color={lit[i] ? '#fbbf24' : '#64748b'} />
      ))}
      {floors.map((t, i) => {
        const p = iso(c, 0, 0, i * 1.6 + 0.8);
        return <text key={t} x={p.x - (0.95 - i * 0.14) * HW * 0.55} y={p.y + (0.95 - i * 0.14) * HH + 4} textAnchor="middle" className="tower-tag" style={{ fill: lit[i] ? '#7c2d12' : '#f8fafc' }}>{AREAS[t].symbol}{t}</text>;
      })}
      {(() => {
        const a = iso(c, 0, 0, 6.4);
        const b1 = iso(c, -0.5, 0.5, 6.4);
        return <polygon points={pts([{ x: a.x, y: a.y - 46 }, { x: b1.x, y: b1.y }, { x: a.x, y: a.y + 8 }, { x: 2 * a.x - b1.x, y: b1.y }])} fill="#f472b6" stroke="#1e1b4b" strokeWidth={2} />;
      })()}
      <text x={c.x} y={iso(c, 0, 0, 6.4).y - 48} textAnchor="middle" fontSize="20" aria-hidden="true">⭐</text>
      {[0, 1, 2].map((i) => {
        const p = iso(c, 1.3, -1 + i, 0.2);
        return <polygon key={i} points={pts([{ x: p.x, y: p.y - 12 }, { x: p.x + 8, y: p.y }, { x: p.x, y: p.y + 12 }, { x: p.x - 8, y: p.y }])}
          fill={i < state.crystalCount ? BOSSES[i].crystalColor : '#cbd5e1'} stroke="#1e1b4b" strokeWidth={1.5} />;
      })}
      {state.crystalCount < 3 && <text x={c.x + 42} y={c.y - 40} fontSize="22" aria-hidden="true">🔒</text>}
      <g transform={`translate(${c.x}, ${c.y + 66})`}>
        <rect x={-150} y={-17} width={300} height={30} rx={15} fill="#fff7dd" stroke="#b45309" strokeWidth={2} />
        <text textAnchor="middle" y={4} className="tower-label">🗼 5. ศูนย์ส่งเสริมการคิดสร้างสรรค์</text>
      </g>
    </g>
  );
}

export function Board() {
  const { state, open, toast } = useStarted();

  const clickTile = (zone: ZoneId, i: number) => {
    const kind = ZONE_LAYOUTS[zone][i];
    const info = SPACE_INFO[kind];
    if (zone > state.zone) return toast(`🔒 ${ZONES[zone].name} ยังล็อกอยู่ ต้องผ่านด่านตรวจของโซนก่อนหน้า`);
    if (kind === 'gate' && zone === state.zone) return open({ type: 'boss' });
    toast(`ช่อง ${i + 1}: ${info.icon} ${info.name} — ${info.desc}`);
  };

  return (
    <div className="board-wrap">
      <svg className="board" viewBox="0 0 1000 760" role="img" aria-label="แผนที่กระดาน BLOCK WORLD แบบ isometric สามโซนและหอคอยกลาง">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1e1b4b" />
            <stop offset="0.5" stopColor="#4338ca" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="fall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e0f2fe" stopOpacity="0.95" />
            <stop offset="1" stopColor="#bae6fd" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="glow">
            <stop offset="0" stopColor="#fde68a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1000" height="760" fill="url(#sky)" />
        {Array.from({ length: 30 }, (_, i) => (
          <circle key={i} className="star" cx={(i * 137) % 1000} cy={(i * 59) % 280} r={i % 3 === 0 ? 2 : 1.2} fill="#fff" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
        ))}
        {[[120, 420], [880, 430], [300, 700], [720, 690]].map(([x, y], i) => (
          <g key={i} className="cloud" opacity={0.75} style={{ animationDelay: `${i * 2}s` }}>
            <ellipse cx={x} cy={y} rx={46} ry={14} fill="#fff" />
            <ellipse cx={x + 22} cy={y - 8} rx={26} ry={12} fill="#fff" />
          </g>
        ))}

        {/* สะพานไม้จากแต่ละเกาะสู่หอคอย */}
        {CENTERS.map((c, z) => {
          const from = z === 0 ? iso(c, N, 0) : z === 1 ? iso(c, 0, N) : iso(c, -N + 1, -N + 1);
          return (
            <g key={z}>
              <line x1={from.x} y1={from.y} x2={TOWER.x} y2={TOWER.y} className="bridge-rail" />
              <line x1={from.x} y1={from.y} x2={TOWER.x} y2={TOWER.y} className="bridge" />
            </g>
          );
        })}

        {[0, 1, 2].map((z) => (
          <Island key={z} z={z as ZoneId} locked={z > state.zone} cleared={state.bossStatus[z] === 'defeated'} onTile={(i) => clickTile(z as ZoneId, i)} />
        ))}
        <Tower />

        {/* ตัวเดินผู้เล่น */}
        {state.players.map((p, idx) => {
          const pos = tilePos(state.zone, state.positions[idx]);
          const dx = (idx - (state.players.length - 1) / 2) * 14;
          const active = idx === state.activePlayer;
          return (
            <g key={p.id} className="token" style={{ transform: `translate(${pos.x + dx}px, ${pos.y - 26}px)` }} aria-label={`${p.name} อยู่ช่อง ${state.positions[idx] + 1}`}>
              <ellipse cx={0} cy={24} rx={12} ry={5} fill="#00000040" />
              {active && <circle r={21} className="token-ring" fill="none" stroke="#fde047" strokeWidth={4} />}
              <circle r={16} fill={p.color} stroke="#fff" strokeWidth={3} />
              <text textAnchor="middle" y={6} fontSize="17" aria-hidden="true">{p.avatar}</text>
            </g>
          );
        })}
      </svg>
      <ul className="legend" aria-label="ความหมายของช่อง">
        {(Object.keys(SPACE_INFO) as SpaceKind[]).map((k) => (
          <li key={k}><span className="legend-dot" style={{ background: tileColor(k) }} aria-hidden="true">{SPACE_INFO[k].icon}</span> {SPACE_INFO[k].name}</li>
        ))}
      </ul>
    </div>
  );
}
