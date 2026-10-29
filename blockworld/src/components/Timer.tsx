import { useEffect, useState } from 'react';
import { timeLeftMs, useGame } from '../store';

/** ตัวนับถอยหลังของภารกิจที่ตารางที่ 2 กำหนดเวลา (ใช้เฉพาะภารกิจที่ระบุ 5 นาที) */
export function Timer({ missionId, minutes }: { missionId: string; minutes: number }) {
  const { game, update } = useGame();
  const [, tick] = useState(0);
  const t = game.timers[missionId];
  const running = !!t?.startedAt;
  useEffect(() => {
    if (!running) return;
    const h = window.setInterval(() => tick((x) => x + 1), 250);
    return () => window.clearInterval(h);
  }, [running]);

  const left = timeLeftMs(game, missionId) ?? minutes * 60000;
  const up = left === 0;
  useEffect(() => {
    if (up && running) update((g) => {
      const tt = g.timers[missionId];
      tt.elapsedMs = tt.durationMs;
      tt.startedAt = null;
    });
  }, [up, running, missionId, update]);

  const start = () => update((g) => {
    const tt = (g.timers[missionId] ??= { durationMs: minutes * 60000, startedAt: null, elapsedMs: 0 });
    if (!tt.startedAt && tt.elapsedMs < tt.durationMs) tt.startedAt = Date.now();
  });
  const pause = () => update((g) => {
    const tt = g.timers[missionId];
    if (tt?.startedAt) { tt.elapsedMs += Date.now() - tt.startedAt; tt.startedAt = null; }
  });
  const reset = () => update((g) => { delete g.timers[missionId]; });

  const s = Math.ceil(left / 1000);
  const pct = left / (minutes * 600);
  return (
    <div className={`timer ${up ? 'up' : ''} ${running ? 'run' : ''}`} data-testid="timer">
      <div className="timer-ring" style={{ ['--pct' as string]: `${pct}%` }}>
        <span>{String(Math.floor(s / 60)).padStart(1, '0')}:{String(s % 60).padStart(2, '0')}</span>
      </div>
      <div className="timer-side">
        <strong>{up ? 'หมดเวลา 5 นาที' : `จับเวลา ${minutes} นาที`}</strong>
        <div className="row">
          {!running && !up && <button className="btn sm" onClick={start}>▶ {t ? 'เดินต่อ' : 'เริ่มจับเวลา'}</button>}
          {running && <button className="btn sm" onClick={pause}>⏸ หยุดชั่วคราว</button>}
          {t && <button className="btn sm ghost" onClick={reset}>↺ เริ่มใหม่</button>}
        </div>
        {up && <small>ประโยคที่บันทึกหลังจากนี้จะมีป้าย "บันทึกหลังหมดเวลา" ให้ครูพิจารณา</small>}
      </div>
    </div>
  );
}
