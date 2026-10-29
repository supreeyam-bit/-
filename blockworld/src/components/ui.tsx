// ส่วนประกอบ UI ที่ใช้ร่วมกัน
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '../game/store';
import type { CheckResult } from '../game/rules';
import type { BossStatus, MissionStatus, WorkStatus } from '../game/types';

export function Modal({ title, icon, onClose, children, wide, tone }: { title: string; icon?: string; onClose: () => void; children: ReactNode; wide?: boolean; tone?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} style={tone ? { borderTopColor: tone } : undefined}>
        <header className="modal-head">
          <h2>
            {icon && <span aria-hidden="true">{icon} </span>}
            {title}
          </h2>
          <SpeakButton text={title} />
          <button className="icon-btn" onClick={onClose} aria-label="ปิดหน้าต่าง">✕</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({ title, icon, onClose, children }: { title: string; icon: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="drawer-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header className="modal-head">
          <h2>
            <span aria-hidden="true">{icon} </span>
            {title}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="ปิด">✕</button>
        </header>
        <div className="modal-body">{children}</div>
      </aside>
    </div>
  );
}

export function SpeakButton({ text, label }: { text: string; label?: string }) {
  const { say } = useGame();
  return (
    <button type="button" className="speak-btn" onClick={() => say(text)} aria-label={`ฟังเสียงอ่าน: ${label ?? text.slice(0, 40)}`} title="ฟังเสียงอ่าน">
      🔊{label ? ` ${label}` : ''}
    </button>
  );
}

/** ภาพจำลองฉากจากไอคอน (ไม่ต้องใช้บริการภาพภายนอก) */
export function Scene({ icons, caption, tone }: { icons: string[]; caption: string; tone?: string }) {
  return (
    <figure className="scene" style={tone ? { background: `linear-gradient(160deg, ${tone}33, ${tone}11)` } : undefined}>
      <div className="scene-icons" aria-hidden="true">
        {icons.map((ic, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.25}s` }}>{ic}</span>
        ))}
      </div>
      <figcaption>🖼️ {caption}</figcaption>
    </figure>
  );
}

const STATUS: Record<string, { text: string; icon: string; cls: string }> = {
  todo: { text: 'ยังไม่เริ่ม', icon: '⬜', cls: 'st-todo' },
  doing: { text: 'กำลังทำ', icon: '✏️', cls: 'st-doing' },
  draft: { text: 'กำลังทำ', icon: '✏️', cls: 'st-doing' },
  pending: { text: 'รอครูตรวจ', icon: '⏳', cls: 'st-pending' },
  revise: { text: 'ให้ปรับปรุง', icon: '🔁', cls: 'st-revise' },
  done: { text: 'ผ่านแล้ว', icon: '✅', cls: 'st-done' },
  approved: { text: 'ผ่านแล้ว', icon: '✅', cls: 'st-done' },
  saved: { text: 'บันทึกแล้ว', icon: '💾', cls: 'st-done' },
  locked: { text: 'ล็อกอยู่', icon: '🔒', cls: 'st-todo' },
  available: { text: 'ท้าสู้ได้', icon: '⚡', cls: 'st-pending' },
  attempted: { text: 'กำลังสู้', icon: '⚔️', cls: 'st-doing' },
  defeated: { text: 'ชนะแล้ว', icon: '💎', cls: 'st-done' },
};

export function StatusChip({ status }: { status: MissionStatus | WorkStatus | BossStatus }) {
  const s = STATUS[status];
  return (
    <span className={`chip ${s.cls}`}>
      <span aria-hidden="true">{s.icon}</span> {s.text}
    </span>
  );
}

export function Checks({ results, title = 'ระบบช่วยดูเบื้องต้น (เป็นคำแนะนำ ไม่ใช่การตัดสิน)' }: { results: CheckResult[]; title?: string }) {
  if (!results.length) return null;
  return (
    <div className="checks" aria-live="polite">
      <div className="checks-title">🔎 {title}</div>
      <ul>
        {results.map((r, i) => (
          <li key={i} className={r.ok ? 'ok' : 'todo'}>
            <span aria-hidden="true">{r.ok ? '✔️' : '💭'}</span> {r.label}
            {!r.ok && <span className="muted"> — ลองดูอีกครั้งนะ</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Timer({ endsAt, onDone }: { endsAt: number; onDone?: () => void }) {
  const [now, setNow] = useState(Date.now());
  const doneRef = useRef(false);
  useEffect(() => {
    doneRef.current = false;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (!doneRef.current && t >= endsAt) {
        doneRef.current = true;
        onDone?.();
      }
    }, 500);
    return () => clearInterval(id);
  }, [endsAt, onDone]);
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  return (
    <span className={`timer ${left === 0 ? 'done' : ''}`} role="timer">
      ⏱️ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} {left === 0 && '— หมดเวลา'}
    </span>
  );
}

export function Toasts() {
  const { toasts } = useGame();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">{t.text}</div>
      ))}
    </div>
  );
}
