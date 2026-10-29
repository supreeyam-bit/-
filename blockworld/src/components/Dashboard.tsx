import { useState } from 'react';
import { MISSIONS, ZONES, areaInfo, missionById } from '../data';
import { STORAGE_KEY, newGame, readWork, useGame } from '../store';
import type { GameState } from '../types';
import { StatusBadge, fmtTime } from './ui';
import { WorkEditor, countEntries } from './WorkEditor';

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const toCsv = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function worksCsv(g: GameState) {
  const rows: unknown[][] = [['ผู้เล่น', 'โซน', 'ด้าน', 'รหัสภารกิจ', 'ตัวชี้วัด', 'สถานะ', 'ช่องคำตอบ', 'ฉบับก่อน', 'คำตอบ (ฉบับล่าสุด)', 'ประวัติฉบับก่อนหน้า', 'ข้อมูลเพิ่มเติม', 'เวลา']];
  for (const m of MISSIONS) for (const p of g.players) {
    const w = readWork(g, m.id, p.id);
    for (const [key, list] of Object.entries(w.items)) for (const e of list) {
      const { before, ...meta } = e.meta ?? {};
      rows.push([p.name, m.zone_name, m.area, m.id, m.indicator, w.status, key, before ?? '', e.text, e.history.map((h) => h.text).join(' | '), Object.values(meta).join(' | '), fmtTime(e.at)]);
    }
    for (const key of Object.keys(w.drawings)) rows.push([p.name, m.zone_name, m.area, m.id, m.indicator, w.status, `ภาพวาด:${key}`, '', '(ภาพ PNG อยู่ในไฟล์ JSON)', '', '', '']);
    for (const [key, v] of Object.entries(w.checks)) if (v) rows.push([p.name, m.zone_name, m.area, m.id, m.indicator, w.status, `ตรวจตนเอง:${key}`, '', '✓', '', '', '']);
  }
  return toCsv(rows);
}

