import { useState } from 'react';
import { SITUATIONS, areaInfo, missionById } from '../data';
import { getWork, ideasShared, logEvent, missionUnlocked, readWork, useGame } from '../store';
import { CoachPanel } from './Coach';
import { ExchangePanel } from './Exchange';
import { HelpPanel } from './Help';
import { Timer } from './Timer';
import { Modal, SituationArt, StatusBadge } from './ui';
import { WorkEditor, countEntries } from './WorkEditor';

type Tab = 'work' | 'exchange' | 'help' | 'coach';

export function MissionPanel({ missionId, onClose, startTab = 'work' }: { missionId: string; onClose: () => void; startTab?: Tab }) {
  const { game, update, teacher } = useGame();
  const m = missionById(missionId);
  const area = areaInfo(m.area_en);
  const sit = SITUATIONS.find((s) => s.area_en === m.area_en)!;
  const [tab, setTab] = useState<Tab>(startTab);
  const [pid, setPid] = useState(game.players[game.current]?.id ?? game.players[0]?.id);
  const unlocked = missionUnlocked(game, m.zone) || teacher;
  const w = readWork(game, missionId, pid);
  const player = game.players.find((p) => p.id === pid);

  const submit = () => update((g) => {
    const ww = getWork(g, missionId, pid);
    ww.status = 'submitted';
    ww.submittedAt = Date.now();
    logEvent(g, `${player?.name} ส่งชิ้นงาน ${m.zone_name} · ${m.area} ให้ครูตรวจ`);
  });

  return (
    <Modal wide onClose={onClose} icon="🧩" title={<>การ์ดภารกิจ · โซน {m.zone} {m.zone_name} · <span style={{ color: area.color }}>{area.shape} {m.area}</span></>}>
      <div className="mission-top">
        <SituationArt area={m.area_en} title={sit.title} />
        <div className="mission-text">
          <div className="mission-meta">
            <span className="chip">สถานการณ์ปัญหา: {sit.title}</span>
            <span className="chip">ตัวชี้วัด {m.indicator}</span>
            {game.completed[missionId] && <span className="badge st-ok">ภารกิจสำเร็จ</span>}
          </div>
          <blockquote className="instruction" data-testid="instruction">{m.instruction_exact_from_table_2}</blockquote>
          <small className="muted">ข้อความคำสั่งตามตารางที่ 2 · {sit.description}</small>
          {m.timed_minutes && unlocked && <Timer missionId={missionId} minutes={m.timed_minutes} />}
        </div>
      </div>

      {!unlocked ? (
        <p className="note warn">🔒 ภารกิจนี้อยู่ในโซน {m.zone_name} จะเปิดเมื่อทีมได้รับคริสตัลของโซนก่อนหน้า (ครูเปิดดูได้ในโหมดครู)</p>
      ) : (
        <>
          <div className="tabs" role="tablist">
            {([['work', '✏️ ชิ้นงานรายบุคคล'], ['exchange', `💬 ศูนย์แลกเปลี่ยนเรียนรู้${ideasShared(game, missionId) ? ' ✓' : ''}`], ['help', '🛟 ฐานการช่วยเหลือ'], ['coach', '🧑‍🏫 การโค้ช']] as [Tab, string][]).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          {tab === 'work' && (
            <>
              <div className="player-tabs">
                {game.players.map((p) => (
                  <button key={p.id} className={`ptab ${p.id === pid ? 'on' : ''}`} style={{ ['--pc' as string]: p.color }} onClick={() => setPid(p.id)}>
                    {p.token} {p.name} <StatusBadge status={readWork(game, missionId, p.id).status} />
                  </button>
                ))}
              </div>
              <p className="muted">ส่งเครื่องให้ <b style={{ color: player?.color }}>{player?.name}</b> ทำชิ้นงานของตนเอง ชิ้นงานแต่ละคนเก็บแยกกัน</p>
              {w.status === 'revise' && <p className="note warn">ครูให้ปรับปรุง: {game.coachLog.find((l) => l.missionId === missionId && l.playerId === pid && l.action === 'revise')?.text || 'ดูข้อสังเกตในแท็บการโค้ช'}</p>}
              <WorkEditor key={pid} missionId={missionId} playerId={pid} />
              <div className="submit-bar">
                <span>{countEntries(w)} ชิ้นในงานนี้ · สถานะ <StatusBadge status={w.status} /></span>
                <button className="btn primary" disabled={countEntries(w) === 0 || w.status === 'submitted' || w.status === 'approved'} onClick={submit}>📨 ส่งให้ครู/โค้ชตรวจ</button>
              </div>
            </>
          )}
          {tab === 'exchange' && <ExchangePanel missionId={missionId} />}
          {tab === 'help' && <HelpPanel missionId={missionId} playerId={pid} />}
          {tab === 'coach' && <CoachPanel missionId={missionId} />}
        </>
      )}
    </Modal>
  );
}
