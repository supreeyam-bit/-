// ตัวช่วยวิเคราะห์ภาษาไทยแบบง่าย (ใช้แนะนำผู้เรียน ไม่ใช่ตัวตัดสินขั้นสุดท้าย ครูปรับคะแนนได้เสมอ)

const VERBS = new Set(('กิน ดื่ม นอน เดิน วิ่ง กระโดด ว่าย ว่ายน้ำ เล่น อ่าน เขียน ร้อง ร้องเพลง เต้น พูด ฟัง ดู มอง เห็น ไป มา ยืน นั่ง ทำ ช่วย ซื้อ ขาย ให้ ' +
  'รด รดน้ำ ปลูก กวาด ล้าง เก็บ หยิบ ถือ แบก จับ ตี เตะ โยน ขี่ บิน เกาะ ตก หาย หา ตามหา เลี้ยง ไถ ไถนา ดำนา เกี่ยว เกี่ยวข้าว ตำ หุง ต้ม ทอด ปิ้ง ย่าง ขับ ปั่น ' +
  'ซัก ตาก เปิด ปิด วาด ระบาย เรียน สอน ถาม ตอบ ยิ้ม หัวเราะ ร้องไห้ คุย เรียก ส่ง รับ ใส่ ถอด อาบ อาบน้ำ แปรง ตื่น หลับ คิด รัก ชอบ กลัว รู้ จำ ลืม ชม กอด ' +
  'ไหว้ ขอบคุณ ขอโทษ ขอ ยืม คืน จ่าย ทอน ชั่ง ห่อ ตัก แบ่ง ป้อน ป้อนข้าว เห่า คลาน กัด แทะ ดม บาน กระพือ โบก ลอย ไหล พัด ส่อง เป็น มี อยู่ คือ ' +
  'เฮ็ด เว้า เบิ่ง แล่น ประกาศ แจ้ง บอก ติด ปีน พับ ซ่อม ทาย กลับ ออก เข้า ขึ้น ลง หยุด รอ ช่วยเหลือ ดูแล ให้อาหาร เขี่ย จิก ไล่ ขโมย แอบ ซ่อน ทาสี ตัด เย็บ ทอ').split(' '));
// คำประสมที่ตัวแยกคำมักแยกออกเป็นสองท่อน
const COMPOUNDS = new Set(('เด็กชาย เด็กหญิง ต้นไม้ ต้นมะม่วง ต้นมะขาม ลุงภารโรง ภารโรง แม่ค้า แม่ใหญ่ พ่อใหญ่ ทุ่งนา หนองน้ำ ห้องเรียน ห้องน้ำ ชาวนา ผีเสื้อ ' +
  'นักเรียน คุณครู ครูใหญ่ ลูกโป่ง ฟุตบอล ใบไม้ ดอกไม้ บัวรดน้ำ น้องชาย น้องสาว ผักบุ้ง ไข่ไก่ เถียงนา คันนา ผู้ใหญ่บ้าน ร้านผ้า ร้านผัก ไอศกรีม ' +
  'โรงเรียน ดอกทานตะวัน ดวงอาทิตย์ หนังสือ').split(' '));
const PRONOUNS = new Set('ฉัน ผม หนู เรา เขา เธอ มัน ท่าน พวกเรา พวกเขา ข้อย ข้าน้อย คุณ ดิฉัน แก'.split(' '));
const PARTICLES = new Set('ครับ คับ ค่ะ คะ ขา ขอรับ จ้ะ จ้า จ๊ะ นะ เด้อ แหน่ สิ ซิ เถอะ หน่อย ไหม มั้ย หรือ เปล่า ไม่ บ่ อย่า จง โปรด กรุณา ห้าม ได้ไหม ได้ ด้วย'.split(' '));
const PREPS = new Set('ใน บน ใต้ ที่ ข้าง หน้า หลัง ริม กลาง ระหว่าง ใกล้ ตอน เมื่อ เวลา อย่าง ทุก แถว'.split(' '));

