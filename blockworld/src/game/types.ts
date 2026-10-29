// ชนิดข้อมูลหลักของเกม BLOCK WORLD

export type ZoneId = 0 | 1 | 2;
export type CreativityTag = 'F' | 'FL' | 'O' | 'E';
export type Role = 'subject' | 'verb' | 'object' | 'modifier' | 'other';
/** ช่องภารกิจใช้รหัสด้าน F / FL / O / E (รูปทรงตามตารางที่ 2) */
export type SpaceKind = 'gate' | 'learn' | 'word' | 'bonus' | 'creative' | 'build' | 'rest' | CreativityTag;
export type HelpType = 'conceptual' | 'procedural' | 'strategic' | 'metacognitive';
export type ScenarioId = 'A' | 'B' | 'C' | 'D';

export interface StarterWord { text: string; role: Role }

/** ช่องคำตอบหนึ่งช่องในใบงานของผู้เล่นแต่ละคน */
export interface AnswerSlot {
  key: string;
  label: string;
  /** true = แสดงเครื่องมือเรียงบล็อกคำ */
  builder?: boolean;
  multiline?: boolean;
  placeholder?: string;
  /** แสดงการ์ดผู้ฟัง (กลไกการ์ดผู้ฟัง) */
  listener?: string;
}

export interface SlotGroup { title: string; slots: AnswerSlot[] }

/** เกณฑ์ตรวจเบื้องต้น เป็นเพียงคำแนะนำ ไม่ใช่การตัดสินผ่าน/ไม่ผ่าน */
export interface AutoCheck {
  label: string;
  slot?: string;
  anyOf?: string[];
  allOf?: string[];
  noneOf?: string[];
}

/** รายการคำตอบหลายข้อ (ภารกิจ "ให้ได้มากที่สุด" หรือ "หลายรูปแบบ") */
export interface ListSpec {
  label: string;
  placeholder: string;
  /** ป้ายกำกับแต่ละข้อ เช่น ส่วนที่ขยาย */
  tagLabel?: string;
  tags?: string[];
  minItems: number;
  /** ต้องมีป้ายกำกับไม่ซ้ำกันอย่างน้อยกี่แบบ */
  minDistinctTags?: number;
  itemChecks?: AutoCheck[];
}

export interface Mission {
  id: string;
  zone: ZoneId;
  area: CreativityTag;
  areaName: string;
  shape: string;
  indicators: string[];
  scenario: ScenarioId;
  title: string;
  /** คำสั่งภารกิจตามตารางที่ 2 (คงข้อความเดิม) */
  prompt: string;
  minutes?: number;
  baseSentence?: string;
  reuse?: { from: string; slot?: string; label: string; drawing?: boolean };
  broken?: string[];
  list?: ListSpec;
  groups: SlotGroup[];
  parts?: { key: string; label: string; placeholder: string }[];
  needReason: boolean;
  reasonLabel?: string;
  drawing?: 'required' | 'optional';
  cubes?: boolean;
  dixit?: boolean;
  listeners?: string[];
  starterWords: StarterWord[];
  criteria: string[];
  autoChecks: AutoCheck[];
  reward: string;
  lessons: number[];
  hint: string;
  examplesForTeacher: string[];
  coachQuestions: string[];
}

export interface Boss {
  zone: ZoneId;
  name: string;
  emoji: string;
  crystal: string;
  crystalColor: string;
  intro: string;
  defeatText: string;
  criteria: string[];
}

export interface Player { id: string; name: string; avatar: string; color: string }

export type MissionStatus = 'todo' | 'doing' | 'pending' | 'revise' | 'done';
export type BossStatus = 'locked' | 'available' | 'attempted' | 'defeated';
export type WorkStatus = 'draft' | 'pending' | 'revise' | 'approved' | 'saved';
export type WorkKind = 'mission' | 'boss' | 'tower' | 'creative' | 'word' | 'rest';

export interface SlotAnswer {
  first: string; // คำตอบแรกที่บันทึก (ก่อนแก้)
  final: string; // คำตอบล่าสุด (หลังแก้)
  history: { text: string; at: number; by: string }[];
}

export interface Item { text: string; first: string; by: string; tag?: string; at: number }

export type ExchangeKind = 'listen' | 'alternative' | 'improve' | 'reply';
export interface ExchangeEntry { by: string; kind: ExchangeKind; text: string; at: number }

export interface Feedback { at: number; by: 'coach' | 'peer'; kind: 'approve' | 'revise' | 'note'; text: string }

export interface Work {
  id: string;
  kind: WorkKind;
  refId: string;
  title: string;
  zone?: ZoneId;
  authorId: string;
  participants: string[];
  problem?: { what: string; how: string };
  /** คีย์ `${playerId}|${slot}` = ใบงานรายคน */
  answers: Record<string, SlotAnswer>;
  items?: Item[];
  checklist?: Record<string, boolean>;
  drawings?: Record<string, string>;
  /** เวลาสิ้นสุดของตัวจับเวลารายคน */
  timers?: Record<string, number>;
  cubes?: Record<string, string[]>;
  dixit?: { teller: string; secret: number; cards: number[]; guesses: Record<string, number>; sentence: string } | null;
  reason: string;
  exchange: ExchangeEntry[];
  help: HelpType[];
  status: WorkStatus;
  feedback: Feedback[];
  /** คะแนนกิจกรรมในเกม 0–4 รายคน (ครูให้เพื่อข้อมูลย้อนกลับเท่านั้น ไม่ใช่คะแนนเครื่องมือวิจัย) */
  ratings?: Record<string, number>;
  startedAt: number;
  endedAt?: number;
  creativityTags: CreativityTag[];
  indicators?: string[];
}

export interface CoachNote {
  id: string;
  at: number;
  playerId?: string;
  indicator?: string;
  workId?: string;
  text: string;
}

export interface Settings {
  approvalMode: 'pin' | 'peer';
  pin: string;
  speech: boolean;
}

export interface GameState {
  version: 2;
  started: boolean;
  players: Player[];
  positions: number[];
  activePlayer: number;
  zone: ZoneId;
  phase: 'roll' | 'moving' | 'action';
  turnActed: boolean;
  /** 12 ภารกิจหลักตามตารางที่ 2 (โซนละ 4) */
  missionProgress: MissionStatus[];
  bossStatus: BossStatus[];
  crystalCount: number;
  blocks: number;
  builds: { id: string; buildingId: string; by: string; at: number }[];
  works: Work[];
  responsesByStudent: Record<string, string[]>;
  helpUsed: { at: number; type: HelpType; playerId: string; context: string }[];
  coachNotes: CoachNote[];
  towerProgress: boolean[];
  diceHistory: { playerId: string; value: number; at: number; zone: ZoneId }[];
  currentMission: string | null;
  timer: { label: string; endsAt: number } | null;
  wordBank: string[];
  settings: Settings;
  log: { at: number; text: string }[];
  finished: boolean;
}
