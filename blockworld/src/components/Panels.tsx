// หน้าต่างย่อย: ผลของช่อง กติกา เรื่องนำ สถานการณ์ปัญหา เครื่องมือ ศูนย์แลกเปลี่ยน ประวัติผลงาน เมือง และฉากจบ
import { useState } from 'react';
import { BUILDINGS, CREATIVE_CARDS, REST_QUESTIONS, RULES_TEXT, SPACE_INFO, TAG_NAMES, WORD_CARDS } from '../data/learning';
import { QUESTS, ZONES, words } from '../data/quests';
import { useStarted } from '../game/store';
import { activePlayer, addLog, addOnce, createWork, playerName, setAnswer, commitAnswers, updateWork } from '../game/rules';
import type { GameState, SpaceKind } from '../game/types';
import { SentenceBuilder } from './SentenceBuilder';
import { Modal, Scene, SpeakButton, StatusChip } from './ui';
import { openWorkModal } from './Coach';

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** บันทึกผลงานสั้น (ช่องคำ ช่องสร้างสรรค์ ช่องพัก) ที่ไม่ต้องรอครูรับรอง */
function saveQuick(s: GameState, kind: 'word' | 'creative' | 'rest', title: string, text: string, tags: ('F' | 'FL' | 'O' | 'E')[] = []): GameState {
  const [s2, id] = createWork(s, { kind, refId: kind, title, zone: s.zone, creativityTags: tags, status: 'saved' });
  return updateWork(s2, id, (w) => ({ ...commitAnswers(setAnswer(w, 'answer', text, activePlayer(s).id), activePlayer(s).id), endedAt: Date.now() }));
}

export function SpaceModal({ kind }: { kind: SpaceKind }) {
  const { state, setState, close, open, toast } = useStarted();
  const info = SPACE_INFO[kind];
  const zone = state.zone;
  const [word] = useState(() => pick(WORD_CARDS[zone]));
  const [card] = useState(() => pick(CREATIVE_CARDS[zone]));
  const [question] = useState(() => pick(REST_QUESTIONS));
  const [text, setText] = useState('');
  const me = activePlayer(state);
  const done = (msg: string) => { toast(msg); close(); };

  return (
    <Modal title={`${me.name} ตกช่อง${info.name.replace('ช่อง', '')}`} icon={info.icon} onClose={close} tone={info.color}>
      <p>{info.desc} <SpeakButton text={info.desc} /></p>
      {kind === 'word' && (
        <div>
          <div className="word-cards"><span className="word-card big">🔤 {word}</span></div>
          <p>แต่งประโยคสั้น ๆ ที่มีคำว่า “{word}” แล้วคำนี้จะเข้าคลังคำของทีม ใช้ในเครื่องมือเรียงบล็อกคำได้</p>
          <SentenceBuilder words={[{ text: word, role: 'other' }, ...words('S:ฉัน|S:เพื่อน|V:เห็น|V:ชอบ|M:ทุกวัน')]} onUse={(t) => setText(t)} />
          <textarea className="answer" rows={2} value={text} onChange={(e) => setText(e.target.value)} aria-label="ประโยคจากการ์ดคำ" />
          <button type="button" className="btn" disabled={!text.trim()} onClick={() => {
            setState((s) => ({ ...saveQuick(s, 'word', `การ์ดคำ: ${word}`, text.trim(), ['F']), wordBank: addOnce(s.wordBank, word), turnActed: true }));
            done(`“${word}” เข้าคลังคำของทีมแล้ว`);
          }}>💾 บันทึกประโยค</button>
        </div>
      )}
      {kind === 'creative' && (
        <div>
          <div className="creative-card"><span className="tag-badge">{card.tag} {TAG_NAMES[card.tag]}</span> {card.text} <SpeakButton text={card.text} /></div>
          <textarea className="answer" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="เขียนได้หลายบรรทัด ไม่มีคำตอบผิด" aria-label="คำตอบภารกิจสร้างสรรค์" />
          <button type="button" className="btn" disabled={!text.trim()} onClick={() => {
            setState((s) => addLog({ ...saveQuick(s, 'creative', `สร้างสรรค์ระหว่างทาง (${card.tag}): ${card.text}`, text.trim(), [card.tag]), blocks: s.blocks + 1, turnActed: true }, `✨ ${me.name} ทำภารกิจสร้างสรรค์ ทีมได้บล็อก 1 ก้อน`));
            done('✨ เก็บผลงานสร้างสรรค์แล้ว ทีมได้บล็อก 1 ก้อน');
          }}>💾 เก็บผลงาน</button>
        </div>
      )}
      {kind === 'rest' && (
        <div>
          <div className="creative-card">🌙 {question} <SpeakButton text={question} /></div>
          <textarea className="answer" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="ตอบหรือเล่าให้เพื่อนฟังก็ได้" aria-label="คำตอบช่องพัก" />
          <div className="row-actions">
            <button type="button" className="btn" disabled={!text.trim()} onClick={() => { setState((s) => saveQuick(s, 'rest', `ช่องพัก: ${question}`, text.trim())); done('บันทึกความคิดแล้ว'); }}>💾 บันทึก</button>
            <button type="button" className="btn ghost" onClick={close}>เล่าปากเปล่าแล้ว</button>
          </div>
        </div>
      )}
      {kind === 'bonus' && (
        <div className="center">
          <div className="boss-big" aria-hidden="true">🎁🧱</div>
          <p>ทีมได้บล็อกก่อสร้าง 1 ก้อน! ตอนนี้มี {state.blocks} ก้อน</p>
          <button type="button" className="btn" onClick={() => open({ type: 'city' })}>🏗️ ไปสร้างเมือง</button>
        </div>
      )}
      {kind === 'gate' && (
        <div>
          <p>ประตูบอสยังไม่เปิด ทำภารกิจให้ครบ 5 หัวข้อก่อนนะ</p>
          <button type="button" className="btn" onClick={() => open({ type: 'missionBoard' })}>🗺️ เปิดกระดานภารกิจ</button>
        </div>
      )}
    </Modal>
  );
}

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="วิธีเล่นแบบสั้น" icon="📜" onClose={onClose}>
      <ol className="rules">
        {RULES_TEXT.map((r) => <li key={r}>{r} <SpeakButton text={r} /></li>)}
      </ol>
      <SpeakButton text={RULES_TEXT.join(' ')} label="ฟังกติกาทั้งหมด" />
      <p className="muted small">คีย์ลัด: R = ทอยลูกเต๋า · E = จบตา · M = กระดานภารกิจ · H = ฐานการช่วยเหลือ · Esc = ปิดหน้าต่าง</p>
      <div className="row-actions"><button type="button" className="btn" onClick={onClose}>⬅️ กลับ</button></div>
    </Modal>
  );
}

