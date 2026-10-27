// รวมข้อมูลจากชุดพิมพ์ (print-and-play/src/data.mjs) เข้ากับแม่แบบ ได้ไฟล์เกมหน้าเดียว wordland.html
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from '../print-and-play/src/data.mjs';
import { DIGITAL_MISSIONS, CHAOS_PUZZLES, COOP_CHECKS } from './src/missions.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const data = {
  TITLE: D.TITLE, TYPES: D.TYPES, SUBJECTS: D.SUBJECTS, VERBS: D.VERBS, OBJECTS: D.OBJECTS, MODIFIERS: D.MODIFIERS,
  CHANGERS: D.CHANGERS, RESOURCES: D.RESOURCES, MISSIONS: D.MISSIONS, MISSION_REWARD: D.MISSION_REWARD, CHAOS: D.CHAOS,
  STAGES: D.STAGES, CREATIVE: D.CREATIVE, ELAB_BROKEN: D.ELAB_BROKEN, WONDERS: D.WONDERS, ROLES_JIGSAW: D.ROLES_JIGSAW,
  TEMPLATES: D.TEMPLATES, HINT_LEVELS: D.HINT_LEVELS, COACH: D.COACH, SPACE_KINDS: D.SPACE_KINDS, PATH: D.PATH, COST: D.COST,
  PLAYERS: D.PLAYERS, STORY_CUBES: D.STORY_CUBES, TABLE2_FACES: D.TABLE2_FACES, CUBE_RULES: D.CUBE_RULES, SPORT_CUBES: D.SPORT_CUBES, STORY_THEMES: D.STORY_THEMES, STORY_MODES: D.STORY_MODES, STORY_SCORE: D.STORY_SCORE, DREAM_CARDS: D.DREAM_CARDS, TALE_CARDS: D.TALE_CARDS, TALE_ENDINGS: D.TALE_ENDINGS, TALE_RULES: D.TALE_RULES, DIGITAL_MISSIONS, CHAOS_PUZZLES, COOP_CHECKS,
};
// ตรวจว่าทุกภารกิจในชุดพิมพ์มีฉบับดิจิทัล
for (const m of D.MISSIONS) if (!DIGITAL_MISSIONS[m.id]) throw new Error(`missing digital mission #${m.id}`);
const tpl = readFileSync(join(here, 'src', 'template.html'), 'utf8');
const json = JSON.stringify(data).replace(/</g, '\\u003c');
writeFileSync(join(here, 'wordland.html'), tpl.replace('/*__DATA__*/', `const DATA = ${json};`));
console.log('✓ digital/wordland.html');
