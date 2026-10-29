import { useEffect, useRef, useState } from 'react';

const COLORS = ['#1f2937', '#d6453d', '#f59e0b', '#16a34a', '#2563c9', '#9333ea', '#8b5a2b', '#ffffff'];
const W = 640, H = 400;

/** พื้นที่วาดภาพ (canvas) วาดด้วยนิ้วหรือเมาส์ บันทึกเป็นภาพ PNG ลงในชิ้นงาน */
export function DrawingPad({ value, background, onSave }: { value?: string; background?: string; onSave: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(6);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const undo = useRef<ImageData[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    const src = value || background;
    if (src) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, W, H);
      img.src = src;
    }
  }, [value, background]);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const down = (e: React.PointerEvent) => {
    const ctx = ref.current!.getContext('2d')!;
    undo.current.push(ctx.getImageData(0, 0, W, H));
    if (undo.current.length > 20) undo.current.shift();
    ref.current!.setPointerCapture(e.pointerId);
    last.current = pos(e);
    draw(e);
  };
  const draw = (e: React.PointerEvent) => {
    if (!last.current) return;
    const ctx = ref.current!.getContext('2d')!;
    const p = pos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = color === '#ffffff' ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x + 0.01, p.y);
    ctx.stroke();
    last.current = p;
    setDirty(true);
    setSaved(false);
  };
  const up = () => { last.current = null; };
  const doUndo = () => {
    const d = undo.current.pop();
    if (d) { ref.current!.getContext('2d')!.putImageData(d, 0, 0); setDirty(true); }
  };
  const clear = () => {
    const ctx = ref.current!.getContext('2d')!;
    undo.current.push(ctx.getImageData(0, 0, W, H));
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    setDirty(true);
  };
  const stamp = (emoji: string) => {
    const ctx = ref.current!.getContext('2d')!;
    undo.current.push(ctx.getImageData(0, 0, W, H));
    ctx.font = '56px serif';
    ctx.fillText(emoji, 40 + Math.random() * (W - 120), 80 + Math.random() * (H - 140));
    setDirty(true);
  };

  return (
    <div className="pad">
      <div className="pad-tools">
        {COLORS.map((c) => (
          <button key={c} className={`swatch ${c === color ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)}
            aria-label={c === '#ffffff' ? 'ยางลบ' : `สี ${c}`} title={c === '#ffffff' ? 'ยางลบ' : ''} />
        ))}
        <label className="size">ขนาด <input type="range" min={2} max={24} value={size} onChange={(e) => setSize(+e.target.value)} /></label>
        {['🪁', '🌾', '💨', '☁️', '☀️', '🧒'].map((s) => <button key={s} className="btn sm ghost" onClick={() => stamp(s)} title="ติดสติกเกอร์">{s}</button>)}
        <button className="btn sm ghost" onClick={doUndo}>↶ ย้อน</button>
        <button className="btn sm ghost" onClick={clear}>ล้าง</button>
      </div>
      <canvas ref={ref} width={W} height={H} className="canvas" data-testid="canvas"
        onPointerDown={down} onPointerMove={draw} onPointerUp={up} onPointerCancel={up} />
      <div className="row end">
        {saved && <span className="ok-text">บันทึกภาพแล้ว ✓</span>}
        <button className="btn primary" disabled={!dirty} onClick={() => { onSave(ref.current!.toDataURL('image/png')); setDirty(false); setSaved(true); }}>💾 บันทึกภาพ</button>
      </div>
    </div>
  );
}
