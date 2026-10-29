// กติกาและฟังก์ชันจัดการสถานะเกม (pure functions — รับ state เดิม คืน state ใหม่)
import { AREA_ORDER, BOSSES, MISSIONS } from '../data/quests';
import { ZONE_LAYOUTS } from '../data/learning';
import type {
  AutoCheck, CreativityTag, Feedback, GameState, HelpType, Mission, Player, Settings, SpaceKind, Work, WorkKind, ZoneId,
} from './types';

export const STORAGE_KEY = 'blockworld-th-v2';
export const DICE_FACES = [1, 1, 2, 2, 3, 3];
export const SPACES_PER_ZONE = ZONE_LAYOUTS[0].length;
export const TOTAL_SPACES = SPACES_PER_ZONE * ZONE_LAYOUTS.length;

let counter = 0;
export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const DEFAULT_SETTINGS: Settings = { approvalMode: 'pin', pin: '1234', speech: true };

export function newGame(players: Player[], settings: Settings = DEFAULT_SETTINGS): GameState {
  const s: GameState = {
    version: 2,
    started: true,
    players,
    positions: players.map(() => 0),
    activePlayer: 0,
    zone: 0,
    phase: 'roll',
    turnActed: false,
    missionProgress: MISSIONS.map(() => 'todo'),
    bossStatus: ['locked', 'locked', 'locked'],
    crystalCount: 0,
    blocks: 0,
    builds: [],
    works: [],
    responsesByStudent: Object.fromEntries(players.map((p) => [p.id, []])),
    helpUsed: [],
    coachNotes: [],
    towerProgress: [false, false, false, false],
    diceHistory: [],
    currentMission: null,
    timer: null,
    wordBank: [],
    settings,
    log: [{ at: Date.now(), text: 'เริ่มการผจญภัยที่โซน 1 การสร้างประโยค' }],
    finished: false,
  };
  return recompute(s);
}

export const rollDie = (rng: () => number = Math.random) => DICE_FACES[Math.floor(rng() * DICE_FACES.length)];
export const spaceKind = (zone: ZoneId, pos: number): SpaceKind => ZONE_LAYOUTS[zone][pos % SPACES_PER_ZONE];
export const activePlayer = (s: GameState) => s.players[s.activePlayer];
export const playerName = (s: GameState, id: string) => s.players.find((p) => p.id === id)?.name ?? '—';
export const missionsOfZone = (zone: ZoneId) => MISSIONS.filter((m) => m.zone === zone);
export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);
/** คีย์ใบงานรายคน */
export const sheetKey = (pid: string, slot: string) => `${pid}|${slot}`;
export const answerOf = (w: Work | undefined, pid: string, slot: string) => w?.answers[sheetKey(pid, slot)]?.final ?? '';

export function addLog(s: GameState, text: string): GameState {
  return { ...s, log: [...s.log.slice(-79), { at: Date.now(), text }] };
}

/** เดินตัวเดินผู้เล่นที่ถึงตา 1 ช่อง (วนในโซนที่ปลดล็อก) */
export function stepActive(s: GameState): GameState {
  const positions = [...s.positions];
  positions[s.activePlayer] = (positions[s.activePlayer] + 1) % SPACES_PER_ZONE;
  return { ...s, positions };
}

export function recordRoll(s: GameState, value: number): GameState {
  const p = activePlayer(s);
  return addLog(
    { ...s, phase: 'moving', diceHistory: [...s.diceHistory, { playerId: p.id, value, at: Date.now(), zone: s.zone }] },
    `${p.name} ทอยได้ ${value}`,
  );
}

export function endTurn(s: GameState): GameState {
  const next = (s.activePlayer + 1) % s.players.length;
  return addLog({ ...s, activePlayer: next, phase: 'roll', turnActed: false, currentMission: null }, `ถึงตา ${s.players[next].name}`);
}

// ───────── ผลงาน (Work) ─────────

