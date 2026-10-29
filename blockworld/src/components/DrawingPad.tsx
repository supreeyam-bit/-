import { useEffect, useRef, useState } from 'react';

const COLORS = ['#2b2350', '#d63a2f', '#e8a800', '#2f9e44', '#2058b8', '#8fd0ff', '#a0522d', '#ffffff'];
const W = 800;
const H = 520;

// พื้นที่วาดภาพ ใช้ได้ทั้งเมาส์ นิ้ว และปากกา บันทึกเป็น PNG
export default function DrawingPad({ onSave, disabled }: { onSave: (dataUrl: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(6);
  const [eraser, setEraser] = useState(false);
  const [dirty, setDirty] = useState(false);
  const history = useRef<ImageData[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);

  const ctx = () => ref.current!.getContext('2d')!;
  const clear = () => {
    const c = ctx();
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, W, H);
    setDirty(false);
  };
  useEffect(clear, []);

  const point = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const down = (e: React.PointerEvent) => {
    if (disabled) return;
    ref.current!.setPointerCapture(e.pointerId);
    history.current.push(ctx().getImageData(0, 0, W, H));
    if (history.current.length > 30) history.current.shift();
    last.current = point(e);
    draw(e);
  };
  const draw = (e: React.PointerEvent) => {
    if (!last.current) return;
    const p = point(e);
    const c = ctx();
    c.strokeStyle = eraser ? '#ffffff' : color;
    c.lineWidth = eraser ? size * 3 : size;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(last.current.x, last.current.y);
    c.lineTo(p.x + 0.01, p.y);
    c.stroke();
    last.current = p;
    setDirty(true);
  };
  const up = () => (last.current = null);
  const undo = () => {
    const img = history.current.pop();
    if (img) ctx().putImageData(img, 0, 0);
  };

  return (
    <div className="drawpad">
      <div className="drawpad-tools">
        {COLORS.map((c) => (
          <button key={c} className={`swatch ${color === c && !eraser ? 'on' : ''}`} style={{ background: c }} aria-label={`สี ${c}`} onClick={() => { setColor(c); setEraser(false); }} />
        ))}
        <label className="size">ขนาด <input type="range" min={2} max={24} value={size} onChange={(e) => setSize(+e.target.value)} /></label>
        <button className={`btn small ${eraser ? 'primary' : ''}`} onClick={() => setEraser(!eraser)}>ยางลบ</button>
        <button className="btn small" onClick={undo}>ย้อนกลับ</button>
        <button className="btn small ghost" onClick={clear}>ล้าง</button>
      </div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        className="drawpad-canvas"
        data-testid="drawpad"
        onPointerDown={down}
        onPointerMove={draw}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
      <button
        className="btn primary"
        disabled={!dirty || disabled}
        onClick={() => {
          onSave(ref.current!.toDataURL('image/png'));
          history.current = [];
          clear();
        }}
      >
        บันทึกภาพวาด
      </button>
    </div>
  );
}
