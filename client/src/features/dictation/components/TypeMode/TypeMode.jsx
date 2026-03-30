import { useRef, useEffect } from "react";
import Button from "../../../../components/ui/Button/Button";
import styles from "./TypeMode.module.css";

export default function TypeMode({
  currentIndex,
  totalCount,
  answer,
  onAnswerChange,
  onNext,
  onPrev,
  isLast,
}) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, [currentIndex]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onNext();
    }
  };

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className={styles.wrapper}>
      {/* Sentence counter */}
      <div className={styles.sentenceBar}>
        <span className={styles.sentenceLabel}>
          ✏️ Sentence {currentIndex + 1} of {totalCount}
        </span>
        <span className={styles.wordCount}>
          {wordCount} word{wordCount !== 1 ? "s" : ""}
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

        <div className={styles.dots}>
          {Array.from({ length: totalCount }).map((_, i) => (
            <span
              key={i}
              className={[
                styles.dot,
                i === currentIndex ? styles.dotActive : "",
                i < currentIndex ? styles.dotDone : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </div>

        <Button onClick={onNext}>
          {isLast ? "✅ Done — Review Answers" : "Next →"}
        </Button>
      </div>
    </div>
  );
}
