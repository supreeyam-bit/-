// หน้าเริ่มเกม: เลือกจำนวนผู้เล่น 2–4 คน กรอกชื่อ (ใช้ชื่อสมมติใน demo) เลือกตัวละคร
import { useState } from 'react';
import { CHARACTERS, DEMO_NAMES, PLAYER_COLORS } from '../data/learning';
import { ZONES } from '../data/quests';
import { useGame } from '../game/store';
import { DEFAULT_SETTINGS, newGame, uid } from '../game/rules';
import { RulesModal } from './Panels';
import { SpeakButton } from './ui';

export function Setup() {
  const { replaceState, open } = useGame();
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(DEMO_NAMES);
  const [avatars, setAvatars] = useState(CHARACTERS.slice(0, 4).map((c) => c.avatar));
  const [mode, setMode] = useState<'pin' | 'peer'>('pin');
  const [pin, setPin] = useState(DEFAULT_SETTINGS.pin);
  const [rules, setRules] = useState(false);

  const start = () => {
    const players = Array.from({ length: count }, (_, i) => ({ id: uid('p'), name: names[i].trim() || DEMO_NAMES[i], avatar: avatars[i], color: PLAYER_COLORS[i] }));
    replaceState(newGame(players, { ...DEFAULT_SETTINGS, approvalMode: mode, pin: pin.length >= 4 ? pin : DEFAULT_SETTINGS.pin }));
    open({ type: 'intro' });
  };
  const intro = 'ยินดีต้อนรับสู่ BLOCK WORLD อาณาจักรนักสร้างโลกแห่งคำ ช่วยกันแต่งประโยค ผ่านบอสสามโซน สะสมคริสตัลสามดวง แล้วปลดผนึกหอคอยกลาง';

  return (
    <main className="setup">
      <div className="setup-hero">
        <div className="hero-blocks" aria-hidden="true">🧱🏰🧱</div>
        <h1>BLOCK WORLD</h1>
        <p className="subtitle">อาณาจักรนักสร้างโลกแห่งคำ</p>
        <p>{intro} <SpeakButton text={intro} /></p>
        <div className="zone-strip">
          {ZONES.map((z) => <span key={z.id} style={{ background: z.colors.main }}>{z.landmark[0]} {z.name}</span>)}
          <span style={{ background: '#d4a017' }}>🗼 หอคอยกลาง</span>
        </div>
      </div>

      <section className="setup-card" aria-labelledby="setup-title">
        <h2 id="setup-title">👥 ผู้เล่น (2–4 คน เล่นเป็นทีมเดียวกัน)</h2>
        <div className="count-pick" role="radiogroup" aria-label="จำนวนผู้เล่น">
          {[2, 3, 4].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={count === n} className={`count ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n} คน</button>
          ))}
        </div>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="player-row" style={{ borderColor: PLAYER_COLORS[i] }}>
            <label htmlFor={`name-${i}`}>ผู้เล่น {i + 1}</label>
            <input id={`name-${i}`} value={names[i]} maxLength={20} onChange={(e) => setNames(names.map((n, k) => (k === i ? e.target.value : n)))} />
            <div className="avatar-pick" role="radiogroup" aria-label={`ตัวละครของผู้เล่น ${i + 1}`}>
              {CHARACTERS.map((c) => (
                <button key={c.avatar} type="button" role="radio" aria-checked={avatars[i] === c.avatar} title={c.name} aria-label={c.name}
                  className={`avatar ${avatars[i] === c.avatar ? 'on' : ''}`} onClick={() => setAvatars(avatars.map((a, k) => (k === i ? c.avatar : a)))}>
                  {c.avatar}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="muted small">แนะนำให้ใช้ชื่อเล่นหรือชื่อสมมติ ข้อมูลเก็บในเครื่องนี้เท่านั้น</p>

        <h2>🧑‍🏫 การรับรองผลงาน</h2>
        <label className="agree"><input type="radio" name="mode" checked={mode === 'pin'} onChange={() => setMode('pin')} /> ครู/โค้ชรับรองด้วย PIN (แนะนำ)</label>
        <label className="agree"><input type="radio" name="mode" checked={mode === 'peer'} onChange={() => setMode('peer')} /> เพื่อนทุกคนเห็นพ้อง แล้วครูตรวจย้อนหลังที่แดชบอร์ด</label>
        <label className="agree">PIN ครู (อย่างน้อย 4 หลัก): <input value={pin} size={8} inputMode="numeric" onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} /></label>
        <p className="muted small">PIN เป็นเพียงการแยกโหมดครูกับผู้เล่นแบบง่าย ไม่ใช่ระบบรักษาความปลอดภัย</p>

        <div className="row-actions">
          <button type="button" className="btn ghost" onClick={() => setRules(true)}>📜 วิธีเล่น</button>
          <button type="button" className="btn big" onClick={start}>🚀 เริ่มเกม</button>
        </div>
      </section>
      {rules && <RulesModal onClose={() => setRules(false)} />}
    </main>
  );
}
