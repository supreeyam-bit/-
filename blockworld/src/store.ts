import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { MISSIONS, missionById } from './data';
import type { CoachLog, Entry, GameState, HelpKind, Player, Work } from './types';

export const STORAGE_KEY = 'blockworld-v3';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyWork = (): Work => ({ items: {}, checks: {}, drawings: {}, status: 'draft' });

export function newGame(): GameState {
  return {
    version: 3, started: false, players: [], current: 0, zone: 1, phase: 'roll', lastRoll: null,
    works: {}, exchange: {}, timers: {}, completed: {}, bossDefeated: {}, bossPower: {},
    helpLog: [], coachLog: [], reflections: {}, teacherPin: '', events: [],
  };
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const g = JSON.parse(raw) as GameState;
      if (g.version === 3) return { ...newGame(), ...g };
    }
  } catch { /* ไม่มีที่เก็บข้อมูล เริ่มเกมใหม่ */ }
  return newGame();
}

export type Updater = (fn: (g: GameState) => void) => void;

export function useGameState() {
  const [game, setGame] = useState<GameState>(loadGame);
  const [saveError, setSaveError] = useState('');
  const timer = useRef<number>();

  const update: Updater = useCallback((fn) => {
    setGame((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
        setSaveError('');
      } catch {
        setSaveError('บันทึกในเครื่องไม่ได้ (พื้นที่เต็มหรือถูกปิดกั้น) — ส่งออก JSON เก็บไว้ก่อน');
      }
    }, 250);
  }, [game]);

  return { game, setGame, update, saveError };
}

export interface GameCtx {
  game: GameState;
  update: Updater;
  teacher: boolean;
  setTeacher: (v: boolean) => void;
}
export const Ctx = createContext<GameCtx>(null!);
export const useGame = () => useContext(Ctx);

// ---------- ตัวช่วยแก้ไขสถานะ (ใช้ภายใน update) ----------
export function logEvent(g: GameState, text: string) {
  g.events.unshift({ at: Date.now(), text });
  g.events.length = Math.min(g.events.length, 200);
}

export function getWork(g: GameState, missionId: string, playerId: string): Work {
  g.works[missionId] ??= {};
  return (g.works[missionId][playerId] ??= emptyWork());
}

export function readWork(g: GameState, missionId: string, playerId: string): Work {
  return g.works[missionId]?.[playerId] ?? emptyWork();
}

/** บันทึกคำตอบ ถ้ามี id เดิมจะเก็บข้อความเก่าไว้ในประวัติ (ฉบับก่อน) */
export function saveEntry(g: GameState, missionId: string, playerId: string, key: string, entry: Partial<Entry> & { text: string }, single = false) {
  const w = getWork(g, missionId, playerId);
  const list = (w.items[key] ??= []);
  const now = Date.now();
  const late: Record<string, string> = isTimeUp(g, missionId) ? { late: 'บันทึกหลังหมดเวลา' } : {};
  const existing = entry.id ? list.find((e) => e.id === entry.id) : single ? list[0] : undefined;
  if (existing) {
    if (existing.text !== entry.text) existing.history.push({ text: existing.text, at: existing.at });
    existing.text = entry.text;
    existing.tokens = entry.tokens;
    existing.meta = { ...existing.meta, ...entry.meta, ...late };
    existing.at = now;
  } else {
    list.push({ id: uid(), text: entry.text, tokens: entry.tokens, history: [], meta: { ...entry.meta, ...late }, at: now });
  }
  if (w.status === 'approved' || w.status === 'submitted') w.status = 'draft';
}

export function removeEntry(g: GameState, missionId: string, playerId: string, key: string, id: string) {
  const w = getWork(g, missionId, playerId);
  w.items[key] = (w.items[key] ?? []).filter((e) => e.id !== id);
}

export function moveEntry(g: GameState, missionId: string, playerId: string, key: string, id: string, dir: -1 | 1) {
  const list = getWork(g, missionId, playerId).items[key] ?? [];
  const i = list.findIndex((e) => e.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
}

export function timeLeftMs(g: GameState, missionId: string, now = Date.now()) {
  const t = g.timers[missionId];
  if (!t) return null;
  const used = t.elapsedMs + (t.startedAt ? now - t.startedAt : 0);
  return Math.max(0, t.durationMs - used);
}
export const isTimeUp = (g: GameState, missionId: string) => timeLeftMs(g, missionId) === 0;

export function logHelp(g: GameState, kind: HelpKind, playerId: string | null, missionId: string | null, text?: string) {
  g.helpLog.unshift({ id: uid(), at: Date.now(), kind, playerId, missionId, zone: missionId ? missionById(missionId).zone : g.zone, text });
}

export function coach(g: GameState, missionId: string, playerId: string, action: CoachLog['action'], text?: string) {
  const w = getWork(g, missionId, playerId);
  g.coachLog.unshift({ id: uid(), at: Date.now(), playerId, missionId, action, text });
  if (action === 'approve') { w.status = 'approved'; w.reviewedAt = Date.now(); }
  if (action === 'revise') { w.status = 'revise'; w.reviewedAt = Date.now(); }
  refreshCompletion(g, missionId);
}

export function ideasShared(g: GameState, missionId: string) {
  const msgs = g.exchange[missionId] ?? [];
  return g.players.every((p) => msgs.some((m) => m.playerId === p.id && m.kind === 'idea'));
}

/** ภารกิจสำเร็จเมื่อทุกคนเสนอไอเดียแล้ว และครู/โค้ชรับรองชิ้นงานของทุกคน */
export function refreshCompletion(g: GameState, missionId: string) {
  const allApproved = g.players.length > 0 && g.players.every((p) => readWork(g, missionId, p.id).status === 'approved');
  const done = allApproved && ideasShared(g, missionId);
  if (done && !g.completed[missionId]) {
    const m = missionById(missionId);
    logEvent(g, `ภารกิจ ${m.zone_name} · ${m.area} สำเร็จ`);
  }
  g.completed[missionId] = done;
}

export const zoneMissions = (zone: number) => MISSIONS.filter((m) => m.zone === zone);
export const zoneComplete = (g: GameState, zone: number) => zoneMissions(zone).every((m) => g.completed[m.id]);
export const missionUnlocked = (g: GameState, zone: number) => zone <= g.zone;

export function playerStars(g: GameState, playerId: string) {
  return MISSIONS.filter((m) => readWork(g, m.id, playerId).status === 'approved').length;
}

export function makePlayers(list: { name: string; color: string; token: string }[]): Player[] {
  return list.map((p) => ({ id: uid(), ...p, pos: 0 }));
}

