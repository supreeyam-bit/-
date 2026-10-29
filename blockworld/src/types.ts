export type AreaEn = 'Fluency' | 'Flexibility' | 'Originality' | 'Elaboration';
export type ZoneId = 1 | 2 | 3;

export interface Mission {
  id: string;
  zone: ZoneId;
  zone_name: string;
  area: string;
  area_en: AreaEn;
  area_index: number;
  situation: string;
  indicator: string;
  timed_minutes: number | null;
  instruction_exact_from_table_2: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  token: string;
  pos: number; // ตำแหน่งบนวงโซนปัจจุบัน 0–11
}

/** หนึ่งคำตอบ (ประโยค ถ้อยคำ คำขยาย หรือเหตุผล) เก็บประวัติฉบับก่อนไว้เสมอ */
export interface Entry {
  id: string;
  text: string;
  tokens?: string[];
  history: { text: string; at: number }[];
  meta?: Record<string, string>;
  at: number;
}

export type WorkStatus = 'draft' | 'submitted' | 'approved' | 'revise';

export interface Work {
  items: Record<string, Entry[]>;
  checks: Record<string, boolean>;
  drawings: Record<string, string>;
  status: WorkStatus;
  submittedAt?: number;
  reviewedAt?: number;
}

export interface ExchangeMsg {
  id: string;
  playerId: string;
  kind: 'idea' | 'feedback';
  text: string;
  at: number;
}

export interface TimerState {
  durationMs: number;
  startedAt: number | null; // เวลาเริ่มรอบที่กำลังเดิน
  elapsedMs: number; // เวลาที่ใช้ไปก่อนหยุดชั่วคราว
}

export type HelpKind = 'Conceptual' | 'Metacognitive' | 'Procedural' | 'Strategic' | 'Teacher';

export interface HelpLog {
  id: string;
  at: number;
  playerId: string | null;
  missionId: string | null;
  zone: number;
  kind: HelpKind;
  text?: string;
}

export interface CoachLog {
  id: string;
  at: number;
  playerId: string;
  missionId: string;
  action: 'approve' | 'revise' | 'note';
  text?: string;
}

export interface GameState {
  version: 3;
  started: boolean;
  players: Player[];
  current: number;
  zone: number; // 1–3 กำลังเล่น · 4 = ครบสามโซน
  phase: 'roll' | 'moving' | 'landed';
  lastRoll: number | null;
  works: Record<string, Record<string, Work>>;
  exchange: Record<string, ExchangeMsg[]>;
  timers: Record<string, TimerState>;
  completed: Record<string, boolean>;
  bossDefeated: Record<number, boolean>;
  bossPower: Record<number, Record<string, string>>; // zone → playerId → entry text ที่เลือกส่งพลัง
  helpLog: HelpLog[];
  coachLog: CoachLog[];
  reflections: Record<string, Record<string, string>>;
  teacherPin: string;
  events: { at: number; text: string }[];
}
