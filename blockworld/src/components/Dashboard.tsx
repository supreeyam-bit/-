import { useRef } from 'react';
import { HELP_TYPES } from '../content';
import { MISSIONS } from '../data';
import { crystals, getWork, hasIdea, missionPassed, type GameState } from '../store';
import { download, fmtTime } from '../util';

const ICON = { draft: '·', submitted: '📤', approved: '✅', revise: '↺' } as const;

export function toCSV(s: GameState) {
  const head = ['player', 'mission_id', 'zone', 'zone_name', 'area', 'indicator', 'entry_no', 'text', 'before', 'tags', 'audience', 'expanded_parts', 'explanation', 'self_check', 'after_time_limit', 'saved_at', 'work_status', 'teacher_comment', 'teacher_notes', 'drawings', 'overall_explanation', 'ideas', 'help_opened'];
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows: string[] = [head.join(',')];
  for (const p of s.players) {
    for (const m of MISSIONS) {
      const w = getWork(s, m.id, p.id);
      const ideas = (s.ideas[m.id] ?? []).filter((i) => i.playerId === p.id).map((i) => i.text).join(' | ');
      const help = s.help.filter((h) => h.playerId === p.id && h.missionId === m.id).map((h) => h.type).join(' | ');
      const base = [p.name, m.id, m.zone, m.zone_name, m.area, m.indicator];
      const tail = [w.status, w.teacherComment, w.notes.map((n) => n.text).join(' | '), w.drawings.length, w.explanation, ideas, help];
      const list = w.entries.length ? w.entries : [null];
      list.forEach((e, i) => {
        rows.push([...base, e ? i + 1 : '', e?.text, e?.before, e?.tags.join(' | '), e?.audience, e?.parts.join(' | '), e?.explanation, e?.selfCheck.join(' | '), e?.timeUp ? 'yes' : '', e ? new Date(e.at).toISOString() : '', ...tail].map(q).join(','));
      });
    }
  }
  return '﻿' + rows.join('\r\n');
}

// แดชบอร์ดครู: ความคืบหน้า ความช่วยเหลือ ข้อสังเกต และส่งออกข้อมูล (เก็บในเครื่องเป็นค่าเริ่มต้น)
export default function Dashboard({ state, onImport, onReset, onMission }: {
  state: GameState; onImport: (s: GameState) => void; onReset: () => void; onMission: (id: string) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const notes = MISSIONS.flatMap((m) => state.players.flatMap((p) => getWork(state, m.id, p.id).notes.map((n) => ({ m, p, n }))));

  return (
    <div className="dashboard" data-testid="dashboard">
      <h2>📊 แดชบอร์ดครู</h2>
      <p className="muted">ข้อมูลทั้งหมดเก็บในเครื่องนี้ (localStorage) ส่งออกเป็น JSON หรือ CSV เพื่อเก็บสำรองหรือวิเคราะห์ต่อ · เกมนี้เป็นกิจกรรมฝึก ไม่ใช่แบบทดสอบที่ผ่านการตรวจสอบคุณภาพ</p>
      <div className="stats">
        <div><b>{state.players.length}</b><small>ผู้เล่น</small></div>
        <div><b>โซน {state.zone}</b><small>โซนปัจจุบัน</small></div>
        <div><b>{MISSIONS.filter((m) => missionPassed(state, m.id)).length}/12</b><small>ภารกิจที่ทีมผ่าน</small></div>
        <div><b>{crystals(state)}/3</b><small>คริสตัล</small></div>
      </div>

      <div className="row gap wrap">
        <button className="btn primary" data-testid="export-json" onClick={() => download(`blockworld-${stamp}.json`, JSON.stringify(state, null, 2))}>⬇ ส่งออก JSON</button>
        <button className="btn primary" data-testid="export-csv" onClick={() => download(`blockworld-${stamp}.csv`, toCSV(state), 'text/csv;charset=utf-8')}>⬇ ส่งออก CSV</button>
        <button className="btn" onClick={() => file.current?.click()}>⬆ นำเข้า JSON</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const s = JSON.parse(await f.text()) as GameState;
            if (s.version !== 1 || !Array.isArray(s.players)) throw new Error();
            onImport(s);
          } catch {
            alert('ไฟล์ไม่ถูกต้อง');
          }
          e.target.value = '';
        }} />
        <button className="btn ghost danger" onClick={() => confirm('ลบข้อมูลเกมทั้งหมดในเครื่องนี้และเริ่มใหม่? (ควรส่งออก JSON ก่อน)') && onReset()}>เริ่มเกมใหม่</button>
      </div>

      <h3>ผลงาน 12 ภารกิจ</h3>
      <div className="table-scroll">
        <table className="progress" data-testid="progress-table">
          <thead>
            <tr>
              <th>ผู้เล่น</th>
              {MISSIONS.map((m) => <th key={m.id}><button className="linklike" onClick={() => onMission(m.id)} title={`${m.zone_name} · ${m.area}`}>Z{m.zone}<br />{m.area_id}</button></th>)}
            </tr>
          </thead>
          <tbody>
            {state.players.map((p) => (
              <tr key={p.id}>
                <td><span className="dot" style={{ background: p.color }} /> {p.name}</td>
                {MISSIONS.map((m) => {
                  const w = getWork(state, m.id, p.id);
                  return (
                    <td key={m.id} className={`st-${w.status}`} title={`${w.entries.length} ประโยค, ${w.drawings.length} ภาพ`}>
                      {ICON[w.status]}<small>{w.entries.length || ''}{hasIdea(state, m.id, p.id) ? '💬' : ''}</small>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="team-row">
              <td>ทีมผ่าน</td>
              {MISSIONS.map((m) => <td key={m.id}>{missionPassed(state, m.id) ? '✓' : ''}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="muted small">· กำลังทำ 📤 ส่งแล้ว ✅ รับรองแล้ว ↺ ให้ปรับปรุง · ตัวเลข = จำนวนประโยค · 💬 เสนอไอเดียแล้ว</p>

      <h3>การใช้ฐานการช่วยเหลือ</h3>
      <div className="table-scroll">
        <table className="progress">
          <thead><tr><th>ผู้เล่น</th>{HELP_TYPES.map((h) => <th key={h.id}>{h.name}</th>)}<th>ครูแนะนำ</th></tr></thead>
          <tbody>
            {state.players.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                {HELP_TYPES.map((h) => <td key={h.id}>{state.help.filter((x) => x.playerId === p.id && x.type === h.id).length}</td>)}
                <td>{state.help.filter((x) => x.playerId === p.id && x.type === 'teacher').length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>ข้อสังเกตของครู ({notes.length})</h3>
      <ul className="notes">{notes.map(({ m, p, n }, i) => <li key={i}><b>{p.name}</b> · {m.id} {m.area}: {n.text} <small className="muted">{fmtTime(n.at)}</small></li>)}</ul>

      <h3>บันทึกเหตุการณ์</h3>
      <ul className="log">{state.log.slice(0, 40).map((l, i) => <li key={i}><small className="muted">{fmtTime(l.at)}</small> {l.text}</li>)}</ul>
    </div>
  );
}
