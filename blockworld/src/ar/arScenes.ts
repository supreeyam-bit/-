// โมดูลฉาก AR — ตอนนี้เป็นเพียง "ตัวอย่างการแสดงผล AR" แบบจำลองด้วย CSS 3D
// เมื่อต้องการเชื่อม AR จริงภายหลัง ให้สร้าง ArProvider ใหม่ (เช่น WebXR หรือ marker-based) ที่รับ ArScene เดียวกันนี้
// แล้วสลับใน getArProvider() โดยไม่ต้องแก้ส่วนอื่นของเกม

export interface ArScene {
  key: string;
  title: string;
  /** วัตถุบนแท่น: ไอคอน ตำแหน่ง x,z (-1..1) และความสูง */
  props: { icon: string; x: number; z: number; y?: number; label?: string }[];
  ground: string;
}

export interface ArProvider {
  /** true เมื่อเป็น AR จริง (สแกน marker / WebXR) — ตัวจำลองต้องเป็น false เสมอ */
  real: boolean;
  name: string;
}

export const SIMULATED_AR: ArProvider = { real: false, name: 'ตัวอย่างการแสดงผล AR (จำลอง)' };
export const getArProvider = (): ArProvider => SIMULATED_AR;

const s = (key: string, title: string, ground: string, props: ArScene['props']): ArScene => ({ key, title, ground, props });

/** ฉากของสถานการณ์ทั้งสี่ในตารางที่ 2 */
export const AR_SCENES: Record<string, ArScene> = {
  'cat-fish': s('cat-fish', 'แมวกินปลา', '#ffe2c4', [{ icon: '🐈', x: -0.5, z: 0.1, label: 'แมว' }, { icon: '🐟', x: 0.1, z: 0.1, y: 0.2, label: 'ปลาทู' }, { icon: '🍽️', x: 0.1, z: 0.1 }, { icon: '👵', x: 0.6, z: -0.5 }]),
  'dog-ball': s('dog-ball', 'น้องกับสุนัขเล่นลูกบอล', '#bde7a8', [{ icon: '👧', x: -0.5, z: 0.2, label: 'น้อง' }, { icon: '⚽', x: 0, z: 0.3, label: 'ลูกบอล' }, { icon: '🐕', x: 0.5, z: 0.1, label: 'สุนัข' }, { icon: '🏡', x: 0, z: -0.7 }]),
  'kite-field': s('kite-field', 'ว่าว ทุ่งนา ลม', '#e6f6c8', [{ icon: '🪁', x: 0.2, z: -0.2, y: 0.8, label: 'ว่าว' }, { icon: '💨', x: -0.4, z: 0, y: 0.5, label: 'ลม' }, { icon: '🌾', x: -0.5, z: 0.4, label: 'ทุ่งนา' }, { icon: '🌾', x: 0.5, z: 0.4 }]),
  'sweep-class': s('sweep-class', 'นักเรียนกวาดห้องเรียน', '#d9d4ff', [{ icon: '🧒', x: -0.4, z: 0.2, label: 'นักเรียน' }, { icon: '🧹', x: -0.1, z: 0.2, y: 0.2, label: 'ไม้กวาด' }, { icon: '🏫', x: 0.3, z: -0.6, label: 'ห้องเรียน' }, { icon: '🪑', x: 0.6, z: 0.2 }]),
};
