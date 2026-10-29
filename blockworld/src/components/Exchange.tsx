import { useState } from 'react';
import { missionById } from '../data';
import { ideasShared, logEvent, refreshCompletion, uid, useGame } from '../store';

const STEMS = ['ฉันชอบไอเดียของเพื่อนตรงที่…', 'ลองเพิ่ม…ดีไหม', 'ถ้าเปลี่ยน…จะเป็นอย่างไร', 'ไอเดียของฉันต่อจากเพื่อนคือ…'];

/** ศูนย์แลกเปลี่ยนเรียนรู้: ผลัดกันเสนอไอเดียตามลำดับ และให้ความเห็นต่อไอเดียเพื่อน */
export function ExchangePanel({ missionId }: { missionId: string }) {
  const { game, update } = useGame();
  const msgs = game.exchange[missionId] ?? [];
  const ideas = msgs.filter((m) => m.kind === 'idea');
  const turn = game.players[ideas.length % game.players.length];
  const [text, setText] = useState('');
  const [fbFrom, setFbFrom] = useState(game.players[0]?.id ?? '');
  const [fb, setFb] = useState('');
  const pname = (id: string) => game.players.find((p) => p.id === id);

  const post = (playerId: string, kind: 'idea' | 'feedback', t: string) => update((g) => {
    (g.exchange[missionId] ??= []).push({ id: uid(), playerId, kind, text: t, at: Date.now() });
    if (kind === 'idea') logEvent(g, `${pname(playerId)?.name} เสนอไอเดียในภารกิจ ${missionById(missionId).area} (${missionById(missionId).zone_name})`);
    refreshCompletion(g, missionId);
  });

  return (
    <div className="exchange">
      <div className={`exchange-status ${ideasShared(game, missionId) ? 'ok' : ''}`}>
        {game.players.map((p) => (
          <span key={p.id} className="pill" style={{ borderColor: p.color }}>
            {p.token} {p.name} {ideas.some((m) => m.playerId === p.id) ? '✓ เสนอแล้ว' : '…ยังไม่เสนอ'}
          </span>
        ))}
        <small>ทุกคนต้องเสนอไอเดียอย่างน้อย 1 ครั้งก่อนภารกิจจะสำเร็จ</small>
      </div>

      <div className="turn-box" style={{ borderColor: turn?.color }}>
        <div className="turn-who">ตาเสนอไอเดีย: <b style={{ color: turn?.color }}>{turn?.token} {turn?.name}</b></div>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="ไอเดียของฉันคือ…" aria-label="ไอเดีย" />
        <div className="row end"><button className="btn primary" disabled={!text.trim() || !turn} onClick={() => { post(turn.id, 'idea', text.trim()); setText(''); }}>💡 เสนอไอเดีย แล้วส่งต่อเพื่อน</button></div>
      </div>

      <div className="feedback-box">
        <div className="row"><span>ให้ความเห็นโดย</span>
          <select value={fbFrom} onChange={(e) => setFbFrom(e.target.value)} aria-label="ผู้ให้ความเห็น">{game.players.map((p) => <option key={p.id} value={p.id}>{p.token} {p.name}</option>)}</select>
        </div>
        <div className="chips">{STEMS.map((s) => <button key={s} className="chip-btn" onClick={() => setFb(s)}>{s}</button>)}</div>
        <div className="free-row">
          <input value={fb} onChange={(e) => setFb(e.target.value)} placeholder="ความเห็นต่อไอเดียเพื่อน" aria-label="ความเห็น" />
          <button className="btn sm" disabled={!fb.trim()} onClick={() => { post(fbFrom, 'feedback', fb.trim()); setFb(''); }}>💬 ส่งความเห็น</button>
        </div>
      </div>

      <ol className="msgs">
        {msgs.map((m) => {
          const p = pname(m.playerId);
          return <li key={m.id} className={`msg ${m.kind}`} style={{ borderColor: p?.color }}><b>{p?.token} {p?.name}</b> <span className="chip">{m.kind === 'idea' ? 'ไอเดีย' : 'ความเห็น'}</span> {m.text}</li>;
        })}
      </ol>
    </div>
  );
}