export function createWork(
  s: GameState,
  init: { kind: WorkKind; refId: string; title: string; zone?: ZoneId; creativityTags?: Work['creativityTags']; indicators?: string[]; status?: Work['status'] },
): [GameState, string] {
  const author = activePlayer(s);
  const w: Work = {
    id: uid('w'),
    kind: init.kind,
    refId: init.refId,
    title: init.title,
    zone: init.zone,
    indicators: init.indicators,
    authorId: author.id,
    participants: [author.id],
    answers: {},
    reason: '',
    exchange: [],
    help: [],
    status: init.status ?? 'draft',
    feedback: [],
    startedAt: Date.now(),
    creativityTags: init.creativityTags ?? [],
  };
  return [recompute({ ...s, works: [...s.works, w] }), w.id];
}

export function updateWork(s: GameState, id: string, fn: (w: Work) => Work): GameState {
  return recompute({ ...s, works: s.works.map((w) => (w.id === id ? fn(w) : w)) });
}

export function findWork(s: GameState, id: string | null | undefined) {
  return id ? s.works.find((w) => w.id === id) : undefined;
}

/** ภารกิจของหัวข้อนี้ที่ยังเปิดอยู่ (ถ้ามี) หรือที่ผ่านแล้ว */
export function workForRef(s: GameState, kind: WorkKind, refId: string) {
  const list = s.works.filter((w) => w.kind === kind && w.refId === refId);
  return list.find((w) => w.status === 'approved') ?? list[list.length - 1];
}

export function setAnswer(w: Work, slot: string, text: string, by: string): Work {
  const prev = w.answers[slot] ?? { first: '', final: '', history: [] };
  return { ...w, answers: { ...w.answers, [slot]: { ...prev, final: text } }, participants: addOnce(w.participants, by) };
}

/** บันทึกฉบับปัจจุบันลงประวัติ — ครั้งแรกจะเป็น “ก่อนแก้” */
export function commitAnswers(w: Work, by: string): Work {
  const answers = { ...w.answers };
  for (const [k, a] of Object.entries(answers)) {
    const last = a.history[a.history.length - 1];
    const history = !last || last.text !== a.final ? [...a.history, { text: a.final, at: Date.now(), by }] : a.history;
    answers[k] = { ...a, first: a.first || a.final, history };
  }
  return { ...w, answers };
}

export const addOnce = <T,>(arr: T[], x: T) => (arr.includes(x) ? arr : [...arr, x]);

export function submitForReview(s: GameState, id: string, by: string): GameState {
  const s2 = updateWork(s, id, (w) => ({ ...commitAnswers(w, by), status: 'pending' }));
  const w = findWork(s2, id)!;
  return addLog(s2, `ส่ง “${w.title}” ให้ครู/โค้ชตรวจ`);
}

export function approveWork(s: GameState, id: string, by: Feedback['by'], text = ''): GameState {
  const w = findWork(s, id);
  if (!w || w.status === 'approved') return s;
  const reward = w.kind === 'mission' || w.kind === 'tower' ? 1 : w.kind === 'boss' ? 2 : 0;
  let s2 = updateWork(s, id, (x) => ({
    ...commitAnswers(x, x.authorId),
    status: 'approved',
    endedAt: Date.now(),
    feedback: [...x.feedback, { at: Date.now(), by, kind: 'approve', text: text || (by === 'coach' ? 'ครู/โค้ชรับรองผ่าน' : 'เพื่อนทุกคนเห็นพ้อง (ครูตรวจย้อนหลังได้)') }],
  }));
  s2 = { ...s2, blocks: s2.blocks + reward };
  return addLog(s2, `✅ “${w.title}” ผ่านแล้ว${reward ? ` ทีมได้บล็อกก่อสร้าง ${reward} ก้อน` : ''}`);
}

export function requestRevision(s: GameState, id: string, text: string): GameState {
  const w = findWork(s, id);
  if (!w) return s;
  const s2 = updateWork(s, id, (x) => ({ ...x, status: 'revise', feedback: [...x.feedback, { at: Date.now(), by: 'coach', kind: 'revise', text: text || 'ลองปรับปรุงอีกนิด' }] }));
  return addLog(s2, `✏️ ครู/โค้ชให้ปรับปรุง “${w.title}”`);
}