export function IntroModal() {
  const { close, state } = useStarted();
  const z = ZONES[state.zone];
  const text = `อาณาจักรนักสร้างโลกแห่งคำกำลังเงียบงัน เพราะหอคอยกลางถูกผนึกไว้ ต้องใช้คริสตัลสามดวงจากสามโซนจึงจะเปิดได้ ${z.story}`;
  return (
    <Modal title="BLOCK WORLD: อาณาจักรนักสร้างโลกแห่งคำ" icon="🗺️" onClose={close}>
      <Scene icons={['🏰', '🌉', '💎', '🧱', '✨']} caption="หอคอยกลางรอคริสตัลสามดวง" />
      <p className="story">{text} <SpeakButton text={text} /></p>
      <p><strong>ปัญหาที่ต้องแก้:</strong> {z.problem}</p>
      <div className="row-actions"><button type="button" className="btn big" onClick={close}>🚀 ออกผจญภัย</button></div>
    </Modal>
  );
}

/** 1. สถานการณ์ปัญหา (สถานีบนกระดาน) */
export function ProblemModal() {
  const { state, close, open } = useStarted();
  const z = ZONES[state.zone];
  return (
    <Modal title={`1. สถานการณ์ปัญหา · ${z.place}`} icon="🧩" onClose={close} tone={z.colors.main}>
      <p className="story">📖 {z.story} <SpeakButton text={z.story} /></p>
      <p><strong>❓ เกิดปัญหาอะไร?</strong> {z.problem}</p>
      <p><strong>🛠️ เราจะแก้ได้อย่างไร?</strong> เลือกภารกิจจากกระดานภารกิจ แต่ละภารกิจมีบัตรสถานการณ์ปัญหาให้ทีมบันทึกความคิดก่อนลงมือ</p>
      <ul className="mission-list compact">
        {QUESTS.filter((q) => q.zone === state.zone).map((q) => (
          <li key={q.id}>🧩 <strong>{q.title}</strong> — {q.story}</li>
        ))}
      </ul>
      <button type="button" className="btn" onClick={() => open({ type: 'missionBoard' })}>🗺️ ไปกระดานภารกิจ</button>
    </Modal>
  );
}

