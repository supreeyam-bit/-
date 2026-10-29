import { useState } from 'react';
import { HELP, HELP_KINDS, missionById } from '../data';
import { logHelp, useGame } from '../store';
import type { HelpKind } from '../types';

/** ฐานการช่วยเหลือ 4 แบบ เปิดได้ตลอด ไม่หักคะแนน และครูเพิ่มคำแนะนำได้ */
export function HelpPanel({ missionId, playerId }: { missionId?: string; playerId?: string }) {
  const { game, update, teacher } = useGame();
  const zone = missionId ? missionById(missionId).zone : Math.min(game.zone, 3);
  const area = missionId ? missionById(missionId).area_en : null;
  const [open, setOpen] = useState<HelpKind | null>(null);
  const [who, setWho] = useState(playerId ?? game.players[0]?.id ?? '');
  const [tip, setTip] = useState('');

  const content = (k: HelpKind): string[] => {
    if (k === 'Procedural') return HELP.Procedural[0];
    if (k === 'Strategic') return area ? HELP.Strategic[area] : Object.values(HELP.Strategic).flat();
    return HELP[k][zone] ?? [];
  };
  const openKind = (k: HelpKind) => {
    setOpen(k);
    update((g) => logHelp(g, k, who || null, missionId ?? null));
  };
  const teacherTips = game.helpLog.filter((h) => h.kind === 'Teacher' && (!missionId || h.missionId === missionId));

  return (
    <div className="help">
      <p className="note">เปิดดูได้ทุกเวลา <b>ไม่หักคะแนน</b> ระบบบันทึกเพียงว่าใช้ความช่วยเหลือแบบใด เพื่อให้ครูช่วยได้ตรงจุด</p>
      {game.players.length > 0 && (
        <div className="row"><span>ผู้ขอความช่วยเหลือ</span>
          <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="ผู้ขอความช่วยเหลือ">{game.players.map((p) => <option key={p.id} value={p.id}>{p.token} {p.name}</option>)}</select>
        </div>
      )}
      <div className="help-grid">
        {HELP_KINDS.map((h) => (
          <button key={h.id} className={`help-card ${open === h.id ? 'on' : ''}`} onClick={() => openKind(h.id)}>
            <span className="help-icon">{h.icon}</span><b>{h.id}</b><small>{h.th}</small>
          </button>
        ))}
      </div>
      {open && (
        <div className="help-body" data-testid="help-body">
          <h4>{HELP_KINDS.find((h) => h.id === open)?.icon} {open}</h4>
          <ul>{content(open).map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
      {teacherTips.length > 0 && (
        <div className="teacher-tips"><h4>🧑‍🏫 คำแนะนำจากครู</h4>
          <ul>{teacherTips.map((t) => <li key={t.id}><b>{game.players.find((p) => p.id === t.playerId)?.name ?? 'ทุกคน'}:</b> {t.text}</li>)}</ul>
        </div>
      )}
      {teacher && (
        <form className="free-row teacher-only" onSubmit={(e) => { e.preventDefault(); if (!tip.trim()) return; update((g) => logHelp(g, 'Teacher', who || null, missionId ?? null, tip.trim())); setTip(''); }}>
          <input value={tip} onChange={(e) => setTip(e.target.value)} placeholder="ครูพิมพ์คำแนะนำให้ผู้เล่นที่เลือก (ไม่หักคะแนน)" aria-label="คำแนะนำจากครู" />
          <button className="btn sm">ให้คำแนะนำ</button>
        </form>
      )}
    </div>
  );
}
