// 6. ฐานการช่วยเหลือ — 4 แบบ เปิดได้ทุกเวลา ไม่หักคะแนน
import { useState } from 'react';
import { HELP_TYPES, LESSONS, METACOG_QUESTIONS, PROCEDURAL_STEPS, STRATEGIES } from '../data/learning';
import { QUESTS, TOPICS } from '../data/quests';
import { useStarted } from '../game/store';
import { findWork, recordHelp } from '../game/rules';
import type { HelpType } from '../game/types';
import { Drawer, SpeakButton } from './ui';

export function HelpCenter() {
  const { state, setState, openDrawer } = useStarted();
  const [type, setType] = useState<HelpType | null>(null);
  const work = findWork(state, state.currentMission);
  const quest = QUESTS.find((q) => q.id === work?.refId);
  const topic = quest?.topic ?? state.zone * 5 + 1;
  const lesson = LESSONS[topic - 1];
  const context = work ? work.title : `โซน ${state.zone + 1}`;

  const pick = (t: HelpType) => {
    setType(t);
    setState((s) => recordHelp(s, t, context, work?.id));
  };

  return (
    <Drawer title="6. ฐานการช่วยเหลือ" icon="🆘" onClose={() => openDrawer(null)}>
      <p className="good-note">💚 ขอความช่วยเหลือได้ทุกเวลา ไม่หักคะแนน ไม่เสียตา</p>
      <p className="muted">ตอนนี้กำลังช่วยเรื่อง: {work ? `${work.title} (หัวข้อ ${topic}. ${TOPICS[topic - 1]})` : `หัวข้อในโซนที่ ${state.zone + 1}`}</p>
      <div className="help-types">
        {HELP_TYPES.map((h) => (
          <button key={h.type} type="button" className={`help-btn ${type === h.type ? 'on' : ''}`} onClick={() => pick(h.type)} aria-pressed={type === h.type}>
            <span aria-hidden="true">{h.icon}</span> {h.th}
            <small>{h.name}</small>
          </button>
        ))}
      </div>
      {type === 'conceptual' && (
        <div className="help-body">
          <h3>💡 ตัวอย่างแนวคิด</h3>
          <p>{lesson.explain} <SpeakButton text={lesson.explain} /></p>
          {lesson.pattern && <div className="pattern">🧱 {lesson.pattern}</div>}
          <p>ตัวอย่างที่คล้ายกัน (ไม่ใช่คำตอบของภารกิจ): <strong>{lesson.examples[0]}</strong></p>
          <button type="button" className="btn small ghost" onClick={() => openDrawer({ type: 'learning', topic })}>📚 อ่านเพิ่มที่ศูนย์การเรียนรู้</button>
        </div>
      )}
      {type === 'procedural' && (
        <div className="help-body">
          <h3>👣 ขั้นตอนการเล่น</h3>
          <ol>{PROCEDURAL_STEPS.map((s) => <li key={s}>{s} <SpeakButton text={s} /></li>)}</ol>
        </div>
      )}
      {type === 'strategic' && (
        <div className="help-body">
          <h3>🧭 แนวทางคิดใหม่</h3>
          <ul>{STRATEGIES[state.zone].map((s) => <li key={s}>{s} <SpeakButton text={s} /></li>)}</ul>
        </div>
      )}
      {type === 'metacognitive' && (
        <div className="help-body">
          <h3>🪞 คำถามให้ประเมินตนเอง</h3>
          <ul>{METACOG_QUESTIONS.map((s) => <li key={s}>{s} <SpeakButton text={s} /></li>)}</ul>
        </div>
      )}
    </Drawer>
  );
}
