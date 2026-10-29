// กลไกเสริมความสนุก (ไม่เปลี่ยนเป้าหมายหรือขอบเขตภารกิจ): กระดานวาดภาพ ลูกเต๋าเรื่องเล่า (Story Cubes) การ์ดผู้ฟัง และเกมทายภาพฝัน (Dixit)
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { DREAM_CARDS, LISTENERS, STORY_CUBES } from '../data/quests';
import { useStarted } from '../game/store';
import { addLog, playerName, updateWork } from '../game/rules';
import type { Work } from '../game/types';
import { SpeakButton } from './ui';

const COLORS = ['#1e1b4b', '#e5484d', '#f59e0b', '#22a35a', '#2f8fe6', '#a855f7', '#8b5a2b', '#ffffff'];

/** กระดานวาดภาพประกอบ (ภารกิจคิดริเริ่ม) — บันทึกเป็นภาพในใบงานของผู้เล่น */
export function DrawingPad({ value, base, onSave, disabled }: { value?: string; base?: string; onSave: (dataUrl: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(6);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    const src = value || base;
    if (src) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height);
      img.src = src;
    }
    // วาดภาพเดิมเฉพาะตอนเปิด ไม่ต้องวาดซ้ำทุกครั้งที่บันทึก
  }, []);

  const pos = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * e.currentTarget.width, y: ((e.clientY - r.top) / r.height) * e.currentTarget.height };
  };
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = e.currentTarget.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext('2d')!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onSave(ref.current!.toDataURL('image/jpeg', 0.75));
  };
  const clear = () => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    onSave(c.toDataURL('image/jpeg', 0.75));
  };

  return (
    <div className="drawpad">
      <div className="draw-tools" aria-label="เครื่องมือวาด">
        {COLORS.map((c) => (
          <button key={c} type="button" className={`swatch ${color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c === '#ffffff' ? 'ยางลบ' : `สี ${c}`} disabled={disabled} />
        ))}
        <label className="small">ขนาด <input type="range" min={2} max={24} value={size} onChange={(e) => setSize(Number(e.target.value))} disabled={disabled} /></label>
        <button type="button" className="btn small ghost" onClick={clear} disabled={disabled}>🧽 ล้างภาพ</button>
      </div>
      <canvas ref={ref} width={640} height={400} className="canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        aria-label="กระดานวาดภาพประกอบ ใช้นิ้วหรือเมาส์วาด" role="img" />
      {base && !value && <p className="muted small">พื้นหลังคือภาพที่วาดไว้ในภารกิจก่อน วาดเพิ่มต่อได้เลย</p>}
    </div>
  );
}

/** ลูกเต๋าเรื่องเล่า: ตามตารางที่ 2 ตั้งหน้า ลม · ว่าว · ทุ่งนา ไว้ แล้วทอยลูกอื่นเพื่อจุดประกายความคิด */
export function StoryCubes({ work, pid, onWords }: { work: Work; pid: string; onWords?: (w: string[]) => void }) {
  const { setState } = useStarted();
  const [free, setFree] = useState(false);
  const faces = work.cubes?.[pid];
  const roll = () => {
    const res = STORY_CUBES.map((c) => (c.fixed !== undefined && !free ? c.faces[c.fixed] : c.faces[Math.floor(Math.random() * 6)])).map(([i, w]) => `${i} ${w}`);
    setState((s) => updateWork(s, work.id, (w) => ({ ...w, cubes: { ...w.cubes, [pid]: res } })));
    onWords?.(res.map((x) => x.split(' ').slice(1).join(' ')));
  };
  return (
    <div className="cubes">
      <div className="cubes-head">
        <strong>🎲 ลูกเต๋าเรื่องเล่า (แบบ Story Cubes)</strong>
        <SpeakButton text="ลูกเต๋าสามลูกตั้งหน้า ลม ว่าว ทุ่งนา ไว้ตามคำที่กำหนด ทอยลูกที่เหลือเพื่อจุดประกายความคิด" />
      </div>
      <div className="cube-row">
        {(faces ?? STORY_CUBES.map((c) => `${c.faces[c.fixed ?? 0][0]} ${c.fixed !== undefined ? c.faces[c.fixed][1] : '?'}`)).map((f, i) => (
          <span key={i} className={`cube ${STORY_CUBES[i].fixed !== undefined && !free ? 'fixed' : ''}`} title={STORY_CUBES[i].name}>
            <span className="cube-ic" aria-hidden="true">{f.split(' ')[0]}</span>
            <small>{f.split(' ').slice(1).join(' ')}</small>
          </span>
        ))}
        <button type="button" className="btn small" onClick={roll}>🎲 ทอย</button>
      </div>
      <label className="agree small"><input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> ทอยอิสระทุกลูก (ใช้นอกเวลาเก็บข้อมูลเท่านั้น — ภารกิจหลักต้องใช้คำ ว่าว ทุ่งนา ลม)</label>
    </div>
  );
}

export function ListenerCard({ id, compact }: { id: string; compact?: boolean }) {
  const l = LISTENERS[id];
  const [open, setOpen] = useState(!compact);
  if (!l) return null;
  return (
    <button type="button" className={`listener-card ${open ? 'open' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
      <span className="lc-icon" aria-hidden="true">{l.icon}</span>
      <span className="lc-name">การ์ดผู้ฟัง: {l.name}</span>
      {open && <ul>{l.tips.map((t) => <li key={t}>{t}</li>)}</ul>}
    </button>
  );
}

/** เกมทายภาพฝัน (แบบ Dixit) — ผู้เล่าเลือกการ์ดลับ พูดประโยคบรรยาย เพื่อนทาย */
export function DixitGame({ work }: { work: Work }) {
  const { state, setState, toast } = useStarted();
  const d = work.dixit;
  const [teller, setTeller] = useState(state.players[0].id);
  const [sentence, setSentence] = useState('');
  const [secret, setSecret] = useState<number | null>(null);
  const [guesser, setGuesser] = useState<string | null>(null);

  const deal = () => {
    const pool = DREAM_CARDS.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, Math.max(5, state.players.length + 3));
    setState((s) => updateWork(s, work.id, (w) => ({ ...w, dixit: { teller, secret: -1, cards: pool, guesses: {}, sentence: '' } })));
    setSecret(null);
    setSentence('');
  };
  const lock = () => {
    if (secret === null || !sentence.trim()) return;
    setState((s) => updateWork(s, work.id, (w) => ({ ...w, dixit: { ...w.dixit!, secret, sentence: sentence.trim() } })));
    setGuesser(state.players.find((p) => p.id !== d?.teller)?.id ?? null);
  };
  const guess = (card: number) => {
    if (!guesser || !d) return;
    const guesses = { ...d.guesses, [guesser]: card };
    setState((s) => updateWork(s, work.id, (w) => ({ ...w, dixit: { ...w.dixit!, guesses } })));
    const next = state.players.find((p) => p.id !== d.teller && guesses[p.id] === undefined);
    setGuesser(next?.id ?? null);
  };
  const others = state.players.filter((p) => p.id !== d?.teller);
  const allGuessed = d && d.secret >= 0 && others.every((p) => d.guesses[p.id] !== undefined);
  const right = d ? others.filter((p) => d.guesses[p.id] === d.secret).length : 0;

  useEffect(() => {
    if (allGuessed && d) {
      const msg = right === 0 || right === others.length ? 'ทุกคนทายถูกหรือไม่มีใครถูก ประโยคอาจชัดหรือยากเกินไป ลองใหม่อีกรอบ' : `${playerName(state, d.teller)} และคนที่ทายถูกได้ประกายคิด!`;
      setState((s) => addLog(s, `🃏 เกมทายภาพฝัน: ${msg}`));
      toast(`🃏 ${msg}`);
    }
    // แจ้งครั้งเดียวเมื่อทายครบ
  }, [allGuessed]);

  return (
    <details className="dixit">
      <summary>🃏 เกมทายภาพฝัน (แบบ Dixit) — เล่นเสริมเพื่อจุดประกาย ไม่บังคับ</summary>
      <p className="small">ผู้เล่าเลือกการ์ดภาพฝัน 1 ใบแบบลับ แล้วแต่งประโยคบรรยาย 1 ประโยค (ต้องมีภาคประธานและภาคแสดงครบ) เพื่อนผลัดกันทายว่าเป็นใบไหน</p>
      {!d && (
        <div className="row-actions">
          <label>ผู้เล่า: <select value={teller} onChange={(e) => setTeller(e.target.value)}>{state.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <button type="button" className="btn small" onClick={deal}>🃏 แจกการ์ด</button>
        </div>
      )}
      {d && d.secret < 0 && (
        <div>
          <p>🙈 ให้ <strong>{playerName(state, d.teller)}</strong> ถือเครื่องคนเดียว เลือกการ์ดลับแล้วแต่งประโยค</p>
          <div className="dream-row">
            {d.cards.map((c) => (
              <button key={c} type="button" className={`dream ${secret === c ? 'on' : ''}`} onClick={() => setSecret(c)} aria-label={`การ์ด ${DREAM_CARDS[c].join(' ')}`}>{DREAM_CARDS[c].join('')}</button>
            ))}
          </div>
          <input className="search" value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="ประโยคบรรยายภาพ เช่น ปลาวาฬลอยอยู่บนฟ้าเหมือนลูกโป่ง" aria-label="ประโยคของผู้เล่า" />
          <button type="button" className="btn small" disabled={secret === null || !sentence.trim()} onClick={lock}>🔒 ซ่อนการ์ดแล้วส่งเครื่องให้เพื่อน</button>
        </div>
      )}
      {d && d.secret >= 0 && (
        <div>
          <p>💬 ประโยคของผู้เล่า: <strong>{d.sentence}</strong></p>
          {!allGuessed && guesser && <p>👉 ตาของ <strong>{playerName(state, guesser)}</strong> ทายว่าการ์ดใบไหน</p>}
          <div className="dream-row">
            {d.cards.map((c) => (
              <button key={c} type="button" className={`dream ${allGuessed && c === d.secret ? 'on' : ''}`} disabled={!!allGuessed || !guesser} onClick={() => guess(c)}>
                {DREAM_CARDS[c].join('')}
                {allGuessed && <small>{others.filter((p) => d.guesses[p.id] === c).map((p) => p.name).join(', ')}</small>}
              </button>
            ))}
          </div>
          {allGuessed && (
            <div className="row-actions">
              <span>ทายถูก {right}/{others.length} คน</span>
              <button type="button" className="btn small ghost" onClick={() => setState((s) => updateWork(s, work.id, (w) => ({ ...w, dixit: null })))}>🔄 เล่นอีกรอบ</button>
            </div>
          )}
        </div>
      )}
    </details>
  );
}