const RX = {
  polite: /(ครับ|คับ|ค่ะ|คะ|ขอรับ|จ้ะ|จ้า|จ๊ะ|เด้อ|ข้าน้อย)/,
  help: /(ช่วย|รบกวน|ขอ(?!บคุณ|บใจ|โทษ)|โปรด|กรุณา|ได้ไหม|ได้มั้ย|ได้บ่|หน่อย|แหน่)/,
  rude: /(มึง|กู|เฮ้ย|โว้ย|ไอ้|อีนี่|เร็ว ๆ ดิ)/,
  question: /(ไหม|มั้ย|หรือเปล่า|หรือไม่|หรือยัง|อะไร|ใคร|ที่ไหน|ไหน|เมื่อไร|เมื่อไหร่|อย่างไร|ยังไง|ทำไม|กี่|เท่าไร|เท่าไหร่|หยัง|ไผ|บ่\s*$|\?)/,
  request: /(ช่วย|โปรด|กรุณา|รบกวน|ขอให้|ขอ(?!บคุณ|บใจ|โทษ))/,
  command: /(^\s*(อย่า|จง|ห้าม)|(สิ|ซิ|เถอะ|เดี๋ยวนี้|!)\s*$)/,
  negative: /(ไม่|มิได้|บ่(?!า))/,
  dialect: /(เฮ็ด|แซ่บ|บ่(?!า)|เว้า|ไผ|หยัง|ข้อย|เด้อ|แหน่|หมากม่วง|ม่วน|เบิ่ง|แม่ใหญ่|พ่อใหญ่|อีหลี|คัก|บักหุ่ง|ข้าน้อย|ขอบใจหลาย)/,
  time: /(เช้า|สาย|บ่าย|เย็น|ค่ำ|กลางคืน|กลางวัน|เที่ยง|เมื่อวาน|วันนี้|พรุ่งนี้|ตอน|ทุกวัน|ขณะ|เวลา|โมง|ทุ่ม|วันจันทร์|วันอังคาร|วันพุธ|วันพฤหัส|วันศุกร์|วันเสาร์|วันอาทิตย์|เดือน|สัปดาห์|เมื่อ|รุ่งสาง|พลบ|หัวค่ำ|ฤดู|หน้าฝน|หน้าหนาว|หน้าร้อน|นาที|ชั่วโมง)/,
  place: /(ที่|ใน|บน|ใต้|ข้าง|หน้า(?!ตา)|หลัง(?!จาก)|ริม|กลาง|ระหว่าง|ใกล้|โรงเรียน|บ้าน|ตลาด|ทุ่ง|นา|สวน|ห้อง|วัด|ถนน|หมู่บ้าน|สนาม|หนอง|คลอง|แม่น้ำ|ป่า|ภูเขา|กระท่อม|คอก|เถียงนา|ศาลา)/,
  manner: /(อย่าง|ค่อย|ๆ|เบา|เร็ว|ช้า|ระมัดระวัง|ตั้งใจ|รีบ|ทีละ|เพลิน|ขยัน|แข็งขัน|ทะนุถนอม|เงียบ|ประณีต|คล่อง)/,
  feeling: /(ดีใจ|สุข|เสียใจ|ภูมิใจ|สนุก|ชอบ|รัก|กลัว|ตื่นเต้น|เหนื่อย|สดชื่น|ยิ้ม|หัวเราะ|อิ่มใจ|เบิกบาน|ร้องไห้|กังวล|ห่วง|ตกใจ|โกรธ|เศร้า|ปลื้ม|อบอุ่น|สบายใจ|ชื่นใจ|ประทับใจ|เพลิดเพลิน)/,
  trait: /(สี|ตัว|ใหญ่|เล็ก|อ้วน|ผอม|ดำ|เทา|ขาว|เผือก|น้ำตาล|เขา|หาง|ยาว|สั้น|โค้ง|ด่าง|แผล|กระดิ่ง|ปลอก|เชือก|อายุ|หนัก|สูง|หู|ขน|จุด|ลาย|ชื่อ)/,
  contact: /(ติดต่อ|โทร|แจ้ง|บอก|เบอร์|\d{3}|ส่งคืน|รางวัล|บ้านเลขที่|พาไปส่ง)/,
  reason: /(เพราะ|เพื่อ|จะได้|ทำให้)/,
  amount: /(\d|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|กิโล|ลูก|ถุง|ครึ่ง|โล|ขีด|บาท)/,
  address: /(ป้า|แม่ค้า|แม่ใหญ่|พ่อใหญ่|พี่|ลุง|น้า|ยาย|ตา|คุณ|ครู)/,
};

const TYPE_NAME = { statement: 'บอกเล่า', negative: 'ปฏิเสธ', question: 'คำถาม', request: 'ขอร้อง', command: 'คำสั่ง' };
function sType(s) {
  s = (s || '').trim();
  if (RX.command.test(s)) return 'command';
  if (RX.request.test(s)) return 'request';
  if (RX.question.test(s)) return 'question';
  if (RX.negative.test(s)) return 'negative';
  return 'statement';
}

