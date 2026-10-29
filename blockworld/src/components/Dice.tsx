// ลูกเต๋า 1–3 (6 หน้า: 1 1 2 2 3 3)
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[28, 28], [50, 50], [72, 72]],
};

export default function Dice({ value, rolling }: { value: number | null; rolling: boolean }) {
  return (
    <svg className={`dice ${rolling ? 'rolling' : ''}`} viewBox="0 0 100 100" role="img" aria-label={value ? `ลูกเต๋า ${value}` : 'ลูกเต๋า'}>
      <rect x="4" y="4" width="92" height="92" rx="18" fill="#fffaf0" stroke="#2b2350" strokeWidth="5" />
      {value ? PIPS[value].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill="#2b2350" />) : <text x="50" y="62" textAnchor="middle" fontSize="38" fill="#2b2350">?</text>}
    </svg>
  );
}