export function Dashboard() {
  const { game, update } = useGame();
  const [tab, setTab] = useState<'progress' | 'works' | 'help' | 'coach' | 'export'>('progress');
  const [sel, setSel] = useState({ m: MISSIONS[0].id, p: game.players[0]?.id ?? '' });
  const pname = (id: string | null) => game.players.find((p) => p.id === id)?.name ?? '—';
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

  const importJson = (file: File) => file.text().then((t) => {
    try {
      const g = JSON.parse(t) as GameState;
      if (g.version !== 3 || !Array.isArray(g.players)) throw new Error();
      if (confirm('นำเข้าข้อมูลนี้แทนข้อมูลปัจจุบันในเครื่อง?')) update((s) => Object.assign(s, newGame(), g));
    } catch { alert('ไฟล์นี้ไม่ใช่ข้อมูล BLOCK WORLD'); }
  });

  return (
    <div className="dashboard">
      <div className="tabs">
        {([['progress', '📊 ความคืบหน้า'], ['works', '📂 ผลงาน 12 ภารกิจ'], ['help', '🛟 ความช่วยเหลือ'], ['coach', '🧑‍🏫 บันทึกการโค้ช'], ['export', '⬇️ ส่งออก/นำเข้า']] as const).map(([id, l]) => (
          <button key={id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>{l}</button>
        ))}
      </div>

      {tab === 'progress' && (
        <div className="scroll-x">
          <table className="table progress">
            <thead>
              <tr><th rowSpan={2}>ผู้เล่น</th>{ZONES.map((z) => <th key={z.id} colSpan={4}>โซน {z.id} {z.name}</th>)}<th rowSpan={2}>ช่วยเหลือ</th></tr>
              <tr>{MISSIONS.map((m) => <th key={m.id} title={m.area}>{areaInfo(m.area_en).shape}</th>)}</tr>
            </thead>
            <tbody>
              {game.players.map((p) => (
                <tr key={p.id}>
                  <th style={{ color: p.color }}>{p.token} {p.name}</th>
                  {MISSIONS.map((m) => {
                    const w = readWork(game, m.id, p.id);
                    return <td key={m.id}><button className="cell" onClick={() => { setSel({ m: m.id, p: p.id }); setTab('works'); }}><StatusBadge status={w.status} /><small>{countEntries(w)}</small></button></td>;
                  })}
                  <td>{game.helpLog.filter((h) => h.playerId === p.id).length}</td>
                </tr>
              ))}
              <tr><th>ภารกิจสำเร็จ</th>{MISSIONS.map((m) => <td key={m.id}>{game.completed[m.id] ? '✅' : '—'}</td>)}<td /></tr>
            </tbody>
          </table>
          <p className="muted">● คล่อง ■ ยืดหยุ่น ▲ ริเริ่ม ⬢ ละเอียดลออ · ตัวเลข = จำนวนชิ้นคำตอบ (ข้อมูลประกอบ ไม่ใช่คะแนน)</p>
        </div>
      )}

      {tab === 'works' && (
        <div>
          <div className="row">
            <select value={sel.m} onChange={(e) => setSel({ ...sel, m: e.target.value })} aria-label="ภารกิจ">
              {MISSIONS.map((m) => <option key={m.id} value={m.id}>{m.id} · {m.zone_name} · {m.area}</option>)}
            </select>
            <select value={sel.p} onChange={(e) => setSel({ ...sel, p: e.target.value })} aria-label="ผู้เล่น">
              {game.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <StatusBadge status={readWork(game, sel.m, sel.p).status} />
          </div>
          <blockquote className="instruction small">{missionById(sel.m).instruction_exact_from_table_2}</blockquote>
          {sel.p && <WorkEditor key={sel.m + sel.p} missionId={sel.m} playerId={sel.p} readOnly />}
        </div>
      )}

      {tab === 'help' && (
        <table className="table">
          <thead><tr><th>เวลา</th><th>ผู้เล่น</th><th>โซน</th><th>ภารกิจ</th><th>ประเภท</th><th>ข้อความครู</th></tr></thead>
          <tbody>{game.helpLog.map((h) => (
            <tr key={h.id}><td>{fmtTime(h.at)}</td><td>{pname(h.playerId)}</td><td>{h.zone}</td><td>{h.missionId ? missionById(h.missionId).area : '—'}</td><td>{h.kind}</td><td>{h.text ?? ''}</td></tr>
          ))}</tbody>
        </table>
      )}

      {tab === 'coach' && (
        <table className="table">
          <thead><tr><th>เวลา</th><th>ผู้เล่น</th><th>ภารกิจ</th><th>การโค้ช</th><th>ข้อสังเกต</th></tr></thead>
          <tbody>{game.coachLog.map((c) => (
            <tr key={c.id}><td>{fmtTime(c.at)}</td><td>{pname(c.playerId)}</td><td>{missionById(c.missionId).zone_name} · {missionById(c.missionId).area}</td>
              <td>{c.action === 'approve' ? 'รับรองคำตอบ' : c.action === 'revise' ? 'ให้ปรับปรุง' : 'บันทึกข้อสังเกต'}</td><td>{c.text ?? ''}</td></tr>
          ))}</tbody>
        </table>
      )}

      {tab === 'export' && (
        <div className="export">
          <p>ข้อมูลทั้งหมดเก็บในเบราว์เซอร์ของเครื่องนี้ (localStorage) โดยค่าเริ่มต้น ไม่ส่งออกไปที่ใด จนกว่าครูจะกดส่งออกไฟล์</p>
          <div className="row wrap">
            <button className="btn primary" onClick={() => download(`blockworld-${stamp}.json`, JSON.stringify(game, null, 2), 'application/json')}>⬇️ JSON (ข้อมูลทั้งหมด รวมภาพวาด)</button>
            <button className="btn" onClick={() => download(`blockworld-works-${stamp}.csv`, worksCsv(game), 'text/csv')}>⬇️ CSV ผลงาน</button>
            <button className="btn" onClick={() => download(`blockworld-help-${stamp}.csv`, toCsv([['เวลา', 'ผู้เล่น', 'โซน', 'ภารกิจ', 'ประเภท', 'ข้อความครู'], ...game.helpLog.map((h) => [fmtTime(h.at), pname(h.playerId), h.zone, h.missionId ?? '', h.kind, h.text ?? ''])]), 'text/csv')}>⬇️ CSV ความช่วยเหลือ</button>
            <button className="btn" onClick={() => download(`blockworld-coach-${stamp}.csv`, toCsv([['เวลา', 'ผู้เล่น', 'ภารกิจ', 'การโค้ช', 'ข้อสังเกต'], ...game.coachLog.map((c) => [fmtTime(c.at), pname(c.playerId), c.missionId, c.action, c.text ?? ''])]), 'text/csv')}>⬇️ CSV การโค้ช</button>
            <button className="btn" onClick={() => download(`blockworld-exchange-${stamp}.csv`, toCsv([['เวลา', 'ผู้เล่น', 'ภารกิจ', 'ชนิด', 'ข้อความ'], ...Object.entries(game.exchange).flatMap(([mid, list]) => list.map((x) => [fmtTime(x.at), pname(x.playerId), mid, x.kind === 'idea' ? 'ไอเดีย' : 'ความเห็น', x.text]))]), 'text/csv')}>⬇️ CSV การแลกเปลี่ยน</button>
            <button className="btn" onClick={() => download(`blockworld-reflection-${stamp}.csv`, toCsv([['ผู้เล่น', 'ด้าน', 'สะท้อนคิด'], ...Object.entries(game.reflections).flatMap(([pid, r]) => Object.entries(r).map(([a, t]) => [pname(pid), a, t]))]), 'text/csv')}>⬇️ CSV สะท้อนคิด</button>
          </div>
          <h4>นำเข้า JSON</h4>
          <input type="file" accept="application/json,.json" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} aria-label="นำเข้า JSON" />
          <h4>ล้างข้อมูล</h4>
          <button className="btn warn" onClick={() => { if (confirm('ลบข้อมูลเกมทั้งหมดในเครื่องนี้? (ควรส่งออก JSON ก่อน)')) { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ไม่มีที่เก็บ */ } update((s) => Object.assign(s, newGame())); } }}>🗑 เริ่มเกมใหม่ (ลบข้อมูล)</button>
          <p className="muted">เกมนี้เป็นกิจกรรมฝึก ไม่ใช่แบบทดสอบที่ผ่านการตรวจสอบคุณภาพ ผลในแดชบอร์ดเป็นข้อมูลประกอบการตัดสินใจของครู</p>
        </div>
      )}
    </div>
  );
}
