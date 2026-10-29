import { useState } from 'react';
import { hasIdea, uid, addLog, type GameState, type Update } from '../store';
import { fmtTime } from '../util';

// ศูนย์แลกเปลี่ยนเรียนรู้: ผลัดกันเสนอไอเดียทีละคน ต่อยอดไอเดียเพื่อนได้ ต้องครบทุกคนก่อนภารกิจจะผ่าน
export default function ExchangePanel({ state, update, missionId, locked }: { state: GameState; update: Update; missionId: string; locked?: boolean }) {
  const ideas = state.ideas[missionId] ?? [];
  const waiting = state.players.filter((p) => !hasIdea(state, missionId, p.id));
  const counts = state.players.map((p) => ideas.filter((i) => i.playerId === p.id).length);
  const min = Math.min(...counts);
  const nextIdx = counts.findIndex((c) => c === min);
  const [who, setWho] = useState<string | null>(null);
  const speaker = state.players.find((p) => p.id === who) ?? state.players[nextIdx];
  const [text, setText] = useState('');
  const [buildsOn, setBuildsOn] = useState('');
  const name = (id: string) => state.players.find((p) => p.id === id)?.name ?? '?';

  const post = () => {
    if (!text.trim()) return;
    const t = text.trim();
    const sp = speaker;
    update((d) => {
      (d.ideas[missionId] ??= []).push({ id: uid(), playerId: sp.id, text: t, at: Date.now(), buildsOn: buildsOn || undefined });
      addLog(d, `${sp.name} เสนอไอเดียในภารกิจ ${missionId}`);
    });
    setText('');
    setBuildsOn('');
    setWho(null);
  };

  return (
    <section className="exchange" data-testid="exchange">
      <h3>💬 ศูนย์แลกเปลี่ยนเรียนรู้</h3>
      <p className="muted">ผลัดกันเสนอไอเดียคนละอย่างน้อย 1 ไอเดีย และต่อยอดความคิดของเพื่อน ก่อนทำภารกิจให้สำเร็จ</p>
      <p className={waiting.length ? 'warn-text' : 'ok-text'}>
        {waiting.length ? `ยังรอไอเดียจาก: ${waiting.map((p) => p.name).join(', ')}` : '✓ ทุกคนเสนอไอเดียแล้ว'}
      </p>
      <ul className="ideas">
        {ideas.map((i) => (
          <li key={i.id}>
            <b>{name(i.playerId)}</b>{i.buildsOn && <span className="muted"> ต่อยอดจาก {name(ideas.find((x) => x.id === i.buildsOn)?.playerId ?? '')}</span>}: {i.text}
            <small className="muted"> · {fmtTime(i.at)}</small>
          </li>
        ))}
      </ul>
      {!locked && (
        <div className="idea-form">
          <div className="row gap wrap">
            <span>ตาของ</span>
            <select className="input" value={speaker.id} onChange={(e) => setWho(e.target.value)} aria-label="ผู้เสนอไอเดีย">
              {state.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {ideas.length > 0 && (
              <select className="input" value={buildsOn} onChange={(e) => setBuildsOn(e.target.value)} aria-label="ต่อยอดจาก">
                <option value="">ไอเดียใหม่</option>
                {ideas.map((i) => <option key={i.id} value={i.id}>ต่อยอด: {name(i.playerId)} – {i.text.slice(0, 24)}</option>)}
              </select>
            )}
          </div>
          <div className="row gap">
            <input className="input grow" placeholder={`ไอเดียของ ${speaker.name}`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && post()} data-testid="idea-input" />
            <button className="btn" onClick={post} disabled={!text.trim()} data-testid="idea-post">เสนอไอเดีย</button>
          </div>
        </div>
      )}
    </section>
  );
}
