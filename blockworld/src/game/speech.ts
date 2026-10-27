// อ่านออกเสียงด้วย SpeechSynthesis (ถ้าเครื่องรองรับ) — ถ้าไม่รองรับ ให้ผู้เรียกแสดงข้อความแทน
export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

export function speak(text: string): boolean {
  if (!speechSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'th-TH';
    u.rate = 0.9;
    const th = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('th'));
    if (th) u.voice = th;
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}