const norm = (s) => (s || '').replace(/[\s.,!?"'“”]/g, '').replace(/(ครับ|คับ|ค่ะ|คะ|จ้ะ|จ้า|นะ|เด้อ)+$/g, '');
const SEG = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
function words(s) {
  s = (s || '').trim();
  if (!s) return [];
  if (SEG) {
    const out = [];
    for (const x of SEG.segment(s)) {
      if (x.isWordLike) out.push(x.segment);
      else if (x.segment.trim() === 'ๆ' && out.length) out[out.length - 1] += ' ๆ';
    }
    return mergeCompounds(out);
  }
  return s.split(/\s+/).filter(Boolean);
}
function mergeCompounds(ws) {
  const out = [];
  for (let i = 0; i < ws.length;) {
    let n = 1;
    for (const k of [3, 2]) { const j = ws.slice(i, i + k).join(''); if (i + k <= ws.length && (COMPOUNDS.has(j) || VERBS.has(j))) { n = k; break; } }
    out.push(ws.slice(i, i + n).join('')); i += n;
  }
  return out;
}

// เดาหน้าที่ของคำ: S ใคร · V ทำอะไร · O กับใครหรืออะไร · M ส่วนขยาย · P คำเสริม
function autoTag(ws) {
  const t = ws.map((w) => (PARTICLES.has(w) ? 'P' : VERBS.has(w) ? 'V' : null));
  const iV = t.indexOf('V');
  let hasS = false, hasO = false, afterPrep = false;
  for (let i = 0; i < ws.length; i++) {
    if (t[i]) { afterPrep = false; continue; }
    const w = ws[i];
    if (PREPS.has(w) || RX.time.test(w) && w.length <= 8) { t[i] = 'M'; afterPrep = PREPS.has(w); continue; }
    if (afterPrep) { t[i] = 'M'; continue; }
    if (iV === -1 || i < iV) { t[i] = hasS ? 'M' : 'S'; hasS = true; }
    else { t[i] = hasO ? 'M' : 'O'; hasO = true; }
  }
  return t;
}
const ROLE = {
  S: { name: 'ใคร', full: 'ประธาน (ใคร)' }, V: { name: 'ทำอะไร', full: 'กริยา (ทำอะไร)' }, O: { name: 'กับอะไร', full: 'กรรม (กับใครหรืออะไร)' },
  M: { name: 'ขยาย', full: 'ส่วนขยาย' }, P: { name: 'คำเสริม', full: 'คำเสริม' },
};
const ROLE_CYCLE = ['S', 'V', 'O', 'M', 'P'];
function wordClass(w, r) {
  if (r === 'V') return 'คำกริยา';
  if (r === 'S' || r === 'O') return PRONOUNS.has(w) ? 'คำสรรพนาม' : 'คำนาม';
  return '';
}
// ประโยคที่พิมพ์ → { text, ws, tags }
function makeItem(text, old) {
  const ws = words(text);
  const tags = old && old.text === text && old.tags && old.tags.length === ws.length ? old.tags : autoTag(ws);
  return { text, ws, tags };
}
function structure(it) {
  const tg = it.tags || [];
  const S = tg.includes('S'), V = tg.includes('V'), O = tg.includes('O');
  return { S, V, O, ok: S && V, parts: S && V ? (O ? 3 : 2) : 0 };
}

// ตรวจบล็อกในห้องทดลองประโยค
function checkBlocks(blocks) {
  const issues = [];
  if (!blocks.length) return { ok: false, issues: ['ยังไม่มีบล็อก แตะบล็อกคำด้านล่างเพื่อเริ่ม'] };
  const r = blocks.map((b) => b.r), w = blocks.map((b) => b.w);
  const text = w.join('');
  const type = sType(text);
  const iS = r.indexOf('S'), iV = r.indexOf('V'), iO = r.indexOf('O');
  const lead = ['ช่วย', 'โปรด', 'อย่า', 'กรุณา', 'จง'];
  const noSubjOk = lead.includes(w[0]) || (type === 'request' || type === 'command');
  if (iV === -1) issues.push('ยังไม่มีบล็อกสีเหลือง (ทำอะไร) ประโยคต้องบอกการกระทำ');
  if (iS === -1 && !noSubjOk) issues.push('ยังไม่มีบล็อกสีแดง (ใคร) บอกให้รู้ว่าใครเป็นผู้ทำ');
  if (iS > -1 && iV > -1 && iS > iV) issues.push('ผู้ทำ (สีแดง) ต้องอยู่หน้าการกระทำ (สีเหลือง)');
  if (iO > -1 && iV > -1 && iO < iV) issues.push('กรรม (สีน้ำเงิน) ต้องอยู่หลังการกระทำ');
  w.forEach((x, i) => {
    if (x === 'ไม่' && r[i + 1] !== 'V') issues.push('คำว่า "ไม่" ต้องวางหน้าการกระทำทันที');
    if (x === 'ไหม' && r.slice(i + 1).some((y, j) => !['ครับ', 'ค่ะ', 'คะ', 'เด้อ'].includes(w[i + 1 + j]))) issues.push('คำว่า "ไหม" ต้องอยู่ท้ายประโยค (หน้าคำลงท้ายได้)');
    if (['ครับ', 'ค่ะ', 'คะ', 'เด้อ'].includes(x) && i !== w.length - 1) issues.push(`คำลงท้าย "${x}" ต้องอยู่ท้ายสุด`);
    if (['ช่วย', 'โปรด', 'อย่า'].includes(x) && i > 0 && r[i - 1] !== 'S') issues.push(`คำว่า "${x}" วางต้นประโยคหรือหลังผู้ทำ`);
    if (r[i] === 'M' && i === 0 && !RX.time.test(x) && !RX.place.test(x)) issues.push(`"${x}" เป็นส่วนขยาย ต้องวางหลังคำที่มันขยาย`);
  });
  if (w.includes('คะ') && type !== 'question') issues.push('"คะ" ใช้กับประโยคคำถาม ประโยคอื่นใช้ "ค่ะ"');
  if (w.includes('ค่ะ') && type === 'question') issues.push('ประโยคคำถามลงท้ายด้วย "คะ"');
  const parts = iS > -1 && iV > -1 ? (iO > -1 ? 3 : 2) : 0;
  return { ok: !issues.length, issues: [...new Set(issues)], type, parts, text };
}
