// ข้อมูลทั้งหมดอ่านจากไฟล์ JSON ใน ../data (สร้างด้วย scripts/gen-data.mjs หรือวางไฟล์ทางการทับ)
import missionsFile from '../data/missions_exact_table2.json';
import stationsFile from '../data/stations.json';
import blocksFile from '../data/word_blocks.json';
import towerFile from '../data/tower_exact_alignment.json';
import supportFile from '../data/support.json';

export interface WorkConfig {
  many?: boolean;
  tags?: string[];
  required_tags?: string[];
  audiences?: string[];
  audience_note?: string;
  required_audience_tags?: string[];
  expansion_parts?: string[];
  base?: string;
  given_words?: string[];
  drawing?: boolean;
  explanation?: boolean;
  fix?: string[];
  checklist?: string[];
}

export interface Mission {
  id: string;
  zone: number;
  zone_name: string;
  stage_label: string;
  area_id: 'F' | 'FL' | 'O' | 'E';
  area: string;
  area_en: string;
  shape: string;
  scenario_id: string;
  scenario: string;
  scenario_text: string;
  emoji: string;
  indicator: string;
  instruction_exact_from_table_2: string;
  time_limit_minutes: number | null;
  reward_note: string;
  work: WorkConfig;
}

export interface Station { id: StationId; name: string; icon: string; where: string; role: string }
export type StationId = 'problem' | 'learning' | 'tools' | 'exchange' | 'creative' | 'help' | 'coach';

export const ZONES = missionsFile.zones as { zone: number; name: string; stage_label: string }[];
export const MISSIONS = missionsFile.missions as Mission[];
export const INDICATOR_TEXT = missionsFile.indicators as Record<string, string>;
export const STATIONS = stationsFile.stations as Station[];
export const BLOCK_CATEGORIES = blocksFile.categories as { id: string; name: string; color: string; words: string[] }[];
export const STORY_CUBES = blocksFile.story_cubes as { id: string; role: string; name: string; faces: [string, string][] }[];
export const TABLE2_FACES = blocksFile.table2_faces as Record<string, number>;
export const TOWER = towerFile as {
  tower_name: string; purpose: string;
  areas: { area_id: string; area: string; indicators: string[] }[];
  reflection_prompts: string[];
};
export const COACH = supportFile.coach as { situation: string; step1: string[]; step2: string[] }[];
export const TEMPLATES = supportFile.templates as { id: string; name: string; cue: string; about: string; pattern: string; example: string }[];

export const AREAS = [
  { id: 'F', name: 'การคิดคล่อง', en: 'Fluency', shape: '●', color: '#c8322b' },
  { id: 'FL', name: 'การคิดยืดหยุ่น', en: 'Flexibility', shape: '■', color: '#1d4a9e' },
  { id: 'O', name: 'การคิดริเริ่ม', en: 'Originality', shape: '▲', color: '#b4541a' },
  { id: 'E', name: 'การคิดละเอียดลออ', en: 'Elaboration', shape: '⬢', color: '#17767a' },
] as const;

export const station = (id: StationId) => STATIONS.find((s) => s.id === id)!;
export const missionById = (id: string) => MISSIONS.find((m) => m.id === id)!;
export const missionsOfZone = (zone: number) => MISSIONS.filter((m) => m.zone === zone);
export const areaOf = (id: string) => AREAS.find((a) => a.id === id)!;

// เส้นทางในแต่ละโซน (วนรอบ 10 ช่อง) — ช่องภารกิจใช้ area id
export type Space = { kind: 'station'; station: StationId } | { kind: 'mission'; area: Mission['area_id'] };
export const TRACK: Space[] = [
  { kind: 'station', station: 'problem' },
  { kind: 'mission', area: 'F' },
  { kind: 'station', station: 'learning' },
  { kind: 'mission', area: 'FL' },
  { kind: 'station', station: 'tools' },
  { kind: 'station', station: 'exchange' },
  { kind: 'mission', area: 'O' },
  { kind: 'station', station: 'help' },
  { kind: 'mission', area: 'E' },
  { kind: 'station', station: 'coach' },
];

// ลูกเต๋า 6 หน้า: 1 1 2 2 3 3
export const DICE_FACES = [1, 1, 2, 2, 3, 3];

export const TOKEN_COLORS = [
  { id: 'red', name: 'แดง', hex: '#d63a2f', animal: '🦊' },
  { id: 'yellow', name: 'เหลือง', hex: '#e8a800', animal: '🐥' },
  { id: 'blue', name: 'น้ำเงิน', hex: '#2058b8', animal: '🐳' },
  { id: 'green', name: 'เขียว', hex: '#18867a', animal: '🐢' },
];
