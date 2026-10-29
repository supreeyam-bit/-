import { describe, expect, it } from 'vitest';
// @ts-expect-error — ไฟล์ข้อมูลของชุดพิมพ์เป็น JavaScript ไม่มีชนิดข้อมูล ใช้ตรวจว่าคำสั่งภารกิจตรงกับตารางที่ 2 ฉบับเดียวกัน
import { CREATIVE } from '../../../print-and-play/src/data.mjs';
import { AREAS, AREA_ORDER, BOSSES, MISSIONS, SCENARIOS, ZONES } from '../data/quests';
import { ELEMENTS, INDICATORS, LESSONS, ZONE_LAYOUTS } from '../data/learning';
import { AR_SCENES } from '../ar/arScenes';
import {
  TOTAL_SPACES, approveWork, createWork, endTurn, exportCSV, indicatorEvidence, missionReady, newGame, recordRoll, requestRevision, rollDie, runChecks,
  setAnswer, sheetKey, sheetMissing, stepActive, towerUnlocked, workForRef,
} from './rules';
import type { GameState, ZoneId } from './types';

const players = [
  { id: 'a', name: 'น้องฟ้า', avatar: '🧙', color: '#f00' },
  { id: 'b', name: 'น้องต้นกล้า', avatar: '🤖', color: '#00f' },
];

function passZone(s: GameState, zone: ZoneId): GameState {
  for (const m of MISSIONS.filter((x) => x.zone === zone)) {
    const [s2, id] = createWork(s, { kind: 'mission', refId: m.id, title: m.title, zone, indicators: m.indicators });
    s = approveWork(s2, id, 'coach');
  }
  return s;
}