/** 3. เครื่องมือทางปัญญา (ทดลองเรียงบล็อกคำอิสระ) */
export function BuilderModal() {
  const { state, close } = useStarted();
  const [out, setOut] = useState<string[]>([]);
  const zoneWords = QUESTS.filter((q) => q.zone === state.zone).flatMap((q) => q.starterWords);
  const uniq = zoneWords.filter((w, i) => zoneWords.findIndex((x) => x.text === w.text) === i).slice(0, 18);
  return (
    <Modal title="3. เครื่องมือทางปัญญา · ลานฝึกเรียงบล็อกคำ" icon="🧱" onClose={close} wide>
      <p>ทดลองเรียงประโยคได้อิสระ ไม่นับเป็นภารกิจ ใช้คำจากโซนนี้และคลังคำของทีม</p>
      <SentenceBuilder words={uniq} extraWords={state.wordBank} onUse={(t) => setOut((o) => [...o, t])} />
      {out.length > 0 && <ol className="items">{out.map((t, i) => <li key={i}>{t}</li>)}</ol>}
    </Modal>
  );
}

/** 4. ศูนย์แลกเปลี่ยนเรียนรู้ (รวมความคิดของเพื่อนทุกภารกิจ) */
export function ExchangeLogModal() {
  const { state, close, open } = useStarted();
  const list = state.works.filter((w) => w.exchange.length);
  return (
    <Modal title="4. ศูนย์แลกเปลี่ยนเรียนรู้" icon="💬" onClose={close} wide>
      <p>ทุกภารกิจมีขั้น “แลกเปลี่ยนเรียนรู้” ให้เพื่อนผลัดกัน รับฟังความคิดเพื่อน · เสนอแบบอื่น · ช่วยปรับประโยค ที่นี่รวมบทสนทนาทั้งหมดของทีม</p>
      <p>
        จำนวนความคิดที่แบ่งปัน: {state.players.map((p) => `${p.avatar} ${p.name} ${state.works.reduce((n, w) => n + w.exchange.filter((e) => e.by === p.id).length, 0)}`).join(' · ')}
      </p>
      {!list.length && <p className="muted">ยังไม่มีการแลกเปลี่ยน เริ่มจากทำภารกิจในกระดานภารกิจ</p>}
      {list.map((w) => (
        <article key={w.id} className="work-card">
          <header><strong>{w.title}</strong> <StatusChip status={w.status} /> <button type="button" className="btn small ghost" onClick={() => open(openWorkModal(w))}>เปิด</button></header>
          <ul className="ex-log">{w.exchange.map((e, i) => <li key={i}><strong>{playerName(state, e.by)}</strong>: {e.text}</li>)}</ul>
        </article>
      ))}
    </Modal>
  );
}

export function HistoryModal() {
  const { state, close, open } = useStarted();
  const [who, setWho] = useState<string>('all');
  const list = [...state.works].reverse().filter((w) => who === 'all' || w.participants.includes(who));
  return (
    <Modal title="ประวัติผลงาน" icon="📜" onClose={close} wide>
      <div className="speakers">
        <button type="button" className={`speaker ${who === 'all' ? 'on' : ''}`} onClick={() => setWho('all')}>ทั้งทีม</button>
        {state.players.map((p) => <button key={p.id} type="button" className={`speaker ${who === p.id ? 'on' : ''}`} style={{ borderColor: p.color }} onClick={() => setWho(p.id)}>{p.avatar} {p.name}</button>)}
      </div>
      {!list.length && <p className="muted">ยังไม่มีผลงาน</p>}
      {list.map((w) => (
        <article key={w.id} className="work-card">
          <header>
            <strong>{w.title}</strong> <StatusChip status={w.status} /> <span className="muted small">โดย {w.participants.map((p) => playerName(state, p)).join(', ')}</span>
            {(w.kind === 'mission' || w.kind === 'boss' || w.kind === 'tower') && <button type="button" className="btn small ghost" onClick={() => open(openWorkModal(w))}>เปิด</button>}
          </header>
          {Object.entries(w.answers).filter(([k]) => k !== 'wordset').map(([k, a]) => (
            <div key={k} className="small">{a.first && a.first !== a.final ? <><s className="muted">{a.first}</s> → </> : null}{a.final}</div>
          ))}
          {(w.items ?? []).map((i, n) => <div key={n} className="small">• {i.text}</div>)}
        </article>
      ))}
      <h3>🎲 ประวัติการทอย</h3>
      <p className="small">{state.diceHistory.slice(-30).map((d) => `${playerName(state, d.playerId)} ${d.value}`).join(' · ') || '—'}</p>
    </Modal>
  );
}

