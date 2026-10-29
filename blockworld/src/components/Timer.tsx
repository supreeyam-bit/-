import { useEffect, useRef, useState } from 'react';

// ตัวนับถอยหลังใช้เฉพาะภารกิจที่ตารางที่ 2 ระบุเวลา ทุกคนทำพร้อมกันจึงใช้นาฬิกาเดียว
export default function Timer({ minutes, onTimeUpChange }: { minutes: number; onTimeUpChange: (up: boolean) => void }) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) setRunning(false);
    }, 250);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => onTimeUpChange(left === 0), [left, onTimeUpChange]);

  const start = () => {
    endAt.current = Date.now() + left * 1000;
    setRunning(true);
  };
  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <div className={`timer ${left === 0 ? 'up' : left <= 30 ? 'low' : ''}`} data-testid="timer">
      <div className="timer-face" aria-live="polite">
        ⏱️ {mm}:{ss}
      </div>
      <div className="timer-bar"><span style={{ width: `${(left / total) * 100}%` }} /></div>
      <div className="row gap">
        {!running && left > 0 && <button className="btn small primary" onClick={start}>{left === total ? `เริ่มจับเวลา ${minutes} นาที` : 'จับเวลาต่อ'}</button>}
        {running && <button className="btn small" onClick={() => setRunning(false)}>หยุดชั่วคราว</button>}
        <button className="btn small ghost" onClick={() => { setRunning(false); setLeft(total); }}>เริ่มใหม่</button>
      </div>
      {left === 0 && <p className="timer-msg">หมดเวลา {minutes} นาทีแล้ว — ประโยคที่บันทึกหลังจากนี้จะมีป้าย "หลังหมดเวลา"</p>}
    </div>
  );
}