export function addCoachNote(s: GameState, note: { text: string; playerId?: string; indicator?: string; workId?: string }): GameState {
  let s2: GameState = { ...s, coachNotes: [...s.coachNotes, { id: uid('n'), at: Date.now(), ...note }] };
  if (note.workId) s2 = updateWork(s2, note.workId, (w) => ({ ...w, feedback: [...w.feedback, { at: Date.now(), by: 'coach', kind: 'note', text: note.text }] }));
  return s2;
}

export function recordHelp(s: GameState, type: HelpType, context: string, workId?: string | null): GameState {
  const p = activePlayer(s);
  let s2: GameState = { ...s, helpUsed: [...s.helpUsed, { at: Date.now(), type, playerId: p.id, context }] };
  if (workId) s2 = updateWork(s2, workId, (w) => ({ ...w, help: addOnce(w.help, type) }));
  return s2;
}

// ───────── สถานะที่คำนวณจากผลงาน ─────────

export function zoneMissionsDone(s: GameState, zone: ZoneId) {
  return missionsOfZone(zone).every((m) => s.missionProgress[MISSIONS.indexOf(m)] === 'done');
}

/** คำนวณความคืบหน้า บอส คริสตัล โซน และหอคอยจากผลงานทั้งหมด */
export function recompute(s: GameState): GameState {
  const missionProgress = MISSIONS.map((m) => {
    const list = s.works.filter((w) => w.kind === 'mission' && w.refId === m.id);
    if (list.some((w) => w.status === 'approved')) return 'done' as const;
    if (list.some((w) => w.status === 'pending')) return 'pending' as const;
    if (list.some((w) => w.status === 'revise')) return 'revise' as const;
    if (list.length) return 'doing' as const;
    return 'todo' as const;
  });
  const tmp = { ...s, missionProgress };
  const bossStatus = BOSSES.map((b) => {
    const list = s.works.filter((w) => w.kind === 'boss' && w.refId === `B${b.zone + 1}`);
    if (list.some((w) => w.status === 'approved')) return 'defeated' as const;
    if (!zoneMissionsDone(tmp, b.zone)) return 'locked' as const;
    if (list.length) return 'attempted' as const;
    return 'available' as const;
  });
  // ต้องชนะบอสตามลำดับโซน
  let crystalCount = 0;
  while (crystalCount < 3 && bossStatus[crystalCount] === 'defeated') crystalCount++;
  const zone = Math.min(2, crystalCount) as ZoneId;
  const towerProgress = AREA_ORDER.map((t) => s.works.some((w) => w.kind === 'tower' && w.refId === t && w.status === 'approved'));
  const responsesByStudent: Record<string, string[]> = Object.fromEntries(s.players.map((p) => [p.id, [] as string[]]));
  for (const w of s.works) for (const pid of w.participants) responsesByStudent[pid]?.push(w.id);
  let out: GameState = { ...s, missionProgress, bossStatus, crystalCount, towerProgress, responsesByStudent, finished: towerProgress.every(Boolean) };
  if (zone !== s.zone) {
    out = { ...out, zone, positions: s.players.map(() => 0) };
    out = addLog(out, zone > s.zone ? `🔓 ปลดล็อก ${['โซน 1', 'โซน 2', 'โซน 3'][zone]} แล้ว! ทุกคนย้ายไปที่ประตูโซนใหม่` : 'ย้อนกลับโซนก่อนหน้า');
  }
  return out;
}

// ───────── ใบงานรายคนของภารกิจหลัก ─────────

/** ช่องคำตอบทั้งหมดของภารกิจ (ไม่รวมรายการหลายข้อ) */
export function missionSlotKeys(m: Mission): string[] {
  return [...(m.parts ?? []).map((p) => p.key), ...m.groups.flatMap((g) => g.slots.map((x) => x.key)), ...(m.needReason ? ['reason'] : [])];
}

