import missionsJson from '../data/missions_exact_table2.json';
import stationsJson from '../data/stations.json';
import wordBlocksJson from '../data/word_blocks.json';
import towerJson from '../data/tower_exact_alignment.json';
import type { AreaEn, Mission } from './types';

export const MISSIONS = missionsJson.missions as Mission[];
export const ZONES = missionsJson.zones;
export const SITUATIONS = missionsJson.situations;
export const STATIONS = stationsJson.stations;
export const WORDS = wordBlocksJson;
export const TOWER = towerJson;

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id)!;
export const missionAt = (zone: number, area: AreaEn) => MISSIONS.find((m) => m.zone === zone && m.area_en === area)!;
export const station = (id: string) => STATIONS.find((s) => s.id === id)!;

export const AREAS: { en: AreaEn; th: string; shape: string; color: string }[] = [
  { en: 'Fluency', th: 'การคิดคล่อง', shape: '●', color: 'var(--a-fluency)' },
  { en: 'Flexibility', th: 'การคิดยืดหยุ่น', shape: '■', color: 'var(--a-flex)' },
  { en: 'Originality', th: 'การคิดริเริ่ม', shape: '▲', color: 'var(--a-orig)' },
  { en: 'Elaboration', th: 'การคิดละเอียดลออ', shape: '⬢', color: 'var(--a-elab)' },
];
export const areaInfo = (en: AreaEn) => AREAS.find((a) => a.en === en)!;

export const SITUATION_ART: Record<AreaEn, { emoji: string[]; sky: string; ground: string }> = {
  Fluency: { emoji: ['🐈', '🐟', '🍚', '🍽️'], sky: '#fde7c8', ground: '#c98f5a' },
  Flexibility: { emoji: ['👧', '🐕', '⚽', '🏠'], sky: '#d6ecff', ground: '#7fbf6a' },
  Originality: { emoji: ['🪁', '🌾', '💨', '☁️'], sky: '#cfe9ff', ground: '#e2c65a' },
  Elaboration: { emoji: ['🧒', '🧹', '🏫', '🪑'], sky: '#efe3ff', ground: '#b9a27e' },
};

export const PLAYER_COLORS = [
  { color: '#d6453d', token: '🦊', name: 'แดง' },
  { color: '#e3a008', token: '🐥', name: 'เหลือง' },
  { color: '#2563c9', token: '🐳', name: 'น้ำเงิน' },
  { color: '#16a34a', token: '🐢', name: 'เขียว' },
];

/** ลูกเต๋า 6 หน้า: 1,1,2,2,3,3 */
export const DIE_FACES = [1, 1, 2, 2, 3, 3];

// ---------- กระดาน: แต่ละโซนเป็นวง 12 ช่อง ----------
export type SpaceKind = 'gate' | 'mission' | 'learning' | 'tools' | 'exchange' | 'help' | 'coach' | 'tower';
export interface Space { kind: SpaceKind; area?: AreaEn }
export const RING: Space[] = [
  { kind: 'gate' },
  { kind: 'mission', area: 'Fluency' },
  { kind: 'learning' },
  { kind: 'tools' },
  { kind: 'mission', area: 'Flexibility' },
  { kind: 'help' },
  { kind: 'exchange' },
  { kind: 'mission', area: 'Originality' },
  { kind: 'coach' },
  { kind: 'tower' },
  { kind: 'mission', area: 'Elaboration' },
  { kind: 'learning' },
];
export const SPACE_STATION: Record<SpaceKind, string> = {
  gate: 'gate', mission: 'problem', learning: 'learning', tools: 'tools', exchange: 'exchange',
  help: 'help', coach: 'coach', tower: 'creative',
};

export const BOSSES = [
  { zone: 1, name: 'ยักษ์สับสน', emoji: '👹', crystal: 'คริสตัลแห่งการสร้างประโยค', crystalColor: '#e05a8a',
    story: 'ยักษ์สับสนสลับคำในอาณาจักรจนประโยคพังทั้งเมือง ทีมนักสร้างโลกนำประโยคที่สร้างได้ในโซนนี้มารวมพลัง เพื่อเรียงโลกให้กลับมาเป็นระเบียบ' },
  { zone: 2, name: 'มังกรกลืนคำ', emoji: '🐉', crystal: 'คริสตัลแห่งการขยายประโยค', crystalColor: '#3b82f6',
    story: 'มังกรกลืนคำขยายไปหมด โลกจึงไร้สีสัน ไม่มีเวลา ไม่มีสถานที่ ทีมนำประโยคที่ขยายไว้มาเติมรายละเอียดคืนให้โลก' },
  { zone: 3, name: 'พ่อมดคำห้วน', emoji: '🧙', crystal: 'คริสตัลแห่งการใช้ภาษา', crystalColor: '#f59e0b',
    story: 'พ่อมดคำห้วนสาปให้ทุกคนพูดห้วน ๆ ไม่สุภาพ ทีมนำถ้อยคำที่เลือกให้เหมาะกับผู้ฟังมาคลายคำสาป' },
];

