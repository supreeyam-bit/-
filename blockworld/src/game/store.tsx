// ศูนย์กลางสถานะของแอป: state เกม หน้าต่างที่เปิดอยู่ โหมดครู และข้อความแจ้งเตือน
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GameState, SpaceKind } from './types';
import { load, save } from './rules';
import { speak } from './speech';

export type Modal =
  | { type: 'mission'; workId: string }
  | { type: 'missionBoard'; fromSpace?: boolean }
  | { type: 'boss' }
  | { type: 'tower' }
  | { type: 'city' }
  | { type: 'rules' }
  | { type: 'intro' }
  | { type: 'space'; kind: SpaceKind }
  | { type: 'problem' }
  | { type: 'builder' }
  | { type: 'exchangeLog' }
  | { type: 'history' }
  | { type: 'dashboard' }
  | { type: 'ending' };

export type Drawer = { type: 'learning'; topic?: number } | { type: 'help' } | { type: 'coach' } | null;

interface Ctx {
  state: GameState | null;
  setState: (fn: (s: GameState) => GameState) => void;
  replaceState: (s: GameState | null) => void;
  modal: Modal | null;
  open: (m: Modal) => void;
  close: () => void;
  drawer: Drawer;
  openDrawer: (d: Drawer) => void;
  coachUnlocked: boolean;
  setCoachUnlocked: (v: boolean) => void;
  toasts: { id: number; text: string }[];
  toast: (text: string) => void;
  say: (text: string) => void;
}

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setRaw] = useState<GameState | null>(() => load());
  const [modal, setModal] = useState<Modal | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [coachUnlocked, setCoachUnlocked] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    if (state) save(state);
  }, [state]);

  const setState = useCallback((fn: (s: GameState) => GameState) => setRaw((s) => (s ? fn(s) : s)), []);
  const toast = useCallback((text: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const say = useCallback(
    (text: string) => {
      if (state && !state.settings.speech) return toast('ปิดเสียงอ่านอยู่ — เปิดได้ที่ปุ่ม 🔈 ด้านบน');
      if (!speak(text)) toast('อุปกรณ์นี้อ่านออกเสียงไม่ได้ กรุณาอ่านข้อความบนจอหรือให้เพื่อน/ครูช่วยอ่าน');
    },
    [state, toast],
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      setState,
      replaceState: setRaw,
      modal,
      open: setModal,
      close: () => setModal(null),
      drawer,
      openDrawer: setDrawer,
      coachUnlocked,
      setCoachUnlocked,
      toasts,
      toast,
      say,
    }),
    [state, setState, modal, drawer, coachUnlocked, toasts, toast, say],
  );
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const c = useContext(GameCtx);
  if (!c) throw new Error('useGame ต้องอยู่ภายใน GameProvider');
  return c;
}

/** ใช้ในหน้าที่แน่ใจว่าเกมเริ่มแล้ว */
export function useStarted() {
  const c = useGame();
  if (!c.state) throw new Error('เกมยังไม่เริ่ม');
  return { ...c, state: c.state };
}
