// สร้างไฟล์ข้อมูล JSON ของ BLOCK WORLD จากเนื้อหาร่วม ../print-and-play/src/data.mjs
// ข้อความภารกิจคัดลอกจาก CREATIVE[].stages ตามต้นฉบับทุกตัวอักษร (ไม่พิมพ์ใหม่)
// ถ้ามีไฟล์ทางการ (missions_exact_table2.json ฯลฯ) ให้วางทับใน data/ ได้เลย โครงสร้างต้องตรงกับไฟล์ที่สคริปต์นี้สร้าง
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from '../../print-and-play/src/data.mjs';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const SOURCE = 'สร้างจาก print-and-play/src/data.mjs (CREATIVE, STAGES, INDICATORS) ด้วย scripts/gen-data.mjs';

const ZONES = [
  { zone: 1, name: 'การสร้างประโยค', stage_label: D.STAGES[0] },
  { zone: 2, name: 'การขยายประโยค', stage_label: D.STAGES[1] },
  { zone: 3, name: 'การใช้ภาษา', stage_label: D.STAGES[2] },
];
const AREA_IDS = ['F', 'FL', 'O', 'E'];
const SCENARIO_IDS = ['A', 'B', 'C', 'D'];

// ช่องเก็บผลงานที่ภารกิจแต่ละใบต้องใช้ (อ่านจากข้อความตารางที่ 2 แล้วกำหนดด้วยมือ)
const CHECK = ['มีภาคประธาน', 'มีภาคแสดง', 'สื่อความหมายได้ถูกต้องสมบูรณ์'];
const KINDS4 = ['บอกเล่า', 'ปฏิเสธ', 'คำถาม', 'ขอร้องหรือคำสั่ง'];
const WORK = {
  'F-1': { many: true, tags: ['บอกเล่า'], checklist: [...CHECK, 'มีคำนามอย่างน้อย 1 คำ', 'มีคำกริยาอย่างน้อย 1 คำ'] },
  'F-2': { many: true, base: 'แมวกินปลา', expansion_parts: ['ลักษณะ', 'เวลา', 'สถานที่'], checklist: ['มีส่วนขยายอย่างน้อย 1 ส่วน', 'สื่อความหมายได้ถูกต้องสมบูรณ์'] },
  'F-3': { many: true, audiences: ['ผู้ใหญ่'], audience_note: 'ผู้ฟัง: แม่', checklist: ['ใช้คำสุภาพ', 'มีคำลงท้ายเหมาะกับผู้ฟัง', 'สื่อความหมายได้ถูกต้องสมบูรณ์'] },
  'FL-1': { tags: ['ประโยค 2 ส่วน', 'ประโยค 3 ส่วน', ...KINDS4], required_tags: ['ประโยค 2 ส่วน', 'ประโยค 3 ส่วน', ...KINDS4], checklist: [...CHECK, 'ใช้ภาษาเหมาะสมกับสถานการณ์'] },
  'FL-2': { tags: ['ขยายรูปแบบที่ 1', 'ขยายรูปแบบที่ 2', 'ขยายรูปแบบที่ 3', ...KINDS4], required_tags: ['ขยายรูปแบบที่ 1', 'ขยายรูปแบบที่ 2', 'ขยายรูปแบบที่ 3', ...KINDS4], expansion_parts: ['ผู้ทำ', 'การกระทำ', 'เวลา', 'สถานที่'], checklist: [...CHECK, 'ใช้ภาษาเหมาะสมกับสถานการณ์'] },
  'FL-3': { tags: ['เล่าเรื่อง', 'คำถาม', 'ขอร้องหรือคำสั่ง'], audiences: ['ผู้ใหญ่', 'เพื่อน', 'น้อง'], required_audience_tags: ['คำถาม', 'ขอร้องหรือคำสั่ง'], checklist: ['ใช้คำสุภาพ', 'มีคำลงท้ายเหมาะกับผู้ฟัง', 'ใช้ภาษาเหมาะสมกับสถานการณ์'] },
  'O-1': { given_words: ['ว่าว', 'ทุ่งนา', 'ลม'], drawing: true, explanation: true, checklist: [...CHECK, 'ภาพประกอบสอดคล้องกับประโยค'] },
  'O-2': { given_words: ['ว่าว', 'ทุ่งนา', 'ลม'], drawing: true, explanation: true, expansion_parts: ['ลักษณะ', 'การกระทำ', 'เวลา', 'สถานที่'], checklist: [...CHECK, 'ภาพประกอบเพิ่มเติมสอดคล้องกับประโยคที่ขยาย'] },
  'O-3': { given_words: ['ว่าว', 'ทุ่งนา', 'ลม'], drawing: true, explanation: true, audiences: ['เพื่อน', 'ผู้ใหญ่'], audience_note: 'ผู้ฟัง: เพื่อน และคุณครู (ผู้ใหญ่)', checklist: ['ใช้คำสุภาพ', 'มีคำลงท้ายเหมาะกับผู้ฟัง', 'ชี้ภาพประกอบให้สอดคล้องกับถ้อยคำ'] },
  'E-1': { fix: D.ELAB_BROKEN, checklist: [...CHECK] },
  'E-2': { many: true, base: 'นักเรียนกวาดห้องเรียน', expansion_parts: ['ลักษณะ', 'การกระทำ', 'เวลา', 'สถานที่'], checklist: [...CHECK] },
  'E-3': { audiences: ['ผู้ใหญ่'], audience_note: 'ผู้ฟัง: คุณครู', explanation: true, checklist: ['ใช้ถ้อยคำสุภาพ', 'บอกได้ชัดเจนว่านักเรียนทำอะไร', 'สื่อความหมายได้ถูกต้องสมบูรณ์'] },
};

