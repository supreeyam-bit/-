import { useEffect, useState, type ReactNode } from 'react';
import { SITUATION_ART, areaInfo } from '../data';
import type { AreaEn } from '../types';

export function Modal({ title, onClose, children, wide, icon }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean; icon?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>{icon && <span className="modal-icon">{icon}</span>}{title}</h2>
          <button className="btn ghost" onClick={onClose} aria-label="ปิด">✕ ปิด</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/** แสดงภาพต้นแบบจาก public/assets/ ถ้ามีไฟล์ ถ้าไม่มีจะซ่อนเงียบ ๆ และใช้ UI ที่วาดด้วยโค้ดแทน */
export function OptionalImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return <img src={src} alt={alt} className={className} onError={() => setOk(false)} />;
}

export function SituationArt({ area, title, small }: { area: AreaEn; title: string; small?: boolean }) {
  const art = SITUATION_ART[area];
  const idx = ['Fluency', 'Flexibility', 'Originality', 'Elaboration'].indexOf(area) + 1;
  return (
    <figure className={`situation ${small ? 'small' : ''}`} style={{ background: `linear-gradient(${art.sky} 62%, ${art.ground} 62%)` }}>
      <OptionalImage src={`assets/components/situation-${idx}.png`} alt={title} className="situation-img" />
      <div className="situation-emoji" aria-hidden>{art.emoji.map((e, i) => <span key={i} style={{ animationDelay: `${i * 0.3}s` }}>{e}</span>)}</div>
      <figcaption><span style={{ color: areaInfo(area).color }}>{areaInfo(area).shape}</span> {title}</figcaption>
    </figure>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    draft: ['กำลังทำ', 'st-draft'], submitted: ['รอครูตรวจ', 'st-sub'], approved: ['ครูรับรองแล้ว', 'st-ok'], revise: ['ให้ปรับปรุง', 'st-rev'],
  };
  const [label, cls] = map[status] ?? [status, ''];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export const fmtTime = (t: number) => new Date(t).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