describe('ตารางที่ 2', () => {
  it('มี 3 โซนตามลำดับ การสร้างประโยค → การขยายประโยค → การใช้ภาษา', () => {
    expect(ZONES.map((z) => z.name)).toEqual(['โซน 1 การสร้างประโยค', 'โซน 2 การขยายประโยค', 'โซน 3 การใช้ภาษา']);
  });
  it('มีภารกิจหลัก 12 ภารกิจ โซนละ 4 ด้าน F / FL / O / E', () => {
    expect(MISSIONS).toHaveLength(12);
    for (const z of [0, 1, 2]) expect(MISSIONS.filter((m) => m.zone === z).map((m) => m.area)).toEqual(AREA_ORDER);
  });
  it('แต่ละด้านใช้สถานการณ์เดิมตลอด 3 โซน', () => {
    const expected = { F: 'แมวกินปลา', FL: 'น้องกับสุนัขเล่นลูกบอล', O: 'ว่าว ทุ่งนา ลม', E: 'นักเรียนกวาดห้องเรียน' };
    for (const m of MISSIONS) expect(SCENARIOS[m.scenario].name).toBe(expected[m.area]);
  });
  it('คำสั่งภารกิจและตัวบ่งชี้ตรงกับตารางที่ 2 ทุกช่อง (ไม่ตัดไม่แก้)', () => {
    const areaIdx = { F: 0, FL: 1, O: 2, E: 3 } as const;
    for (const m of MISSIONS) {
      const [prompt, ind] = CREATIVE[areaIdx[m.area]].stages[m.zone] as [string, string];
      expect(m.prompt).toBe(prompt);
      expect(m.indicators).toEqual(ind.split(',').map((x) => x.trim()));
      expect(m.areaName).toBe(CREATIVE[areaIdx[m.area]].area);
    }
  });
  it('คงเงื่อนไขเฉพาะ: เวลา 5 นาที จำนวนรูปแบบ ชนิดประโยค คำขยาย เหตุผล', () => {
    const by = (id: string) => MISSIONS.find((m) => m.id === id)!;
    for (const id of ['Z1F', 'Z1E', 'Z2F', 'Z2E', 'Z3F', 'Z3E']) expect(by(id).minutes).toBe(5);
    for (const id of ['Z1FL', 'Z1O', 'Z2FL', 'Z2O', 'Z3FL', 'Z3O']) expect(by(id).minutes).toBeUndefined();
    const keys = (id: string) => by(id).groups.flatMap((g) => g.slots.map((s) => s.key));
    expect(keys('Z1FL')).toEqual(['two', 'three', 'statement', 'negative', 'question', 'request']);
    expect(by('Z2FL').list?.minDistinctTags).toBe(3);
    expect(keys('Z2FL')).toEqual(expect.arrayContaining(['statement', 'negative', 'question', 'request']));
    expect(keys('Z3FL')).toHaveLength(9); // ผู้ใหญ่ เพื่อน น้อง × เล่าเรื่อง คำถาม ขอร้อง/คำสั่ง
    expect(by('Z2O').parts?.map((p) => p.key)).toEqual(['look', 'action', 'time', 'place']);
    expect(by('Z2E').parts?.map((p) => p.key)).toEqual(['look', 'action', 'time', 'place']);
    for (const id of ['Z1O', 'Z2O', 'Z3O', 'Z3E']) expect(by(id).needReason).toBe(true);
    expect(by('Z1O').drawing).toBe('required');
    expect(by('Z2O').drawing).toBe('required');
  });
  it('เจ็ดองค์ประกอบใช้ชื่อตามกรอบวิจัย', () => {
    expect(ELEMENTS.map((e) => e.name)).toEqual([
      '1. สถานการณ์ปัญหา', '2. ศูนย์การเรียนรู้', '3. เครื่องมือทางปัญญา', '4. ศูนย์แลกเปลี่ยนเรียนรู้',
      '5. ศูนย์ส่งเสริมการคิดสร้างสรรค์', '6. ฐานการช่วยเหลือ', '7. การโค้ช',
    ]);
  });
  it('ตัวบ่งชี้ครบ 1.1–4.3 และทุกตัวบ่งชี้มีภารกิจรองรับ', () => {
    const codes = INDICATORS.flatMap((g) => g.items.map((i) => i.code));
    expect(codes).toEqual(['1.1', '1.2', '1.3', '2.1', '2.2', '2.3', '3.1', '3.2', '3.3', '4.1', '4.2', '4.3']);
    for (const c of codes) expect(MISSIONS.some((m) => m.indicators.includes(c))).toBe(true);
  });
  it('กระดาน 27 ช่อง แต่ละโซนมีช่องภารกิจ F / FL / O / E และประตูบอส', () => {
    expect(TOTAL_SPACES).toBe(27);
    for (const l of ZONE_LAYOUTS) {
      expect(l).toHaveLength(9);
      expect(l[0]).toBe('gate');
      for (const a of AREA_ORDER) expect(l).toContain(a);
    }
  });
  it('ข้อมูลประกอบครบ: บทเรียน ฉาก AR บอส', () => {
    expect(LESSONS).toHaveLength(15);
    for (const l of LESSONS) expect(AR_SCENES[l.arKey]).toBeDefined();
    for (const s of Object.values(SCENARIOS)) expect(AR_SCENES[s.arKey]).toBeDefined();
    expect(BOSSES.map((b) => b.name)).toEqual(['ปีศาจลบคำ', 'ควายเงามายา', 'จอมเวทสลับถ้อยคำ']);
    expect(Object.keys(AREAS)).toEqual(AREA_ORDER);
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
  });
  it('ใบงานรายคน: ทุกคนต้องทำครบตามเงื่อนไขภารกิจ', () => {
    const m = MISSIONS.find((x) => x.id === 'Z1FL')!;
    let s = newGame(players);
    const [s2, id] = createWork(s, { kind: 'mission', refId: m.id, title: m.title, zone: 0 });
    s = s2;
    let w = workForRef(s, 'mission', m.id)!;
    expect(sheetMissing(w, m, 'a').length).toBeGreaterThan(0);
    for (const p of players) for (const k of ['two', 'three', 'statement', 'negative', 'question', 'request']) w = setAnswer(w, sheetKey(p.id, k), 'สุนัขวิ่ง', p.id);
    expect(missionReady(w, m, players)).toBe(true);
    expect(id).toBe(w.id);
  });
  it('ขยายหลายรูปแบบต้องต่างกันอย่างน้อย 3 แบบ', () => {
    const m = MISSIONS.find((x) => x.id === 'Z2FL')!;
    const [s] = createWork(newGame(players), { kind: 'mission', refId: m.id, title: m.title, zone: 1 });
    const base = workForRef(s, 'mission', m.id)!;
    const items = ['ผู้ทำ', 'ผู้ทำ', 'เวลา'].map((tag) => ({ text: 'น้องเตะบอล', first: 'น้องเตะบอล', by: 'a', tag, at: 0 }));
    expect(sheetMissing({ ...base, items }, m, 'a').some((x) => x.includes('3 รูปแบบ'))).toBe(true);
    items[1].tag = 'สถานที่';
    expect(sheetMissing({ ...base, items }, m, 'a').some((x) => x.includes('3 รูปแบบ'))).toBe(false);
  });
  it('ภารกิจนับว่าผ่านเมื่อครู/โค้ชรับรอง', () => {
    let s = newGame(players);
    const [s2, id] = createWork(s, { kind: 'mission', refId: 'Z1F', title: 'x', zone: 0 });
    expect(s2.missionProgress[0]).toBe('doing');
    s = requestRevision(s2, id, 'เพิ่มประโยค');
    expect(s.missionProgress[0]).toBe('revise');
    s = approveWork(s, id, 'coach');
    expect(s.missionProgress[0]).toBe('done');
    expect(s.blocks).toBe(1);
  });
  it('บอสล็อกจนครบ 4 ด้าน ชนะแล้วได้คริสตัลและปลดล็อกโซนถัดไป', () => {
    let s = newGame(players);
    expect(s.bossStatus[0]).toBe('locked');
    s = passZone(s, 0);
    expect(s.bossStatus[0]).toBe('available');
    const [s2, id] = createWork(s, { kind: 'boss', refId: 'B1', title: 'boss', zone: 0 });
    expect(s2.bossStatus[0]).toBe('attempted');
    s = approveWork(s2, id, 'coach');
    expect(s.bossStatus[0]).toBe('defeated');
    expect(s.crystalCount).toBe(1);
    expect(s.zone).toBe(1);
  });
  it('ศูนย์ส่งเสริมการคิดสร้างสรรค์ล็อกจนครบ 3 คริสตัล และจบเกมเมื่อครบ 4 ชั้น', () => {
    let s = newGame(players);
    for (const z of [0, 1, 2] as const) {
      s = passZone(s, z);
      expect(towerUnlocked(s)).toBe(false);
      const [s2, id] = createWork(s, { kind: 'boss', refId: `B${z + 1}`, title: 'boss', zone: z });
      s = approveWork(s2, id, 'coach');
    }
    expect(towerUnlocked(s)).toBe(true);
    for (const a of AREA_ORDER) {
      expect(s.finished).toBe(false);
      const [s2, id] = createWork(s, { kind: 'tower', refId: a, title: a });
      s = approveWork(s2, id, 'peer');
    }
    expect(s.finished).toBe(true);
  });
  it('บันทึกหลักฐานรายบุคคลตามตัวบ่งชี้ และแยกคะแนนกิจกรรมในเกม', () => {
    let s = newGame(players);
    const [s2, id] = createWork(s, { kind: 'mission', refId: 'Z1F', title: 'x', zone: 0, indicators: ['1.1'] });
    s = { ...s2, works: s2.works.map((w) => (w.id === id ? { ...w, items: [{ text: 'แมวกินปลา', first: 'แมวกินปลา', by: 'a', at: 0 }, { text: 'แมวนอน', first: 'แมวนอน', by: 'a', at: 0 }], ratings: { a: 3 } } : w)) };
    s = approveWork(s, id, 'coach');
    expect(indicatorEvidence(s, 'a')['1.1']).toEqual({ missions: 1, pieces: 2, rating: 3, rated: 1 });
    expect(indicatorEvidence(s, 'b')['1.1']).toEqual({ missions: 0, pieces: 0, rating: 0, rated: 0 });
  });
  it('ตรวจเบื้องต้นด้วยกลุ่มคำ ไม่ใช่เทียบสตริงทั้งประโยค', () => {
    const m = MISSIONS.find((x) => x.id === 'Z1FL')!;
    const r = runChecks(m.autoChecks, { negative: 'สุนัขไม่ได้กัดลูกบอล', question: 'น้องเล่นกับใคร', request: 'ช่วยส่งลูกบอลหน่อยนะ' });
    expect(r.every((x) => x.ok)).toBe(true);
  });
  it('CSV ขึ้นต้นด้วย UTF-8 BOM', () => {
    expect(exportCSV(newGame(players)).charCodeAt(0)).toBe(0xfeff);
  });
});