const missions = [];
for (const z of ZONES) {
  D.CREATIVE.forEach((c, ai) => {
    const [text, indicator] = c.stages[z.zone - 1];
    const minutes = text.match(/ภายในเวลา\s*(\d+)\s*นาที/);
    const area_id = AREA_IDS[ai];
    missions.push({
      id: `Z${z.zone}-${area_id}`,
      zone: z.zone,
      zone_name: z.name,
      stage_label: z.stage_label,
      area_id,
      area: c.area,
      area_en: c.en,
      shape: c.shape,
      scenario_id: SCENARIO_IDS[ai],
      scenario: c.scene,
      scenario_text: c.sceneText,
      emoji: c.emoji,
      indicator,
      instruction_exact_from_table_2: text,
      time_limit_minutes: minutes ? Number(minutes[1]) : null,
      reward_note: c.reward,
      work: WORK[`${area_id}-${z.zone}`],
    });
  });
}

const indicatorText = Object.fromEntries(D.INDICATORS.flatMap(([, list]) => list.map((s) => [s.split(' ')[0], s])));

write('missions_exact_table2.json', { _source: SOURCE, zones: ZONES, missions, indicators: indicatorText });

write('stations.json', {
  _source: 'ชื่อ 7 องค์ประกอบตาม START_HERE_CLAUDE_PROMPT.md (ไม่มีไฟล์ stations.json ต้นฉบับแนบมา)',
  stations: [
    { id: 'problem', name: 'สถานการณ์ปัญหา', icon: '🧩', where: 'จุดเริ่มของทุกโซน', role: 'เปิดสถานการณ์ทั้ง 4 เรื่องและเรื่องราวของโซน ให้ผู้เรียนเห็นปัญหาที่ต้องใช้ภาษาแก้' },
    { id: 'learning', name: 'ศูนย์การเรียนรู้', icon: '📚', where: 'บนเส้นทางทุกโซน', role: 'บทเรียนสั้นตามโซน (การสร้างประโยค การขยายประโยค การใช้ภาษา) พร้อมตัวอย่างการแสดงผล AR' },
    { id: 'tools', name: 'เครื่องมือทางปัญญา', icon: '🛠️', where: 'บนเส้นทางทุกโซน', role: 'เครื่องมือช่วยคิด: แท่นเรียงบล็อกคำ ผังประโยค และลูกเต๋าเรื่องเล่า' },
    { id: 'exchange', name: 'ศูนย์แลกเปลี่ยนเรียนรู้', icon: '💬', where: 'บนเส้นทางทุกโซน', role: 'ผลัดกันเสนอไอเดียและต่อยอดความคิดของเพื่อนก่อนทำภารกิจให้สำเร็จ' },
    { id: 'creative', name: 'ศูนย์ส่งเสริมการคิดสร้างสรรค์', icon: '🏰', where: 'หอคอยกลางกระดาน', role: 'จุดรวบรวมและแสดงผลงานทั้งสี่ด้านจากทั้งสามโซน และพื้นที่สะท้อนคิด' },
    { id: 'help', name: 'ฐานการช่วยเหลือ', icon: '🛟', where: 'บนเส้นทางทุกโซน และปุ่มลัดในทุกภารกิจ', role: 'ความช่วยเหลือ 4 แบบ Conceptual, Metacognitive, Procedural, Strategic เปิดได้ตลอด ไม่หักคะแนน' },
    { id: 'coach', name: 'การโค้ช', icon: '🦉', where: 'บนเส้นทางทุกโซน และแผงครูในทุกภารกิจ', role: 'คำถามโค้ชตามขั้น และการรับรอง/ให้ปรับปรุง/บันทึกข้อสังเกตโดยครู' },
  ],
});

