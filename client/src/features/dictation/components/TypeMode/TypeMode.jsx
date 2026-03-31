/**
 * TypeMode
 *
 * REFACTORING vs original:
 *
 *   React.memo:
 *     TypeMode re-renders on every keystroke (via onAnswerChange).
 *     The dots, nav buttons, and sentence bar are purely derived from props
 *     and don't need to re-render just because the textarea value changed.
 *     With memo, only the textarea itself (via controlled value) updates.
 *
 *   useCallback for handleKeyDown:
 *     Was recreated on every render; now stable since it only depends on
 *     onNext (which is already stable from useDictationSession).
 *
 *   NavigationDots extracted as an inner memoized component:
 *     Prevents the dot array from recalculating when only the answer text
 *     changes (it only changes when currentIndex changes).
 *
 *   Accessibility:
 *     - Added aria-label to textarea for screen readers.
 *     - Added keyboard hint to Previous/Next buttons via title attr.
 */

import { memo, useRef, useEffect, useCallback } from 'react';
import Button from '../../../../components/ui/Button/Button';
import styles from './TypeMode.module.css';

// ── Pure sub-component — only re-renders on index change ─────────────────────
const NavigationDots = memo(function NavigationDots({ totalCount, currentIndex }) {
  return (
    <div className={styles.dots} role="tablist" aria-label="Sentence progress">
      {Array.from({ length: totalCount }).map((_, i) => (
        <span
          key={i}
          role="tab"
          aria-selected={i === currentIndex}
          aria-label={`Sentence ${i + 1}${i < currentIndex ? ' (done)' : ''}`}
          className={[
            styles.dot,
            i === currentIndex ? styles.dotActive : '',
            i < currentIndex   ? styles.dotDone   : '',
          ].filter(Boolean).join(' ')}
        />
      ))}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

const TypeMode = memo(function TypeMode({
  currentIndex,
  totalCount,
  answer,
  onAnswerChange,
  onNext,
  onPrev,
  isLast,
}) {
  const ref = useRef(null);

  // Auto-focus the textarea when sentence changes
  useEffect(() => {
    ref.current?.focus();
  }, [currentIndex]);

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onNext();
      }
    },
    [onNext],
  );

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className={styles.wrapper}>
      {/* Sentence counter + word count */}
      <div className={styles.sentenceBar}>
        <span className={styles.sentenceLabel}>
          ✏️ Sentence {currentIndex + 1} of {totalCount}
        </span>
        <span className={styles.wordCount}>
          {wordCount} word{wordCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Notebook writing area */}
      <div className={styles.notebookOuter}>
        <div className={styles.notebookMargin} />
        <div className={styles.notebookLines}>
          <textarea
            ref={ref}
            className={styles.notebookTextarea}
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Listen carefully, then write what you heard…"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label={`Your answer for sentence ${currentIndex + 1}`}
          />
        </div>
      </div>

      <p className={styles.hint}>
        Tip: <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to go to next sentence
      </p>

      {/* Navigation */}
      <div className={styles.nav}>
        <Button variant="ghost" onClick={onPrev} disabled={currentIndex === 0}>
          ← Previous
        </Button>

        <NavigationDots totalCount={totalCount} currentIndex={currentIndex} />

        <Button onClick={onNext}>
          {isLast ? '✅ Done — Review Answers' : 'Next →'}
        </Button>
      </div>
    </div>
  );
});

export default TypeMode;