export function CityModal() {
  const { state, setState, close, toast } = useStarted();
  const me = activePlayer(state);
  const build = (id: string) => {
    const b = BUILDINGS.find((x) => x.id === id)!;
    if (state.blocks < b.cost) return toast('บล็อกยังไม่พอ ทำภารกิจเพิ่มนะ');
    setState((s) => addLog({ ...s, blocks: s.blocks - b.cost, builds: [...s.builds, { id: `${id}-${Date.now()}`, buildingId: id, by: me.id, at: Date.now() }] }, `🏗️ ${me.name} สร้าง${b.name}`));
    toast(`สร้าง${b.name}แล้ว!`);
  };
  return (
    <Modal title="สร้างเมืองด้วยบล็อก" icon="🏗️" onClose={close} wide>
      <p>🧱 บล็อกก่อสร้างของทีม: <strong>{state.blocks}</strong> ก้อน (ได้จากภารกิจที่ผ่านการรับรอง ช่องโบนัส และบอส)</p>
      <div className="catalog">
        {BUILDINGS.map((b) => (
          <button key={b.id} type="button" className="build-btn" disabled={state.blocks < b.cost} onClick={() => build(b.id)}>
            <span className="build-emoji" aria-hidden="true">{b.emoji}</span>
            <span>{b.name}</span>
            <small>ใช้ {b.cost} บล็อก</small>
          </button>
        ))}
      </div>
      <City />
    </Modal>
  );
}

export function City({ bright }: { bright?: boolean }) {
  const { state } = useStarted();
  const cells = Array.from({ length: Math.max(12, state.builds.length + 4) });
  return (
    <div className={`city ${bright || state.finished ? 'bright' : ''}`} aria-label="เมืองของทีม">
      {cells.map((_, i) => {
        const b = state.builds[i];
        const info = b && BUILDINGS.find((x) => x.id === b.buildingId);
        return (
          <div key={i} className={`lot ${info ? 'built' : ''}`} title={info ? `${info.name} — สร้างโดย ${playerName(state, b.by)}` : 'ที่ว่าง'}>
            {info ? <span className="pop" aria-label={info.name}>{info.emoji}</span> : <span className="muted" aria-hidden="true">·</span>}
          </div>
        );
      })}
    </div>
  );
}

export function EndingModal() {
  const { state, close } = useStarted();
  return (
    <Modal title="หอคอยเปล่งแสง! อาณาจักรกลับมาสดใส" icon="🌟" onClose={close} wide tone="#f5b700">
      <Scene icons={['🗼', '✨', '💎', '💎', '💎', '🌈', '🎉']} caption="หอคอยกลางเปล่งแสง เมืองทั้งสามโซนกลับมาสดใสอีกครั้ง" tone="#f5b700" />
      <p className="story">ทุกคนช่วยกันสร้างประโยค ขยายประโยค และเลือกถ้อยคำอย่างเหมาะสม จนปลดผนึกหอคอยได้สำเร็จ ขอบคุณนักสร้างโลกแห่งคำทุกคน!</p>
      <City bright />
      <h3>🏅 สรุปผลงานของนักสร้างโลกแต่ละคน</h3>
      <div className="ending-grid">
        {state.players.map((p) => {
          const mine = state.works.filter((w) => w.participants.includes(p.id));
          const tags = (['F', 'FL', 'O', 'E'] as const).map((t) => ({ t, n: mine.filter((w) => w.creativityTags.includes(t)).length + mine.reduce((n, w) => n + (w.items ?? []).filter((i) => i.by === p.id && w.creativityTags.includes(t)).length, 0) }));
          const best = [...tags].sort((a, b) => b.n - a.n)[0];
          const shared = state.works.reduce((n, w) => n + w.exchange.filter((e) => e.by === p.id).length, 0);
          return (
            <div key={p.id} className="end-card" style={{ borderColor: p.color }}>
              <div className="end-avatar" aria-hidden="true">{p.avatar}</div>
              <strong>{p.name}</strong>
              <div>ร่วมสร้างผลงาน {mine.length} ชิ้น · แบ่งปันความคิด {shared} ครั้ง</div>
              <div>เด่นด้าน: ✨ {TAG_NAMES[best.t]}</div>
              <div className="muted small">{tags.map((x) => `${TAG_NAMES[x.t]} ${x.n}`).join(' · ')}</div>
              <div className="badge">🌟 นักสร้างโลกแห่งคำ</div>
            </div>
          );
        })}
      </div>
      <p className="muted small">สรุปนี้มาจากกิจกรรมฝึกในเกม ใช้ชื่นชมความพยายาม ไม่ใช่ผลการวัดความคิดสร้างสรรค์</p>
    </Modal>
  );
}
