import { useState } from 'react';
import { STATIONS, TOKEN_COLORS } from '../data';

// ตั้งค่าผู้เล่น 2–4 คน (pass-and-play บนเครื่องเดียว) ใช้ชื่อสมมติได้
export default function Setup({ onStart, hasSave, onResume }: { onStart: (players: { name: string; color: string }[], pin: string) => void; hasSave?: boolean; onResume?: () => void }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(TOKEN_COLORS.map((c) => `นักสร้างโลก${c.name}`));
  const [pin, setPin] = useState('');
  return (
    <div className="setup" data-testid="setup">
      <div className="logo">
        <span className="logo-blocks"><i style={{ background: '#d63a2f' }} /><i style={{ background: '#e8a800' }} /><i style={{ background: '#2058b8' }} /></span>
        <h1>BLOCK WORLD</h1>
        <p className="subtitle">อาณาจักรนักสร้างโลกแห่งคำ</p>
        <p className="muted">เกมฝึกการคิดสร้างสรรค์ทางภาษาไทย ป.3 · 3 โซน · 12 ภารกิจตามตารางที่ 2</p>
      </div>
      {hasSave && onResume && <button className="btn accent wide" onClick={onResume}>เล่นต่อจากที่บันทึกไว้</button>}
      <div className="card">
        <h3>จำนวนผู้เล่น</h3>
        <div className="chips">
          {[2, 3, 4].map((n) => <button key={n} className={`chip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)} data-testid={`count-${n}`}>{n} คน</button>)}
        </div>
        {TOKEN_COLORS.slice(0, count).map((c, i) => (
          <label key={c.id} className="player-input">
            <span className="token-dot" style={{ background: c.hex }}>{i + 1}</span>
            <input className="input" value={names[i]} maxLength={24} aria-label={`ชื่อผู้เล่น ${i + 1}`}
              onChange={(e) => setNames(names.map((n, k) => (k === i ? e.target.value : n)))} />
          </label>
        ))}
        <label className="field">
          <span>รหัสโหมดครู (ไม่บังคับ — ถ้าตั้งไว้ ต้องใส่รหัสก่อนรับรองคำตอบหรือเปิดแดชบอร์ด)</span>
          <input className="input" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="เช่น 1234" />
        </label>
        <button className="btn primary wide" data-testid="start" onClick={() => onStart(TOKEN_COLORS.slice(0, count).map((c, i) => ({ name: names[i].trim() || `ผู้เล่น ${i + 1}`, color: c.hex })), pin.trim())}>
          เริ่มผจญภัย ▶
        </button>
      </div>
      <details className="card">
        <summary>องค์ประกอบ 7 อย่างในเกม</summary>
        <ul>{STATIONS.map((s) => <li key={s.id}>{s.icon} <b>{s.name}</b> — {s.role}</li>)}</ul>
      </details>
    </div>
  );
}