/** ใบงานของผู้เล่นคนนี้ครบตามเงื่อนไขภารกิจหรือยัง คืนรายการที่ยังขาด */
export function sheetMissing(w: Work, m: Mission, pid: string): string[] {
  const miss: string[] = [];
  const empty = missionSlotKeys(m).filter((k) => !answerOf(w, pid, k).trim());
  if (empty.length) miss.push(`ยังว่าง ${empty.length} ช่อง`);
  if (m.list) {
    const mine = (w.items ?? []).filter((i) => i.by === pid);
    if (mine.length < m.list.minItems) miss.push(`${m.list.label} อย่างน้อย ${m.list.minItems} ข้อ`);
    if (m.list.minDistinctTags && new Set(mine.map((i) => i.tag)).size < m.list.minDistinctTags) miss.push(`ต้องต่างกันอย่างน้อย ${m.list.minDistinctTags} รูปแบบ`);
  }
  if (m.drawing === 'required' && !w.drawings?.[pid]) miss.push('ยังไม่ได้วาดภาพประกอบ');
  return miss;
}

export const missionReady = (w: Work, m: Mission, players: Player[]) => players.every((p) => sheetMissing(w, m, p.id).length === 0);

/** จำนวนชิ้นคำตอบที่ผู้เล่นคนนี้สร้างเองในผลงาน (หลักฐานรายบุคคล) */
export function contribution(w: Work, pid: string): number {
  return Object.entries(w.answers).filter(([k, a]) => k.startsWith(`${pid}|`) && a.final.trim()).length + (w.items ?? []).filter((i) => i.by === pid).length;
}

/** สรุปหลักฐานรายบุคคลตามตัวบ่งชี้ 1.1–4.3 จากภารกิจหลักที่ผ่านการรับรอง */
export function indicatorEvidence(s: GameState, pid: string): Record<string, { missions: number; pieces: number; rating: number; rated: number }> {
  const out: Record<string, { missions: number; pieces: number; rating: number; rated: number }> = {};
  for (const w of s.works) {
    if (w.kind !== 'mission' || w.status !== 'approved') continue;
    const n = contribution(w, pid);
    for (const code of w.indicators ?? []) {
      const e = (out[code] ??= { missions: 0, pieces: 0, rating: 0, rated: 0 });
      if (n) e.missions++;
      e.pieces += n;
      if (w.ratings?.[pid] !== undefined) { e.rating += w.ratings[pid]; e.rated++; }
    }
  }
  return out;
}

export const towerUnlocked = (s: GameState) => s.crystalCount >= 3;

// ───────── ตรวจคำตอบเบื้องต้น (คำแนะนำเท่านั้น ไม่ใช่การตัดสิน) ─────────

export function thaiWords(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Seg) {
    return [...new Seg('th', { granularity: 'word' }).segment(t)].filter((x) => x.isWordLike).map((x) => x.segment);
  }
  return t.split(/\s+/);
}

export interface CheckResult { label: string; ok: boolean }

export function basicChecks(text: string): CheckResult[] {
  const n = thaiWords(text).length;
  return [
    { label: 'เขียนคำตอบแล้ว', ok: text.trim().length > 0 },
    { label: 'มีคำอย่างน้อย 2 คำ (ประโยคมักมีผู้ทำและการกระทำ)', ok: n >= 2 },
  ];
}

export function runChecks(checks: AutoCheck[], values: Record<string, string>): CheckResult[] {
  return checks.map((c) => {
    const t = (c.slot ? values[c.slot] : Object.values(values).join(' ')) ?? '';
    let ok = t.trim().length > 0;
    if (c.anyOf) ok = ok && c.anyOf.some((x) => t.includes(x));
    if (c.allOf) ok = ok && c.allOf.every((x) => t.includes(x));
    if (c.noneOf) ok = ok && !c.noneOf.some((x) => t.includes(x));
    return { label: c.label, ok };
  });
}

// ───────── บันทึก / ส่งออก ─────────