// ---------- รายละเอียดชิ้นงานของแต่ละภารกิจ (โครงสร้างการเก็บคำตอบ ไม่เปลี่ยนข้อความคำสั่ง) ----------
export type Section =
  | { kind: 'list'; id: string; label: string; min?: number; tag?: { key: string; label: string; options: string[] } }
  | { kind: 'slots'; id: string; label: string; slots: { id: string; label: string }[] }
  | { kind: 'listeners'; id: string; label: string; listeners: string[]; slots: { id: string; label: string; multi?: boolean }[] }
  | { kind: 'modifiers'; id: string; label: string; base: string; categories: string[] }
  | { kind: 'revise'; id: string; label: string; items: string[] }
  | { kind: 'drawing'; id: string; label: string; carry?: { mission: string; drawing: string } }
  | { kind: 'text'; id: string; label: string }
  | { kind: 'checklist'; id: string; label: string; items: string[] }
  | { kind: 'carry'; label: string; mission: string; keys?: string[] };

export interface MissionSpec { words: string[]; sections: Section[] }

const CHECK_BASIC = ['มีภาคประธาน (ใคร/อะไร)', 'มีภาคแสดง (ทำอะไร/เป็นอย่างไร)', 'อ่านแล้วสื่อความหมายได้ถูกต้องสมบูรณ์'];
const TYPES4 = [
  { id: 'statement', label: 'ประโยคบอกเล่า' },
  { id: 'negative', label: 'ประโยคปฏิเสธ' },
  { id: 'question', label: 'ประโยคคำถาม' },
  { id: 'request', label: 'ประโยคขอร้องหรือคำสั่ง' },
];
const CAT_LTP = ['ลักษณะ', 'เวลา', 'สถานที่'];
const CAT_LATP = ['ลักษณะ', 'การกระทำ', 'เวลา', 'สถานที่'];

