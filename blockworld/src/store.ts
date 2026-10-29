// สถานะเกมทั้งหมด เก็บใน localStorage ของเครื่อง (ค่าเริ่มต้น)
import { useCallback, useEffect, useState } from 'react';
import { MISSIONS, missionsOfZone } from './data';

export interface Player { id: string; name: string; color: string; pos: number }

export interface Entry {
  id: string;
  text: string;
  blocks?: string[];
  before?: string; // ฉบับก่อนแก้ (ภารกิจแก้ประโยค หรือเมื่อแก้ไขประโยคที่บันทึกแล้ว)
  tags: string[];
  audience?: string;
  parts: string[]; // ส่วนที่ขยาย
  explanation?: string;
  selfCheck: string[];
  timeUp?: boolean;
  at: number;
  revisedAt?: number;
}

export type WorkStatus = 'draft' | 'submitted' | 'approved' | 'revise';
export interface Note { by: 'teacher'; text: string; at: number }
export interface Work {
  entries: Entry[];
  drawings: string[]; // data URL (PNG)
  explanation: string; // คำอธิบายเหตุผลภาพรวม
  status: WorkStatus;
  teacherComment?: string;
  notes: Note[];
  updatedAt: number;
}

export interface Idea { id: string; playerId: string; text: string; at: number; buildsOn?: string }
export interface HelpUse { playerId: string; missionId?: string; type: string; at: number; by?: 'teacher'; text?: string }

export interface GameState {
  version: 1;
  startedAt: number;
  players: Player[];
  turn: number;
  zone: number; // 1–3 โซนที่เปิดอยู่
  lastRoll: number | null;
  works: Record<string, Record<string, Work>>;
  ideas: Record<string, Idea[]>;
  help: HelpUse[];
  bossDefeated: boolean[];
  reflections: Record<string, Record<string, string>>; // area -> player -> text
  log: { at: number; text: string }[];
  teacherPin: string;
  finished: boolean;
}

const KEY = 'blockworld-save-v1';

export const uid = () => Math.random().toString(36).slice(2, 10);

export function newGame(players: { name: string; color: string }[], teacherPin: string): GameState {
  return {
    version: 1,
    startedAt: Date.now(),
    players: players.map((p) => ({ id: uid(), name: p.name, color: p.color, pos: 0 })),
    turn: 0,
    zone: 1,
    lastRoll: null,
    works: {},
    ideas: {},
    help: [],
    bossDefeated: [false, false, false],
    reflections: {},
    log: [{ at: Date.now(), text: 'เริ่มเกม BLOCK WORLD: อาณาจักรนักสร้างโลกแห่งคำ' }],
    teacherPin,
    finished: false,
  };
}

export const emptyWork = (): Work => ({ entries: [], drawings: [], explanation: '', status: 'draft', notes: [], updatedAt: Date.now() });

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s.version === 1 && Array.isArray(s.players) ? s : null;
  } catch {
    return null;
  }
}

export function save(s: GameState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* เครื่องไม่ให้เก็บข้อมูล (เช่นโหมดส่วนตัว) — เล่นต่อได้แต่ไม่บันทึก */
  }
}

export type Update = (fn: (draft: GameState) => void) => void;

export function useGame() {
  const [state, setState] = useState<GameState | null>(() => load());
  useEffect(() => save(state), [state]);
  const update: Update = useCallback((fn) => {
    setState((prev) => {
      if (!prev) return prev;
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);
  return { state, setState, update };
}

// ---------- ตัวช่วยอ่านสถานะ ----------
export const getWork = (s: GameState, missionId: string, playerId: string): Work => s.works[missionId]?.[playerId] ?? emptyWork();

export function ensureWork(d: GameState, missionId: string, playerId: string): Work {
  d.works[missionId] ??= {};
  d.works[missionId][playerId] ??= emptyWork();
  return d.works[missionId][playerId];
}

export const hasIdea = (s: GameState, missionId: string, playerId: string) => (s.ideas[missionId] ?? []).some((i) => i.playerId === playerId);

// ภารกิจผ่าน (ทั้งทีม): ทุกคนเสนอไอเดียในศูนย์แลกเปลี่ยนเรียนรู้แล้ว และครูรับรองผลงานของทุกคน
export function missionPassed(s: GameState, missionId: string) {
  return s.players.every((p) => hasIdea(s, missionId, p.id) && getWork(s, missionId, p.id).status === 'approved');
}

export const zoneCleared = (s: GameState, zone: number) => missionsOfZone(zone).every((m) => missionPassed(s, m.id));
export const crystals = (s: GameState) => s.bossDefeated.filter(Boolean).length;

export function missionUnlocked(s: GameState, missionId: string) {
  const m = MISSIONS.find((x) => x.id === missionId)!;
  return m.zone <= s.zone;
}

export function addLog(d: GameState, text: string) {
  d.log.unshift({ at: Date.now(), text });
  if (d.log.length > 200) d.log.length = 200;
}