export function save(s: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage ใช้ไม่ได้ (เช่น โหมดส่วนตัว) — เล่นต่อได้แต่ไม่บันทึก */
  }
}

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s.version === 2 && s.started ? { ...s, phase: s.phase === 'moving' ? 'action' : s.phase } : null;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ไม่เป็นไร */
  }
}

/** ชื่อช่องคำตอบที่อ่านเข้าใจ (แทนคีย์ภายใน) */
export function slotLabel(w: Work, key: string): string {
  const slot = key.includes('|') ? key.split('|')[1] : key;
  if (slot === 'reason') return 'เหตุผล';
  if (w.kind === 'mission') {
    const m = missionById(w.refId);
    const all = [...(m?.parts ?? []), ...(m?.groups.flatMap((g) => g.slots.map((x) => ({ ...x, label: `${g.title} · ${x.label}` }))) ?? [])];
    return all.find((x) => x.key === slot)?.label ?? slot;
  }
  if (w.kind === 'boss' || w.kind === 'tower') {
    const [area, part] = slot.split('.');
    const name = { F: 'คิดคล่อง', FL: 'คิดยืดหยุ่น', O: 'คิดริเริ่ม', E: 'คิดละเอียดลออ' }[area as CreativityTag] ?? area;
    return `${name} · ${{ pick: 'ผลงานที่เลือก', why: 'เหตุผล' }[part] ?? part}`;
  }
  return 'คำตอบ';
}

const fmt = (t?: number) => (t ? new Date(t).toLocaleString('th-TH') : '');

export function exportJSON(s: GameState): string {
  return JSON.stringify({ note: 'ข้อมูลกิจกรรมฝึก ไม่ใช่คะแนนเครื่องมือวิจัยที่ผ่านการตรวจสอบ', exportedAt: new Date().toISOString(), state: s }, null, 2);
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** CSV หนึ่งแถวต่อหนึ่งคำตอบของผู้เล่นแต่ละคน ขึ้นต้นด้วย UTF-8 BOM เพื่อให้ Excel อ่านภาษาไทยถูก */
export function exportCSV(s: GameState): string {
  const head = ['ผู้เล่น', 'ประเภท', 'ผลงาน', 'โซน', 'ด้าน', 'ตัวบ่งชี้', 'ช่องคำตอบ', 'ก่อนแก้', 'หลังแก้', 'จำนวนครั้งที่แก้', 'สถานะ', 'คะแนนกิจกรรมในเกม (0–4 ไม่ใช่คะแนนเครื่องมือวิจัย)', 'ความช่วยเหลือที่ทีมใช้', 'ความเห็นเพื่อน', 'ความเห็นครู/โค้ช', 'เริ่ม', 'จบ'];
  const rows: string[][] = [];
  for (const w of s.works) {
    const m = w.kind === 'mission' ? missionById(w.refId) : undefined;
    const row = (pid: string, slot: string, first: string, final: string, edits: number) => rows.push([
      playerName(s, pid), w.kind, w.title, w.zone !== undefined ? String(w.zone + 1) : '', m ? m.areaName : w.creativityTags.join(' '),
      (w.indicators ?? []).join(' '), slot, first, final, String(edits), w.status,
      w.ratings?.[pid] !== undefined ? String(w.ratings[pid]) : '',
      w.help.join(' / '),
      w.exchange.map((e) => `${playerName(s, e.by)}: ${e.text}`).join(' | '),
      w.feedback.map((f) => `${f.kind}: ${f.text}`).join(' | '),
      fmt(w.startedAt), fmt(w.endedAt),
    ]);
    for (const [k, a] of Object.entries(w.answers)) {
      const pid = k.includes('|') ? k.split('|')[0] : w.authorId;
      row(pid, slotLabel(w, k), a.first, a.final, Math.max(0, a.history.length - 1));
    }
    (w.items ?? []).forEach((i, n) => row(i.by, `ข้อ ${n + 1}${i.tag ? ` (${i.tag})` : ''}`, i.first, i.text, i.first !== i.text ? 1 : 0));
    if (!Object.keys(w.answers).length && !(w.items ?? []).length) row(w.authorId, '—', '', '', 0);
  }
  return '\uFEFF' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
