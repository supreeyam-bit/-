// แผนที่กระดานสามโซน (SVG) — เกาะลอยฟ้า สะพานไม้ ช่องเดิน 27 ช่อง ตัวเดิน และหอคอยกลาง
// ข้อความทั้งหมดเป็นข้อความจริงในเลเยอร์ SVG/HTML ไม่ได้ฝังในภาพ
import { BOSSES, ZONES } from '../data/quests';
import { SPACE_INFO, ZONE_LAYOUTS } from '../data/learning';
import { useStarted } from '../game/store';
import { SPACES_PER_ZONE } from '../game/rules';
import type { ZoneId } from '../game/types';

const CENTERS: { x: number; y: number }[] = [
  { x: 250, y: 215 },
  { x: 750, y: 215 },
  { x: 500, y: 560 },
];
const TOWER = { x: 500, y: 330 };
const RX = 200;
const RY = 112;

export function tilePos(zone: ZoneId, i: number) {
  const c = CENTERS[zone];
  const t = Math.PI / 2 + (i * 2 * Math.PI) / SPACES_PER_ZONE;
  return { x: c.x + 150 * Math.cos(t), y: c.y + 74 * Math.sin(t) };
}

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${ch(n >> 16)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

export function Board() {
  const { state, open, toast } = useStarted();

  const clickTile = (zone: ZoneId, i: number) => {
    const kind = ZONE_LAYOUTS[zone][i];
    const info = SPACE_INFO[kind];
    if (zone > state.zone) return toast(`🔒 ${ZONES[zone].name} ยังล็อกอยู่ ต้องชนะบอสของโซนก่อนหน้า`);
    if (kind === 'gate' && zone === state.zone) return open({ type: 'boss' });
    toast(`ช่อง ${i + 1}: ${info.icon} ${info.name} — ${info.desc}`);
  };

  return (
    <div className="board-wrap">
      <svg className="board" viewBox="0 0 1000 760" role="img" aria-label="แผนที่กระดาน BLOCK WORLD สามโซนและหอคอยกลาง">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1e1b4b" />
            <stop offset="0.55" stopColor="#4338ca" />
            <stop offset="1" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="fall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bae6fd" stopOpacity="0.95" />
            <stop offset="1" stopColor="#bae6fd" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="glow">
            <stop offset="0" stopColor="#fde68a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1000" height="760" fill="url(#sky)" />
        {Array.from({ length: 28 }, (_, i) => (
          <circle key={i} className="star" cx={(i * 137) % 1000} cy={(i * 59) % 300} r={i % 3 === 0 ? 2 : 1.2} fill="#fff" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
        ))}

        {/* สะพานไม้จากแต่ละเกาะสู่หอคอย */}
        {CENTERS.map((c, z) => {
          const g = tilePos(z as ZoneId, 0);
          return <line key={z} x1={z === 2 ? c.x : g.x} y1={z === 2 ? c.y - RY + 20 : c.y + 30} x2={TOWER.x} y2={TOWER.y + 40} className="bridge" />;
        })}

        {CENTERS.map((c, z) => {
          const zone = ZONES[z];
          const locked = z > state.zone;
          const cleared = state.bossStatus[z] === 'defeated';
          const pts = Array.from({ length: SPACES_PER_ZONE }, (_, i) => tilePos(z as ZoneId, i));
          return (
            <g key={z} className={`island ${locked ? 'locked' : ''}`}>
              {/* น้ำตกขอบเกาะ */}
              {[-0.6, -0.2, 0.25, 0.65].map((f, k) => (
                <rect key={k} className="fall" x={c.x + f * RX - 9} y={c.y + RY * 0.7} width={18} height={95 + k * 12} fill="url(#fall)" rx={8} />
              ))}
              <ellipse cx={c.x} cy={c.y + 30} rx={RX} ry={RY} fill={zone.colors.side} />
              <ellipse cx={c.x} cy={c.y + 15} rx={RX} ry={RY} fill={zone.colors.dark} />
              <ellipse cx={c.x} cy={c.y} rx={RX} ry={RY} fill={zone.colors.main} />
              <ellipse cx={c.x} cy={c.y - 6} rx={RX - 18} ry={RY - 14} fill={zone.colors.light} opacity={0.35} />
              <polygon points={pts.map((p) => `${p.x},${p.y}`).join(' ')} className="path" />
              <text x={c.x} y={c.y + 6} textAnchor="middle" fontSize="50" aria-hidden="true">{zone.landmark[0]}</text>
              <text x={c.x + 38} y={c.y - 14} textAnchor="middle" fontSize="26" aria-hidden="true" className="float">{zone.landmark[1]}</text>
              <g transform={`translate(${c.x}, ${c.y - RY - 26})`}>
                <rect x={-118} y={-22} width={236} height={40} rx={20} fill="#ffffffee" stroke={zone.colors.dark} strokeWidth={3} />
                <text textAnchor="middle" y={5} className="zone-title" fill={zone.colors.dark}>{zone.name}</text>
              </g>
              <text x={c.x} y={c.y + RY + 52} textAnchor="middle" className="place-label">{zone.place} · บอส {BOSSES[z].name}</text>

              {pts.map((p, i) => {
                const kind = ZONE_LAYOUTS[z][i];
                const info = SPACE_INFO[kind];
                const w = kind === 'gate' ? 38 : 31;
                const h = kind === 'gate' ? 21 : 17;
                return (
                  <g key={i} className="tile" role="button" tabIndex={locked ? -1 : 0} aria-label={`${zone.short} ช่อง ${i + 1} ${info.name}`}
                    onClick={() => clickTile(z as ZoneId, i)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && clickTile(z as ZoneId, i)}>
                    <polygon points={`${p.x - w},${p.y} ${p.x},${p.y + h} ${p.x},${p.y + h + 10} ${p.x - w},${p.y + 10}`} fill={shade(info.color, 0.62)} />
                    <polygon points={`${p.x + w},${p.y} ${p.x},${p.y + h} ${p.x},${p.y + h + 10} ${p.x + w},${p.y + 10}`} fill={shade(info.color, 0.78)} />
                    <polygon points={`${p.x},${p.y - h} ${p.x + w},${p.y} ${p.x},${p.y + h} ${p.x - w},${p.y}`} fill={info.color} stroke="#fff" strokeWidth={2} />
                    <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize={kind === 'gate' ? 20 : 17} aria-hidden="true">{kind === 'gate' ? BOSSES[z].emoji : info.icon}</text>
                  </g>
                );
              })}

              {locked && (
                <g>
                  <ellipse cx={c.x} cy={c.y + 10} rx={RX + 4} ry={RY + 24} fill="#1e1b4b" opacity={0.6} />
                  <text x={c.x} y={c.y + 18} textAnchor="middle" fontSize="44" aria-hidden="true">🔒</text>
                  <text x={c.x} y={c.y + 54} textAnchor="middle" className="lock-label">ชนะบอสโซนก่อนหน้าเพื่อปลดล็อก</text>
                </g>
              )}
              {cleared && (
                <g transform={`translate(${c.x + RX - 30}, ${c.y - RY + 10})`}>
                  <circle r={22} fill={BOSSES[z].crystalColor} stroke="#fff" strokeWidth={3} />
                  <text textAnchor="middle" y={8} fontSize="22" aria-hidden="true">💎</text>
                </g>
              )}
            </g>
          );
        })}

        {/* หอคอยกลาง = 5. ศูนย์ส่งเสริมการคิดสร้างสรรค์ */}
        <g className={`tower ${state.finished ? 'lit' : ''}`} role="button" tabIndex={0} aria-label="หอคอยกลาง ศูนย์ส่งเสริมการคิดสร้างสรรค์"
          onClick={() => open({ type: 'tower' })} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open({ type: 'tower' })}>
          <circle cx={TOWER.x} cy={TOWER.y - 40} r={state.finished ? 130 : 70 + state.towerProgress.filter(Boolean).length * 12} fill="url(#glow)" className="tower-glow" />
          <ellipse cx={TOWER.x} cy={TOWER.y + 48} rx={82} ry={34} fill="#5b4a8b" />
          <ellipse cx={TOWER.x} cy={TOWER.y + 40} rx={82} ry={34} fill="#a78bfa" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={TOWER.x - 34 + i * 4} y={TOWER.y + 18 - (i + 1) * 30} width={68 - i * 8} height={30} rx={4}
              fill={state.towerProgress[i] ? '#fbbf24' : '#64748b'} stroke="#1e1b4b" strokeWidth={2} />
          ))}
          {['F', 'FL', 'O', 'E'].map((t, i) => (
            <text key={t} x={TOWER.x} y={TOWER.y + 8 - i * 30} textAnchor="middle" className="tower-tag">{t}</text>
          ))}
          <polygon points={`${TOWER.x - 22},${TOWER.y - 102} ${TOWER.x},${TOWER.y - 140} ${TOWER.x + 22},${TOWER.y - 102}`} fill="#f472b6" stroke="#1e1b4b" strokeWidth={2} />
          <text x={TOWER.x} y={TOWER.y - 140} textAnchor="middle" fontSize="20" aria-hidden="true">⭐</text>
          {[0, 1, 2].map((i) => (
            <polygon key={i} points={`${TOWER.x - 30 + i * 30},${TOWER.y + 30} ${TOWER.x - 22 + i * 30},${TOWER.y + 40} ${TOWER.x - 30 + i * 30},${TOWER.y + 50} ${TOWER.x - 38 + i * 30},${TOWER.y + 40}`}
              fill={i < state.crystalCount ? BOSSES[i].crystalColor : '#cbd5e1'} stroke="#1e1b4b" strokeWidth={1.5} />
          ))}
          {state.crystalCount < 3 && <text x={TOWER.x + 48} y={TOWER.y - 20} fontSize="22" aria-hidden="true">🔒</text>}
          <g transform={`translate(${TOWER.x}, ${TOWER.y + 92})`}>
            <rect x={-150} y={-17} width={300} height={30} rx={15} fill="#fff7dd" stroke="#b45309" strokeWidth={2} />
            <text textAnchor="middle" y={4} className="tower-label">🗼 5. ศูนย์ส่งเสริมการคิดสร้างสรรค์</text>
          </g>
        </g>

        {/* ตัวเดินผู้เล่น */}
        {state.players.map((p, idx) => {
          const pos = tilePos(state.zone, state.positions[idx]);
          const dx = (idx - (state.players.length - 1) / 2) * 15;
          const active = idx === state.activePlayer;
          return (
            <g key={p.id} className="token" style={{ transform: `translate(${pos.x + dx}px, ${pos.y - 24}px)` }} aria-label={`${p.name} อยู่ช่อง ${state.positions[idx] + 1}`}>
              {active && <circle r={21} className="token-ring" fill="none" stroke="#fde047" strokeWidth={4} />}
              <circle r={16} fill={p.color} stroke="#fff" strokeWidth={3} />
              <text textAnchor="middle" y={6} fontSize="17" aria-hidden="true">{p.avatar}</text>
            </g>
          );
        })}
      </svg>
      <ul className="legend" aria-label="ความหมายของช่อง">
        {Object.entries(SPACE_INFO).map(([k, v]) => (
          <li key={k}><span className="legend-dot" style={{ background: v.color }} aria-hidden="true">{v.icon}</span> {v.name}</li>
        ))}
      </ul>
    </div>
  );
}