export const SPECS: Record<string, MissionSpec> = {
  // ----- โซน 1 การสร้างประโยค -----
  'Z1-F': {
    words: ['แมว', 'ปลา', 'ปลาทู', 'โต๊ะอาหาร', 'จาน', 'ข้าว', 'กิน', 'แอบ', 'คาบ', 'วิ่ง', 'นั่ง', 'แม่', 'คุณยาย'],
    sections: [
      { kind: 'list', id: 'sentences', label: 'ประโยคบอกเล่าเกี่ยวกับภาพ (แต่งได้หลายประโยค)' },
      { kind: 'checklist', id: 'check', label: 'เกณฑ์ตรวจประโยคของฉัน', items: ['แต่ละประโยคมีคำนามอย่างน้อย 1 คำ', 'แต่ละประโยคมีคำกริยาอย่างน้อย 1 คำ', ...CHECK_BASIC] },
    ],
  },
  'Z1-FL': {
    words: ['น้อง', 'สุนัข', 'ลูกบอล', 'สนามหญ้า', 'เล่น', 'วิ่ง', 'เตะ', 'โยน', 'คาบ', 'เห่า', 'กระโดด'],
    sections: [
      { kind: 'slots', id: 'parts', label: 'ประโยค 2 ส่วน และประโยค 3 ส่วน', slots: [{ id: 'two', label: 'ประโยค 2 ส่วน' }, { id: 'three', label: 'ประโยค 3 ส่วน' }] },
      { kind: 'slots', id: 'types', label: 'ประโยค 4 ชนิด อย่างละ 1 ประโยค', slots: TYPES4 },
    ],
  },
  'Z1-O': {
    words: ['ว่าว', 'ทุ่งนา', 'ลม', 'ลอย', 'บิน', 'พัด', 'เมฆ', 'ฟ้า', 'ข้าว', 'ควาย', 'เด็ก ๆ'],
    sections: [
      { kind: 'drawing', id: 'story', label: 'ภาพเรื่องราวตามจินตนาการ (ว่าว ทุ่งนา ลม)' },
      { kind: 'list', id: 'novel', label: 'ประโยคที่แปลกใหม่' },
      { kind: 'text', id: 'reason', label: 'เหตุผลประกอบ (ทำไมคิดแบบนี้ ภาพกับประโยคสอดคล้องกันอย่างไร)' },
    ],
  },
  'Z1-E': {
    words: ['นักเรียน', 'ห้องเรียน', 'ไม้กวาด', 'ฝุ่น', 'ขยะ', 'โต๊ะ', 'กวาด', 'ถือ', 'เก็บ', 'เพื่อน', 'คุณครู'],
    sections: [
      { kind: 'revise', id: 'fix', label: 'ตรวจสอบและแก้ไขประโยค (ฉบับก่อน → ฉบับหลัง)', items: WORDS.broken_sentences_zone1_elaboration },
      { kind: 'checklist', id: 'check', label: 'เกณฑ์ตรวจประโยคที่แก้แล้ว', items: CHECK_BASIC },
    ],
  },
  // ----- โซน 2 การขยายประโยค -----
  'Z2-F': {
    words: ['แมว', 'ปลา', 'กิน', 'สีส้ม', 'ตัวอ้วน', 'ตอนเย็น', 'เมื่อวานนี้', 'บนโต๊ะอาหาร', 'ในครัว', 'อย่างเอร็ดอร่อย'],
    sections: [
      { kind: 'modifiers', id: 'mods', label: 'คำขยายที่คิดได้', base: 'แมวกินปลา', categories: CAT_LTP },
      { kind: 'list', id: 'expanded', label: 'ประโยคที่ขยายแล้ว (แต่ละประโยคมีส่วนขยายอย่างน้อย 1 ส่วน)', tag: { key: 'part', label: 'ขยายด้วย', options: CAT_LTP } },
    ],
  },
  'Z2-FL': {
    words: ['น้อง', 'สุนัข', 'ลูกบอล', 'เล่น', 'ตอนเย็น', 'ที่สนามหญ้า', 'ตัวน้อย', 'อย่างสนุกสนาน', 'สีขาว'],
    sections: [
      { kind: 'carry', label: 'ประโยค 3 ส่วนที่แต่งไว้ในโซนการสร้างประโยค', mission: 'Z1-FL', keys: ['parts.three'] },
      { kind: 'slots', id: 'chosen', label: 'ประโยค 3 ส่วนที่เลือก 1 ประโยค', slots: [{ id: 'base', label: 'ประโยคที่เลือก' }] },
      { kind: 'list', id: 'forms', label: 'ขยายประโยคอย่างน้อย 3 รูปแบบ', min: 3, tag: { key: 'part', label: 'ส่วนที่เปลี่ยน/ขยาย', options: ['ผู้ทำ', 'การกระทำ', 'เวลา', 'สถานที่'] } },
      { kind: 'slots', id: 'types', label: 'นำประโยคที่ขยายแล้วมาแต่งเป็นประโยค 4 ชนิด', slots: TYPES4 },
    ],
  },
  'Z2-O': {
    words: ['ว่าว', 'ทุ่งนา', 'ลม', 'สีรุ้ง', 'ยักษ์', 'ตอนพระอาทิตย์ตก', 'เหนือก้อนเมฆ', 'อย่างร่าเริง', 'หมุนติ้ว'],
    sections: [
      { kind: 'carry', label: 'ภาพและประโยคที่ออกแบบไว้ในโซนการสร้างประโยค', mission: 'Z1-O', keys: ['novel'] },
      { kind: 'modifiers', id: 'mods', label: 'คำขยายที่แปลกใหม่', base: 'ประโยคที่แต่งไว้', categories: CAT_LATP },
      { kind: 'list', id: 'expanded', label: 'ประโยคที่ขยายแล้ว', tag: { key: 'part', label: 'ขยายด้วย', options: CAT_LATP } },
      { kind: 'text', id: 'reason', label: 'เหตุผลประกอบ' },
      { kind: 'drawing', id: 'more', label: 'ภาพประกอบเพิ่มเติม (ต่อจากภาพเดิม)', carry: { mission: 'Z1-O', drawing: 'story' } },
    ],
  },
  'Z2-E': {
    words: ['นักเรียน', 'กวาด', 'ห้องเรียน', 'ขยัน', 'อย่างตั้งใจ', 'หลังเลิกเรียน', 'ตอนเช้า', 'ชั้น ป.3', 'ด้วยไม้กวาดดอกหญ้า'],
    sections: [
      { kind: 'modifiers', id: 'mods', label: 'คำขยาย', base: 'นักเรียนกวาดห้องเรียน', categories: CAT_LATP },
      { kind: 'list', id: 'expanded', label: 'ประโยคที่ขยายให้มีรายละเอียดมากที่สุด', tag: { key: 'part', label: 'ขยายด้วย', options: CAT_LATP } },
      { kind: 'checklist', id: 'check', label: 'เกณฑ์ตรวจประโยค', items: [...CHECK_BASIC, 'คำขยายอยู่ติดกับคำที่ขยาย', 'บอกลักษณะ การกระทำ เวลา หรือสถานที่'] },
    ],
  },
  // ----- โซน 3 การใช้ภาษา -----
  'Z3-F': {
    words: ['แม่', 'คุณแม่', 'แมว', 'กิน', 'ปลา', 'บนโต๊ะอาหาร', 'ครับ', 'ค่ะ', 'นะคะ', 'จ๊ะ', 'ขอโทษ'],
    sections: [
      { kind: 'listeners', id: 'talk', label: 'การ์ดผู้ฟัง', listeners: ['แม่'], slots: [{ id: 'say', label: 'ถ้อยคำบอกแม่', multi: true }] },
    ],
  },
  'Z3-FL': {
    words: ['น้อง', 'สุนัข', 'ลูกบอล', 'ไหม', 'ช่วย', 'หน่อย', 'กรุณา', 'ครับ', 'ค่ะ', 'นะ', 'จ้ะ'],
    sections: [
      { kind: 'listeners', id: 'talk', label: 'การ์ดผู้ฟัง 3 กลุ่ม', listeners: ['ผู้ใหญ่', 'เพื่อน', 'น้อง'],
        slots: [{ id: 'story', label: 'เล่าเรื่อง' }, { id: 'question', label: 'ประโยคคำถาม' }, { id: 'request', label: 'ประโยคขอร้องหรือคำสั่ง' }] },
    ],
  },
  'Z3-O': {
    words: ['ว่าว', 'ทุ่งนา', 'ลม', 'ครับ', 'ค่ะ', 'นะคะ', 'ลองฟังเรื่องนี้'],
    sections: [
      { kind: 'carry', label: 'ภาพเรื่องราวและประโยคที่ขยายไว้', mission: 'Z2-O', keys: ['expanded'] },
      { kind: 'drawing', id: 'point', label: 'ชี้ภาพประกอบ (วงหรือลูกศรตรงส่วนของภาพที่เล่า)', carry: { mission: 'Z2-O', drawing: 'more' } },
      { kind: 'listeners', id: 'talk', label: 'การ์ดผู้ฟัง', listeners: ['เพื่อน', 'คุณครู'],
        slots: [{ id: 'say', label: 'ถ้อยคำเล่าเรื่อง', multi: true }, { id: 'reason', label: 'เหตุผลประกอบ' }, { id: 'point', label: 'ส่วนของภาพที่ชี้' }] },
    ],
  },
  'Z3-E': {
    words: ['คุณครู', 'นักเรียน', 'กวาด', 'ห้องเรียน', 'ครับ', 'ค่ะ', 'เพราะ', 'จึง'],
    sections: [
      { kind: 'carry', label: 'ประโยคที่ขยายแล้ว', mission: 'Z2-E', keys: ['expanded'] },
      { kind: 'listeners', id: 'talk', label: 'การ์ดผู้ฟัง', listeners: ['คุณครู'],
        slots: [{ id: 'say', label: 'ถ้อยคำเล่าเรื่องให้คุณครูฟัง', multi: true }, { id: 'reason', label: 'เหตุผลของการเพิ่มรายละเอียด' }] },
    ],
  },
};

