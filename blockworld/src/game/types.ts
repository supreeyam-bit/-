// ชนิดข้อมูลหลักของเกม BLOCK WORLD

export type ZoneId = 0 | 1 | 2;
export type CreativityTag = 'F' | 'FL' | 'O' | 'E';
export type Role = 'subject' | 'verb' | 'object' | 'modifier' | 'other';
export type SpaceKind = 'gate' | 'learn' | 'mission' | 'word' | 'bonus' | 'creative' | 'build' | 'rest';
export type HelpType = 'conceptual' | 'procedural' | 'strategic' | 'metacognitive';

export interface StarterWord { text: string; role: Role }

/** ช่องคำตอบหนึ่งช่องในภารกิจ (บางภารกิจต้องตอบหลายช่อง เช่น พูดกับเพื่อน / พูดกับคุณครู) */
export interface AnswerSlot {
  key: string;
  label: string;
  /** true = แสดงเครื่องมือเรียงบล็อกคำ */
  builder?: boolean;
  /** มีตัวเลือกให้เลือกก่อน แล้วยังต้องเขียนเหตุผล/ปรับเอง */
  choices?: string[];
  multiline?: boolean;
  placeholder?: string;
}

/** เกณฑ์ตรวจเบื้องต้น เป็นเพียงคำแนะนำ ไม่ใช่การตัดสินผ่าน/ไม่ผ่าน */
export interface AutoCheck {
  label: string;
  slot?: string;
  anyOf?: string[];
  allOf?: string[];
  noneOf?: string[];
}

export interface Quest {
  id: string;
  zone: ZoneId;
  topic: number; // 1–15
  topicName: string;
  title: string;
  story: string;
  scene: string[];
  sceneCaption: string;
  prompt: string;
  starterWords: StarterWord[];
  slots: AnswerSlot[];
  needReason: boolean;
  reasonLabel?: string;
  hint: string;
  examplesForTeacher: string[];
  successCriteria: string[];
  selfChecklist?: string[];
  autoChecks: AutoCheck[];
  creativityTags: CreativityTag[];
  arSceneKey: string;
  coachQuestions: string[];
}

export interface BossTask {
  key: string;
  title: string;
  prompt: string;
  starterWords: StarterWord[];
  slots: AnswerSlot[];
  selfChecklist?: string[];
  autoChecks: AutoCheck[];
}

export interface Boss {
  zone: ZoneId;
  name: string;
  emoji: string;
  crystal: string;
  crystalColor: string;
  intro: string;
  defeatText: string;
  tasks: BossTask[];
}

export interface Player { id: string; name: string; avatar: string; color: string }

export type TopicStatus = 'todo' | 'doing' | 'pending' | 'revise' | 'done';
export type BossStatus = 'locked' | 'available' | 'attempted' | 'defeated';
export type WorkStatus = 'draft' | 'pending' | 'revise' | 'approved' | 'saved';
export type WorkKind = 'mission' | 'boss' | 'tower' | 'creative' | 'word' | 'rest';

export interface SlotAnswer {
  first: string; // คำตอบแรกที่ส่ง (ก่อนแก้)
  final: string; // คำตอบล่าสุด (หลังแก้)
  history: { text: string; at: number; by: string }[];
}

export type ExchangeKind = 'listen' | 'alternative' | 'improve' | 'reply';
export interface ExchangeEntry { by: string; kind: ExchangeKind; text: string; at: number }

export interface Feedback { at: number; by: 'coach' | 'peer'; kind: 'approve' | 'revise' | 'note'; text: string }

export interface Work {
  id: string;
  kind: WorkKind;
  refId: string;
  title: string;
  zone?: ZoneId;
  topic?: number;
  authorId: string;
  participants: string[];
  problem?: { what: string; how: string };
  answers: Record<string, SlotAnswer>;
  /** สำหรับภารกิจหอคอยด่านคิดคล่อง/ยืดหยุ่น: รายการคำตอบหลายข้อ */
  items?: { text: string; by: string; tag?: string; at: number }[];
  checklist?: Record<string, boolean>;
  reason: string;
  exchange: ExchangeEntry[];
  help: HelpType[];
  status: WorkStatus;
  feedback: Feedback[];
  startedAt: number;
  endedAt?: number;
  creativityTags: CreativityTag[];
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
  version: 1;
  started: boolean;
  players: Player[];
  positions: number[];
  activePlayer: number;
  zone: ZoneId;
  phase: 'roll' | 'moving' | 'action';
  turnActed: boolean;
  topicProgress: TopicStatus[];
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
