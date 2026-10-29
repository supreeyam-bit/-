// สร้างไฟล์ data/*.json จากข้อความตารางที่ 2 ที่ถอดไว้แล้วใน print-and-play/src/data.mjs
// ใช้ครั้งเดียวเมื่อยังไม่มีไฟล์ต้นฉบับ — ถ้ามีไฟล์ JSON จากผู้วิจัย ให้วางทับไฟล์ใน data/ ได้เลย
import { writeFileSync } from 'node:fs';
import { CREATIVE, STAGES, INDICATORS, SUBJECTS, VERBS, OBJECTS, MODIFIERS, ELAB_BROKEN } from '../../print-and-play/src/data.mjs';

const zones = STAGES.map((s, i) => ({ id: i + 1, name: s.replace(/^ด่านที่ \d /, '') }));
const missions = [];
zones.forEach((z, zi) => CREATIVE.forEach((c) => {
  const [text, indicator] = c.stages[zi];
  missions.push({
    id: `Z${z.id}-${c.en[0]}${c.en === 'Flexibility' ? 'L' : ''}`,
    zone: z.id, zone_name: z.name,
    area: c.area, area_en: c.en, area_index: c.id,
    situation: c.scene,
    indicator,
    timed_minutes: /ภายในเวลา 5 นาที/.test(text) ? 5 : null,
    instruction_exact_from_table_2: text,
  });
}));
const out = (f, o) => writeFileSync(new URL(`../data/${f}`, import.meta.url), JSON.stringify(o, null, 2) + '\n');
out('missions_exact_table2.json', {
  source: 'ตารางที่ 2 ถอดความไว้ใน print-and-play/src/data.mjs (CREATIVE) — ไฟล์ .docx ต้นฉบับไม่ได้แนบมาในงานนี้ ควรตรวจทานกับต้นฉบับอีกครั้ง',
  zones,
  situations: CREATIVE.map((c) => ({ area_index: c.id, area: c.area, area_en: c.en, title: c.scene, description: c.sceneText.split(' (')[0] })),
  indicators: INDICATORS.map(([area, items]) => ({ area, items })),
  missions,
});
out('word_blocks.json', {
  subject: SUBJECTS, verb: VERBS, object: OBJECTS, modifier: MODIFIERS,
  polite_ending: ['ครับ', 'ค่ะ', 'คะ', 'นะคะ', 'นะครับ', 'จ้ะ', 'จ้า', 'นะ'],
  sentence_marker: ['ไม่', 'ไม่ได้', 'ไหม', 'หรือไม่', 'ใคร', 'อะไร', 'ที่ไหน', 'เมื่อไร', 'จง', 'ห้าม', 'อย่า', 'ช่วย', 'โปรด', 'กรุณา', 'หน่อย'],
  broken_sentences_zone1_elaboration: ELAB_BROKEN,
});
console.log(missions.length, 'missions');
