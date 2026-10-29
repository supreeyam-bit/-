import { useState } from 'react';
import { HELP_BY_AREA, HELP_TYPES } from '../content';
import { TEMPLATES, type Mission } from '../data';
import { addLog, type GameState, type Update } from '../store';

// ฐานการช่วยเหลือ 4 แบบ เปิดได้ตลอด ไม่มีการหักคะแนน ระบบบันทึกเพียงว่าใครเปิดความช่วยเหลือแบบไหน
export default function HelpBase({ state, update, mission, playerId }: { state: GameState; update: Update; mission?: Mission; playerId?: string }) {
  const [who, setWho] = useState(playerId ?? state.players[0].id);
  const [open, setOpen] = useState<string | null>(null);
  const [teacherText, setTeacherText] = useState('');

  const openType = (id: string) => {
    setOpen(id);
    update((d) => {
      d.help.push({ playerId: who, missionId: mission?.id, type: id, at: Date.now() });
      addLog(d, `${d.players.find((p) => p.id === who)?.name} เปิดฐานการช่วยเหลือแบบ ${id}`);
    });
  };
  const t = HELP_TYPES.find((h) => h.id === open);
  const extra = t && mission ? HELP_BY_AREA[mission.area_id]?.[t.id] ?? [] : [];

  return (
    <div className="helpbase" data-testid="helpbase">
      <p className="muted">🛟 ฐานการช่วยเหลือเปิดได้ตลอด ไม่หักคะแนน</p>
      <div className="row gap wrap">
        <span>ผู้ขอความช่วยเหลือ</span>
        <select className="input" value={who} onChange={(e) => setWho(e.target.value)}>
          {state.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="help-grid">
        {HELP_TYPES.map((h) => (
          <button key={h.id} className={`help-card ${open === h.id ? 'on' : ''}`} onClick={() => openType(h.id)}>
            <span className="big">{h.icon}</span>
            <b>{h.name}</b>
            <small>{h.th}</small>
          </button>
        ))}
      </div>
      {t && (
        <div className="help-body">
          <h4>{t.icon} {t.name} · {t.th}</h4>
          <ul>{[...extra, ...t.general].map((x) => <li key={x}>{x}</li>)}</ul>
          {t.id === 'conceptual' && (
            <div className="templates">
              {TEMPLATES.map((tp) => (
                <details key={tp.id}>
                  <summary>ประโยค{tp.name} <small className="muted">คำสังเกต: {tp.cue}</small></summary>
                  <p>{tp.about}</p>
                  <p className="pattern">{tp.pattern}</p>
                  <p className="muted">{tp.example}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
      <details className="teacher-hint">
        <summary>ครูให้คำแนะนำ (ไม่หักคะแนน)</summary>
        <div className="row gap">
          <input className="input grow" value={teacherText} onChange={(e) => setTeacherText(e.target.value)} placeholder="คำแนะนำจากครู" />
          <button className="btn small" disabled={!teacherText.trim()} onClick={() => {
            const text = teacherText.trim();
            update((d) => { d.help.push({ playerId: who, missionId: mission?.id, type: 'teacher', by: 'teacher', text, at: Date.now() }); });
            setTeacherText('');
          }}>บันทึกคำแนะนำ</button>
        </div>
        <ul>{state.help.filter((h) => h.by === 'teacher' && h.playerId === who && (!mission || h.missionId === mission.id)).map((h, i) => <li key={i}>🦉 {h.text}</li>)}</ul>
      </details>
    </div>
  );
}
