import { describe, expect, it } from 'vitest';
import { BOSSES, QUESTS, TOPICS, TOWER_STAGES, ZONES } from '../data/quests';
import { ELEMENTS, LESSONS, ZONE_LAYOUTS } from '../data/learning';
import { AR_SCENES } from '../ar/arScenes';
import {
  TOTAL_SPACES, approveWork, createWork, endTurn, exportCSV, newGame, recordRoll, requestRevision, rollDie, runChecks, stepActive, towerUnlocked, workForRef,
} from './rules';
import type { GameState } from './types';

const players = [
  { id: 'a', name: 'น้องฟ้า', avatar: '🧙', color: '#f00' },
  { id: 'b', name: 'น้องต้นกล้า', avatar: '🤖', color: '#00f' },
];

function passZone(s: GameState, zone: 0 | 1 | 2): GameState {
  for (const q of QUESTS.filter((x) => x.zone === zone)) {
    const [s2, id] = createWork(s, { kind: 'mission', refId: q.id, title: q.title, zone, topic: q.topic });
    s = approveWork(s2, id, 'coach');
  }
  return s;
}

describe('เนื้อหา', () => {
  it('มีสามโซนเท่านั้น ชื่อถูกต้อง', () => {
    expect(ZONES.map((z) => z.name)).toEqual(['โซน 1 การสร้างประโยค', 'โซน 2 การขยายประโยค', 'โซน 3 การใช้ภาษา']);
  });
  it('มี 15 หัวข้อ โซนละ 5 ตามลำดับในไฟล์เนื้อหา', () => {
    expect(QUESTS).toHaveLength(15);
    expect(QUESTS.map((q) => q.id)).toEqual(Array.from({ length: 15 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`));
    for (const z of [0, 1, 2]) expect(QUESTS.filter((q) => q.zone === z)).toHaveLength(5);
    expect(TOPICS.slice(0, 5)).toEqual(['ประโยคต้องได้ใจความ', 'ใคร ทำอะไร', 'ใคร ทำอะไร กับใครหรืออะไร', 'ลำดับคำกับความหมาย', 'ประโยคตรงกับเหตุการณ์']);
    expect(TOPICS.slice(5, 10)).toEqual(['ประโยคหลัก', 'การขยายผู้ทำ', 'การขยายการกระทำ', 'การบอกเวลาและสถานที่', 'เกณฑ์ตรวจประโยค']);
    expect(TOPICS.slice(10)).toEqual(['ถ้อยคำเหมาะกับผู้ฟัง', 'คำสุภาพและคำลงท้าย', 'ถ้อยคำขอความช่วยเหลือ', 'ถ้อยคำขอบคุณและขอโทษ', 'พูดให้ผู้ฟังรู้ว่าต้องการอะไร']);
  });
  it('ทุกภารกิจมีข้อมูลครบ ไม่ใช่ placeholder', () => {
    for (const q of QUESTS) {
      expect(q.story.length).toBeGreaterThan(20);
      expect(q.prompt.length).toBeGreaterThan(10);
      expect(q.starterWords.length).toBeGreaterThan(2);
      expect(q.examplesForTeacher.length).toBeGreaterThan(0);
      expect(q.successCriteria.length).toBeGreaterThan(0);
      expect(q.creativityTags.length).toBeGreaterThan(0);
      expect(AR_SCENES[q.arSceneKey]).toBeDefined();
      expect(LESSONS[q.topic - 1].topic).toBe(q.topic);
    }
  });
  it('เจ็ดองค์ประกอบใช้ชื่อตรงตามข้อกำหนด', () => {
    expect(ELEMENTS.map((e) => e.name)).toEqual([
      '1. สถานการณ์ปัญหา', '2. ศูนย์การเรียนรู้', '3. เครื่องมือทางปัญญา', '4. ศูนย์แลกเปลี่ยนเรียนรู้',
      '5. ศูนย์ส่งเสริมการคิดสร้างสรรค์', '6. ฐานการช่วยเหลือ', '7. การโค้ช',
    ]);
  });
  it('กระดาน 27 ช่อง 9 ช่องต่อโซน เริ่มที่ประตูบอส', () => {
    expect(TOTAL_SPACES).toBe(27);
    for (const l of ZONE_LAYOUTS) {
      expect(l).toHaveLength(9);
      expect(l[0]).toBe('gate');
    }
  });
  it('บอส 3 ตัว หอคอย 4 ด่าน F/FL/O/E', () => {
    expect(BOSSES.map((b) => b.name)).toEqual(['ปีศาจลบคำ', 'ควายเงามายา', 'จอมเวทสลับถ้อยคำ']);
    expect(TOWER_STAGES.map((t) => t.tag)).toEqual(['F', 'FL', 'O', 'E']);
  });
});

describe('การเล่น', () => {
  it('ลูกเต๋าออกแค่ 1–3', () => {
    for (let i = 0; i < 200; i++) expect([1, 2, 3]).toContain(rollDie());
  });
  it('ทอยแล้วตัวเดินขยับ และส่งตาให้คนถัดไป', () => {
    let s = newGame(players);
    s = recordRoll(s, 2);
    s = stepActive(stepActive(s));
    expect(s.positions).toEqual([2, 0]);
    s = endTurn(s);
    expect(s.activePlayer).toBe(1);
    expect(s.phase).toBe('roll');
  });
  it('ภารกิจนับว่าผ่านเมื่อครู/โค้ชรับรองเท่านั้น', () => {
    let s = newGame(players);
    const [s2, id] = createWork(s, { kind: 'mission', refId: 'P01', title: 'x', zone: 0, topic: 1 });
    expect(s2.topicProgress[0]).toBe('doing');
    s = requestRevision(s2, id, 'เพิ่มเหตุผล');
    expect(s.topicProgress[0]).toBe('revise');
    s = approveWork(s, id, 'coach');
    expect(s.topicProgress[0]).toBe('done');
    expect(s.blocks).toBe(1);
  });
  it('บอสล็อกจนครบ 5 หัวข้อ ชนะแล้วได้คริสตัลและปลดล็อกโซนถัดไป', () => {
    let s = newGame(players);
    expect(s.bossStatus[0]).toBe('locked');
    s = passZone(s, 0);
    expect(s.bossStatus[0]).toBe('available');
    expect(s.zone).toBe(0);
    const [s2, id] = createWork(s, { kind: 'boss', refId: 'B1', title: 'boss', zone: 0 });
    expect(s2.bossStatus[0]).toBe('attempted');
    s = approveWork(s2, id, 'coach');
    expect(s.bossStatus[0]).toBe('defeated');
    expect(s.crystalCount).toBe(1);
    expect(s.zone).toBe(1);
    expect(s.positions).toEqual([0, 0]);
  });
  it('หอคอยล็อกจนครบ 3 คริสตัล และจบเกมเมื่อผ่าน 4 ด่าน', () => {
    let s = newGame(players);
    for (const z of [0, 1, 2] as const) {
      s = passZone(s, z);
      expect(towerUnlocked(s)).toBe(false);
      const [s2, id] = createWork(s, { kind: 'boss', refId: `B${z + 1}`, title: 'boss', zone: z });
      s = approveWork(s2, id, 'coach');
    }
    expect(towerUnlocked(s)).toBe(true);
    for (const t of TOWER_STAGES) {
      expect(s.finished).toBe(false);
      const [s2, id] = createWork(s, { kind: 'tower', refId: t.tag, title: t.title });
      s = approveWork(s2, id, 'peer');
    }
    expect(s.finished).toBe(true);
    expect(workForRef(s, 'tower', 'E')?.status).toBe('approved');
  });
  it('ตรวจเบื้องต้นด้วยกลุ่มคำ ไม่ใช่เทียบสตริงทั้งประโยค', () => {
    const r = runChecks(QUESTS[8].autoChecks, { sentence: 'ตอนเย็นเด็กชายตามหาควายริมคลอง' });
    expect(r.every((x) => x.ok)).toBe(true);
  });
  it('CSV ขึ้นต้นด้วย UTF-8 BOM', () => {
    const s = newGame(players);
    expect(exportCSV(s).charCodeAt(0)).toBe(0xfeff);
  });
});