const uniq = (a) => [...new Set(a)];
write('word_blocks.json', {
  _source: 'คลังบล็อกคำจาก print-and-play/src/data.mjs (SUBJECTS, VERBS, OBJECTS, MODIFIERS, CHANGERS) + คำจากสถานการณ์ตารางที่ 2',
  categories: [
    { id: 'S', name: 'ประธาน (ใคร/อะไร)', color: '#c8322b', words: uniq(['แมว', 'ยาย', 'คุณยาย', 'แม่', 'น้อง', 'สุนัข', 'ว่าว', 'ลม', 'ชาวนา', 'นักเรียน', 'เพื่อน', 'หัวหน้าห้อง', 'คุณครู', ...D.SUBJECTS]) },
    { id: 'V', name: 'กริยา (ทำอะไร)', color: '#e0a400', words: uniq(['กิน', 'แอบกิน', 'ทอด', 'นอน', 'เล่น', 'เตะ', 'วิ่ง', 'คาบ', 'ลอย', 'พัด', 'ชัก', 'กวาด', 'เช็ด', 'เก็บ', 'ถือ', 'รับประทาน', ...D.VERBS]) },
    { id: 'O', name: 'กรรม (กับอะไร)', color: '#1d4a9e', words: uniq(['ปลา', 'ปลาทู', 'ลูกบอล', 'ว่าว', 'ห้องเรียน', 'ขยะ', 'โต๊ะ', 'ไม้กวาด', 'ฝุ่น', ...D.OBJECTS]) },
    { id: 'M', name: 'ส่วนขยาย (ลักษณะ เวลา สถานที่ อย่างไร)', color: '#17767a', words: uniq(['สีดำ', 'สีส้ม', 'ตัวเล็ก', 'บนโต๊ะอาหาร', 'ที่สนามหญ้าหน้าบ้าน', 'ตอนเย็น', 'ในทุ่งนา', 'สีรุ้ง', 'แรง', 'หลังเลิกเรียน', 'อย่างตั้งใจ', 'ใต้โต๊ะ', ...D.MODIFIERS]) },
    { id: 'C', name: 'คำเปลี่ยนชนิดประโยค', color: '#5b4b8a', words: uniq(D.CHANGERS.map(([w]) => w)) },
    { id: 'P', name: 'คำสุภาพและคำลงท้าย', color: '#b03a72', words: ['ครับ', 'ค่ะ', 'คะ', 'นะคะ', 'นะครับ', 'จ้ะ', 'นะ', 'ขอ', 'กรุณา', 'โปรด', 'ขอบคุณ'] },
  ],
  story_cubes: D.STORY_CUBES,
  table2_faces: D.TABLE2_FACES,
});

write('tower_exact_alignment.json', {
  _source: 'ตัวชี้วัด 4 ด้านจาก print-and-play/src/data.mjs (INDICATORS) — ไม่มีไฟล์ tower_exact_alignment.json ต้นฉบับแนบมา',
  tower_name: 'ศูนย์ส่งเสริมการคิดสร้างสรรค์',
  purpose: 'รวบรวม แสดงผลงาน และสะท้อนคิดครบสี่ด้านจากทั้งสามโซน ไม่ใช่แบบวัดใหม่',
  areas: D.INDICATORS.map(([name, list], i) => ({ area_id: AREA_IDS[i], area: name, indicators: list })),
  reflection_prompts: ['ผลงานชิ้นไหนที่ฉันภูมิใจที่สุดในด้านนี้ เพราะอะไร', 'ฉันได้ความคิดอะไรจากเพื่อน', 'ครั้งหน้าฉันจะทำอะไรให้ดีขึ้น'],
});

write('support.json', {
  _source: 'คำถามโค้ชและแม่แบบประโยคจาก print-and-play/src/data.mjs (COACH, TEMPLATES, TYPES)',
  coach: D.COACH.map(([situation, step1, step2]) => ({ situation, step1, step2 })),
  templates: D.TYPES.map((t) => ({ id: t.id, name: t.name, cue: t.cue, about: D.TEMPLATES[t.id][0], pattern: D.TEMPLATES[t.id][1], example: D.TEMPLATES[t.id][2] })),
});

function write(name, obj) {
  writeFileSync(join(out, name), JSON.stringify(obj, null, 2) + '\n');
  console.log('✓ data/' + name);
}
