/**
 * ReviewPanel
 *
 * Extracted from the `session.completed` branch of DictationPage.
 *
 * BUG FIX (original code):
 *   The original onChange handler built a new answers array but never called
 *   any state-setter — changes made during review were silently discarded.
 *
 *   Fix: accept `onUpdateAnswer(index, value)` from useDictationSession's
 *   new `updateAnswer` function so edits are properly persisted to the
 *   answers array before finishSession() navigates to /results.
 *
 * PROPS:
 *   sentences       string[]  — original sentences
 *   answers         string[]  — current typed answers (mutable via review)
 *   isHandwrite     boolean
 *   handwrittenText string    — handwrite result
 *   onUpdateAnswer  fn(index, value) — persists edits (NEW)
 *   onSetHandwrittenText fn(value)
 *   onBack          fn()      — return to active dictation
 *   onSubmit        fn()      — finishSession()
 *   onHandwriteFinish fn()    — for handwrite submit inside review
 */

import { memo } from 'react';
import HandwriteMode from '../HandwriteMode/HandwriteMode';
import Button from '../../../../components/ui/Button/Button';
import styles from './ReviewPanel.module.css';

const ReviewPanel = memo(function ReviewPanel({
  sentences,
  answers,
  isHandwrite,
  handwrittenText,
  onUpdateAnswer,
  onSetHandwrittenText,
  onBack,
  onSubmit,
}) {
  return (
    <div className={styles.panel}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <span className={styles.icon}>🎉</span>
        <div>
          <h3 className={styles.title}>Dictation Complete!</h3>
          <p className={styles.subtitle}>
            Review your answers below, then submit when ready.
          </p>
        </div>
      </div>

      {/* ── Per-sentence review (Type Mode) ── */}
      {!isHandwrite && (
        <div className={styles.answerList}>
          {sentences.map((sentence, i) => (
            <div key={i} className={styles.answerRow}>
              <span className={styles.sentenceNum}>{i + 1}</span>
              <textarea
                className={styles.answerTextarea}
                value={answers[i] ?? ''}
                onChange={(e) => onUpdateAnswer(i, e.target.value)}  // ← BUG FIX
                rows={2}
                spellCheck={false}
                placeholder="No answer entered"
                aria-label={`Answer for sentence ${i + 1}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Handwrite review ── */}
      {isHandwrite && (
        <HandwriteMode
          handwrittenText={handwrittenText}
          onTextChange={onSetHandwrittenText}
          onFinish={onSubmit}
        />
      )}

      {/* ── Footer actions ── */}
      <div className={styles.actions}>
        <button
          className={styles.backBtn}
          onClick={onBack}
          type="button"
        >
          ← Back to dictation
        </button>

        {!isHandwrite && (
          <Button size="lg" onClick={onSubmit}>
            ✅ Submit &amp; Check Answers
          </Button>
        )}
      </div>
    </div>
  );
});

export default ReviewPanel;
