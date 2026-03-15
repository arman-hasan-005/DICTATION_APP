import { useEffect } from 'react';
import styles from './Modal.module.css';
export default function Modal({ isOpen, onClose, title, children, size='md' }) {
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={[styles.modal,styles[size]].join(' ')} onClick={e => e.stopPropagation()}>
        <div className={styles.header}><h3 className={styles.title}>{title}</h3><button className={styles.closeBtn} onClick={onClose}>✕</button></div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