// ---------- ฐานการช่วยเหลือ 4 แบบ ----------
export const HELP_KINDS = [
  { id: 'Conceptual', th: 'ความรู้ที่ต้องใช้', icon: '💡' },
  { id: 'Metacognitive', th: 'ถามตัวเองระหว่างคิด', icon: '🪞' },
  { id: 'Procedural', th: 'ขั้นตอนการใช้เครื่องมือ', icon: '🛠️' },
  { id: 'Strategic', th: 'กลยุทธ์การคิด', icon: '🧭' },
] as const;

export const HELP: Record<string, Record<string, string[]>> = {
  Conceptual: {
    1: ['ประโยคมี 2 ภาค: ภาคประธาน (ใคร/อะไร) + ภาคแสดง (ทำอะไร/เป็นอย่างไร) เช่น แมว | กินปลา',
      'ประโยค 2 ส่วน = ประธาน + กริยา (นกบิน) · ประโยค 3 ส่วน = ประธาน + กริยา + กรรม (แมวกินปลา)',
      'คำนามคือชื่อคน สัตว์ สิ่งของ สถานที่ · คำกริยาคือคำบอกการกระทำ',
      'ชนิดประโยค: บอกเล่า · ปฏิเสธ (ไม่ ไม่ได้) · คำถาม (ไหม ใคร อะไร ที่ไหน) · ขอร้อง (ช่วย โปรด กรุณา…หน่อย) หรือคำสั่ง (จง ห้าม อย่า)'],
    2: ['คำขยายช่วยบอกรายละเอียด: ลักษณะ (สีส้ม ตัวโต) · การกระทำ (อย่างรวดเร็ว) · เวลา (ตอนเช้า) · สถานที่ (บนโต๊ะ)',
      'คำขยายวางติดคำที่มันขยาย: แมว"สีส้ม" กิน"อย่างเร็ว"',
      'ขยายได้หลายรูปแบบ: เปลี่ยนผู้ทำ เปลี่ยนการกระทำ เพิ่มเวลา หรือเพิ่มสถานที่'],
    3: ['ผู้ฟังต่างกัน ถ้อยคำต่างกัน: ผู้ใหญ่ → คำสุภาพ + ครับ/ค่ะ · เพื่อน → เป็นกันเอง สุภาพ · น้อง → ง่าย อ่อนโยน + นะ/จ้ะ',
      'คำสุภาพ เช่น รับประทาน (กิน) · ขอบคุณ · ขอโทษ · กรุณา',
      'คำลงท้าย: ครับ (ผู้ชาย) · ค่ะ/คะ/นะคะ (ผู้หญิง) · นะ จ้ะ (กับเพื่อนหรือน้อง)'],
  },
  Metacognitive: {
    1: ['ฉันเข้าใจคำสั่งภารกิจไหม คำสั่งให้ทำอะไรบ้าง', 'ประโยคของฉันบอกครบไหมว่า ใคร ทำอะไร', 'อ่านออกเสียงแล้วฟังเป็นธรรมชาติไหม'],
    2: ['ฉันขยายคำไหน และขยายเพื่อบอกอะไร', 'เติมคำขยายแล้วความหมายยังถูกต้องไหม', 'ยังเพิ่มรายละเอียดได้อีกด้านไหน (ลักษณะ เวลา สถานที่ การกระทำ)'],
    3: ['ฉันกำลังพูดกับใคร เขาเป็นผู้ใหญ่ เพื่อน หรือน้อง', 'ถ้าฉันเป็นผู้ฟัง ฉันจะรู้สึกอย่างไร', 'ถ้อยคำของฉันสุภาพและชัดเจนแล้วหรือยัง'],
  },
  Procedural: {
    0: ['1) กดบล็อกคำในชั้นวาง หรือพิมพ์คำเองแล้วกด ＋ เพิ่มบล็อก', '2) กด ◀ ▶ เพื่อย้ายบล็อก หรือลากวาง · กด ✕ เพื่อลบ', '3) กด "บันทึกประโยค" — แก้ภายหลังได้ ระบบเก็บฉบับก่อนไว้เทียบเสมอ',
      'ภารกิจที่กำหนด 5 นาที: กด ▶ เริ่มจับเวลา ประโยคที่บันทึกหลังหมดเวลาจะถูกทำเครื่องหมายให้ครูพิจารณา',
      'พื้นที่วาดภาพ: เลือกสีและขนาดพู่กัน วาด แล้วกด "บันทึกภาพ"',
      'ทำเสร็จแล้ว: ผลัดกันเสนอไอเดียในแท็บแลกเปลี่ยนเรียนรู้ แล้วกด "ส่งให้ครู/โค้ชตรวจ"'],
  },
  Strategic: {
    Fluency: ['ถามตัวเองทีละคำถาม: ใคร? ทำอะไร? ที่ไหน? เมื่อไร? แต่ละคำตอบได้ประโยคใหม่', 'เปลี่ยนผู้ทำทีละตัว: แมว → ลูกแมว → คุณยาย', 'ตั้งเป้าเล็ก ๆ: ทุก 1 นาทีเขียนให้ได้อีก 1 ประโยค'],
    Flexibility: ['เปลี่ยนมุมมอง: ถ้าเล่าในมุมของสุนัขจะเป็นอย่างไร', 'ใช้คำสังเกตเปลี่ยนชนิดประโยค: ไม่ → ปฏิเสธ · ไหม → คำถาม · ช่วย…หน่อย → ขอร้อง', 'เปลี่ยนส่วนที่ขยายทีละส่วน: ผู้ทำ → การกระทำ → เวลา → สถานที่'],
    Originality: ['ลองคิดว่า "ถ้า…จะเป็นอย่างไร" เช่น ถ้าว่าวพูดได้', 'จับคู่สิ่งที่ไม่น่าเข้ากัน: ว่าว + มังกร + ข้าว', 'คิดคำตอบแรกแล้วตัดทิ้ง ลองหาคำตอบที่ไม่มีใครคิด'],
    Elaboration: ['อ่านทีละคำแล้วถาม: ใครทำ? ทำอะไร? เรียงถูกไหม?', 'เพิ่มรายละเอียดทีละด้านจนครบ ลักษณะ → การกระทำ → เวลา → สถานที่', 'อธิบายเหตุผล: "ฉันเพิ่ม…เพราะ…"'],
  },
};

