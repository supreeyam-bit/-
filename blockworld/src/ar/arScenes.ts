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

export const AR_SCENES: Record<string, ArScene> = {
  canteen: s('canteen', 'โรงอาหาร', '#c9b6ff', [{ icon: '🧒', x: -0.5, z: 0.2, label: 'เด็ก' }, { icon: '🍚', x: 0.3, z: 0.1, label: 'ข้าว' }, { icon: '🏫', x: 0, z: -0.7 }]),
  garden: s('garden', 'สวนหลังโรงเรียน', '#bde7a8', [{ icon: '👧', x: -0.6, z: 0.3 }, { icon: '👦', x: 0.6, z: 0.3 }, { icon: '🌱', x: 0, z: 0 }, { icon: '🚿', x: 0.2, z: -0.5 }]),
  classroom: s('classroom', 'ห้องเรียน', '#d9d4ff', [{ icon: '👩‍🏫', x: -0.4, z: 0, label: 'คุณครู' }, { icon: '📚', x: 0, z: 0.3 }, { icon: '🧒', x: 0.5, z: 0, label: 'นักเรียน' }]),
  'cat-fish': s('cat-fish', 'แมว กิน ปลา', '#d9d4ff', [{ icon: '🐱', x: -0.5, z: 0, label: 'ผู้ทำ' }, { icon: '🍽️', x: 0, z: 0, label: 'การกระทำ' }, { icon: '🐟', x: 0.5, z: 0, label: 'ผู้รับ' }]),
  'girl-watering': s('girl-watering', 'เด็กหญิงรดน้ำต้นไม้', '#bde7a8', [{ icon: '👧', x: -0.4, z: 0 }, { icon: '🚿', x: 0, z: 0, y: 0.3 }, { icon: '🌳', x: 0.5, z: -0.2 }]),
  'buffalo-field': s('buffalo-field', 'ควายในทุ่งนา', '#e6f6c8', [{ icon: '🐃', x: -0.2, z: 0.1 }, { icon: '🌿', x: 0.4, z: 0.3 }, { icon: '🌾', x: -0.6, z: -0.5 }, { icon: '🌾', x: 0.6, z: -0.5 }]),
  'buffalo-walk': s('buffalo-walk', 'ควายเดินบนคันนา', '#e6f6c8', [{ icon: '🐃', x: -0.3, z: 0 }, { icon: '👣', x: 0.3, z: 0.1 }, { icon: '💧', x: 0.7, z: -0.4 }]),
  'boy-search': s('boy-search', 'เด็กชายตามหาควาย', '#ffe9a8', [{ icon: '👦', x: -0.5, z: 0.2 }, { icon: '🔦', x: -0.2, z: 0.2, y: 0.3 }, { icon: '🌅', x: 0.3, z: -0.7 }, { icon: '🐃', x: 0.6, z: -0.1 }]),
  'notice-board': s('notice-board', 'ป้ายประกาศหน้าศาลา', '#e6f6c8', [{ icon: '📜', x: 0, z: 0, y: 0.3 }, { icon: '🏠', x: -0.6, z: -0.4 }, { icon: '🐃', x: 0.6, z: 0.2 }]),
  boxes: s('boxes', 'กล่องหลังตลาดนัด', '#ffe2c4', [{ icon: '📦', x: 0, z: 0 }, { icon: '🧑', x: -0.6, z: 0.2, label: 'เพื่อน' }, { icon: '👩‍🏫', x: 0.6, z: 0.2, label: 'คุณครู' }]),
  'fruit-stall': s('fruit-stall', 'แผงผลไม้', '#ffe2c4', [{ icon: '👵', x: 0.4, z: -0.2 }, { icon: '🥭', x: 0, z: 0.2 }, { icon: '🧒', x: -0.5, z: 0.3 }]),
  merchant: s('merchant', 'ลุงพ่อค้าแบกของ', '#ffd6c9', [{ icon: '👴', x: -0.3, z: 0 }, { icon: '📦', x: -0.3, z: 0, y: 0.5 }, { icon: '🚚', x: 0.6, z: -0.4 }]),
  oranges: s('oranges', 'ส้มกลิ้งในตลาด', '#ffe2c4', [{ icon: '🍊', x: -0.4, z: 0.4 }, { icon: '🍊', x: 0.2, z: 0.5 }, { icon: '🛍️', x: 0, z: -0.1 }, { icon: '🧑', x: 0.6, z: -0.3 }]),
  'dessert-shop': s('dessert-shop', 'ร้านขนมไทย', '#ffd6e8', [{ icon: '🧁', x: -0.5, z: -0.1 }, { icon: '🍡', x: 0, z: -0.1 }, { icon: '🍮', x: 0.5, z: -0.1 }, { icon: '🧒', x: 0, z: 0.5 }]),
};
