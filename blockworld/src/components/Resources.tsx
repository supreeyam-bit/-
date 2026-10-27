// 2. ศูนย์การเรียนรู้ — คลังความรู้ 15 หัวข้อ ค้นหาได้ พร้อมตัวอย่าง AR จำลอง
import { useMemo, useState } from 'react';
import { AR_SCENES, getArProvider } from '../ar/arScenes';
import { LESSONS } from '../data/learning';
import { QUESTS, TOPICS, ZONES } from '../data/quests';
import { useStarted } from '../game/store';
import { Drawer, SpeakButton } from './ui';

export function ArPreview({ sceneKey }: { sceneKey: string }) {
  const scene = AR_SCENES[sceneKey];
  const provider = getArProvider();
  if (!scene) return null;
  return (
    <figure className="ar-box">
      <div className="ar-badge">📱 {provider.real ? 'AR' : 'ตัวอย่างการแสดงผล AR'} — {scene.title}</div>
      <div className="ar-stage" aria-hidden="true">
        <div className="ar-platform" style={{ background: scene.ground }}>
          {scene.props.map((p, i) => (
            <div key={i} className="ar-prop" style={{ transform: `translate3d(${p.x * 70}px, ${p.z * 70}px, ${(p.y ?? 0) * 60}px) rotateX(-90deg)` }}>
              <span>{p.icon}</span>
              {p.label && <small>{p.label}</small>}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="muted small">
        {provider.real ? '' : 'ภาพจำลองแบบ 3 มิติในเบราว์เซอร์ ยังไม่ได้สแกน AR จริง (แยกโมดูลไว้เพื่อเชื่อม WebXR/ภาพ marker ภายหลัง)'}
      </figcaption>
    </figure>
  );
}

export function LearningCenter({ topic: initial }: { topic?: number }) {
  const { state, openDrawer } = useStarted();
  const [topic, setTopic] = useState<number>(initial ?? state.zone * 5 + 1);
  const [query, setQuery] = useState('');
  const [ar, setAr] = useState(false);
  const lesson = LESSONS.find((l) => l.topic === topic)!;
  const quest = QUESTS.find((q) => q.topic === topic)!;
  const hits = useMemo(() => {
    const q = query.trim();
    return LESSONS.filter((l) => !q || TOPICS[l.topic - 1].includes(q) || l.explain.includes(q) || l.examples.some((e) => e.includes(q)));
  }, [query]);

  return (
    <Drawer title="2. ศูนย์การเรียนรู้" icon="📚" onClose={() => openDrawer(null)}>
      <input className="search" type="search" placeholder="🔍 ค้นหาหัวข้อ เช่น ขยาย, สุภาพ, เวลา" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="ค้นหาหัวข้อ" />
      <div className="topic-index">
        {ZONES.map((z) => (
          <div key={z.id}>
            <div className="zone-label" style={{ color: z.colors.dark }}>{z.name}</div>
            <div className="topic-chips">
              {hits.filter((l) => QUESTS[l.topic - 1].zone === z.id).map((l) => (
                <button key={l.topic} type="button" className={`topic-chip ${l.topic === topic ? 'on' : ''}`} onClick={() => { setTopic(l.topic); setAr(false); }} style={{ borderColor: z.colors.main }}>
                  {l.icon} {l.topic}. {TOPICS[l.topic - 1]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!hits.length && <p className="muted">ไม่พบหัวข้อ ลองคำอื่นนะ</p>}
      </div>
      <article className="lesson">
        <h3>{lesson.icon} {topic}. {TOPICS[topic - 1]}</h3>
        <p>{lesson.explain} <SpeakButton text={lesson.explain} /></p>
        {lesson.pattern && <div className="pattern">🧱 รูปแบบ: {lesson.pattern}</div>}
        <h4>ตัวอย่าง</h4>
        <ul className="examples">
          {lesson.examples.map((e) => <li key={e}>✅ {e} <SpeakButton text={e} /></li>)}
        </ul>
        <h4>ตัวอย่างใกล้เคียง (ลองเปรียบเทียบ)</h4>
        <ul className="examples">
          {lesson.near.map((n) => <li key={n.text}>🤔 {n.text} <span className="muted">— {n.note}</span></li>)}
        </ul>
        <button type="button" className="btn" onClick={() => setAr((v) => !v)} aria-expanded={ar}>📱 {ar ? 'ซ่อน' : 'เปิด'}ตัวอย่างการแสดงผล AR</button>
        {ar && <ArPreview sceneKey={quest.arSceneKey} />}
      </article>
    </Drawer>
  );
}