// ---------- ศูนย์การเรียนรู้ ----------
export const LESSONS: Record<number, { title: string; body: string; parts?: [string, string][] }[]> = {
  1: [
    { title: 'ภาคประธาน + ภาคแสดง', body: 'ประโยคบอกว่า "ใคร" "ทำอะไร" แตะแต่ละส่วนเพื่อดูหน้าที่', parts: [['แมว', 'ภาคประธาน'], ['กินปลา', 'ภาคแสดง']] },
    { title: 'ประโยค 2 ส่วน', body: 'ประธาน + กริยา', parts: [['น้อง', 'ประธาน'], ['วิ่ง', 'กริยา']] },
    { title: 'ประโยค 3 ส่วน', body: 'ประธาน + กริยา + กรรม', parts: [['สุนัข', 'ประธาน'], ['คาบ', 'กริยา'], ['ลูกบอล', 'กรรม']] },
    { title: 'ประโยค 4 ชนิด', body: 'บอกเล่า: น้องเล่นลูกบอล · ปฏิเสธ: น้องไม่เล่นลูกบอล · คำถาม: น้องเล่นลูกบอลไหม · ขอร้อง/คำสั่ง: ช่วยเก็บลูกบอลหน่อย / จงเก็บลูกบอล' },
  ],
  2: [
    { title: 'คำขยายบอกลักษณะ', body: 'บอกว่าเป็นอย่างไร', parts: [['แมว', 'ประธาน'], ['สีส้ม', 'ขยายลักษณะ'], ['กินปลา', 'ภาคแสดง']] },
    { title: 'คำขยายบอกเวลา', body: 'บอกว่าเมื่อไร', parts: [['แมวกินปลา', 'ประโยคหลัก'], ['ตอนเย็น', 'ขยายเวลา']] },
    { title: 'คำขยายบอกสถานที่', body: 'บอกว่าที่ไหน', parts: [['แมวกินปลา', 'ประโยคหลัก'], ['บนโต๊ะอาหาร', 'ขยายสถานที่']] },
    { title: 'คำขยายบอกการกระทำ', body: 'บอกว่าทำอย่างไร', parts: [['นักเรียนกวาดห้องเรียน', 'ประโยคหลัก'], ['อย่างตั้งใจ', 'ขยายการกระทำ']] },
  ],
  3: [
    { title: 'พูดกับผู้ใหญ่', body: 'ใช้คำสุภาพ + ครับ/ค่ะ เช่น "คุณแม่คะ แมวกินปลาบนโต๊ะอาหารค่ะ"' },
    { title: 'พูดกับเพื่อน', body: 'เป็นกันเองแต่สุภาพ เช่น "เธอ ช่วยดูสุนัขหน่อยนะ"' },
    { title: 'พูดกับน้อง', body: 'ใช้คำง่าย อ่อนโยน เช่น "น้องจ๋า ระวังลูกบอลนะจ๊ะ"' },
    { title: 'คำลงท้าย', body: 'ครับ · ค่ะ · คะ · นะคะ · นะครับ · จ้ะ · นะ เลือกให้เหมาะกับผู้ฟังและผู้พูด' },
  ],
};
