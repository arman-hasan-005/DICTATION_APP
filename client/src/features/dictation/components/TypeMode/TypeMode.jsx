import { useRef, useEffect } from 'react';
import Button from '../../../../components/ui/Button/Button';
import styles from './TypeMode.module.css';

export default function TypeMode({ currentIndex, totalCount, answer, onAnswerChange, onNext, onPrev, isLast }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, [currentIndex]);
  const handleKeyDown = (e) => { if ((e.ctrlKey||e.metaKey) && e.key==='Enter') { e.preventDefault(); onNext(); } };
  return (
    <div className={styles.wrapper}>
      <div className={styles.inputCard}>
        <label className={styles.label}>Type what you hear — Sentence {currentIndex+1} of {totalCount}</label>
        <textarea ref={ref} className={styles.textarea} value={answer} onChange={e => onAnswerChange(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Start typing after listening…" rows={4} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
        <p className={styles.hint}>Tip: <kbd>Ctrl</kbd>+<kbd>Enter</kbd> = next sentence</p>
      </div>
      <div className={styles.nav}>
        <Button variant="ghost" onClick={onPrev} disabled={currentIndex===0}>← Previous</Button>
        <div className={styles.dots}>
          {Array.from({length:totalCount}).map((_,i) => (
            <span key={i} className={[styles.dot, i===currentIndex?styles.dotActive:i<currentIndex?styles.dotDone:''].filter(Boolean).join(' ')} />
          ))}
        </div>
        <Button onClick={onNext}>{isLast?'✅ Finish':'Next →'}</Button>
      </div>
    </div>
  );
}
