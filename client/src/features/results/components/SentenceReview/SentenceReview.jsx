import { getScoreColor, getScoreBg } from '../../../../utils/grading';
import styles from './SentenceReview.module.css';

const WordChip = ({ word, correct }) => (
  <span className={[styles.word, correct ? styles.wordCorrect : styles.wordWrong].join(' ')}>{word}</span>
);

export default function SentenceReview({ sentenceResults, sentences, answers, handwrittenText, isHandwrite }) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{isHandwrite ? '📄 Full Passage Review' : '📝 Sentence by Sentence Review'}</h2>
      <div className={styles.list}>
        {sentenceResults.map((result, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardNum}>{isHandwrite ? 'Full Passage' : `Sentence ${i + 1}`}</span>
              <span className={styles.cardPct} style={{ color: getScoreColor(result.percentage), background: getScoreBg(result.percentage) }}>
                {result.percentage}%
              </span>
            </div>
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Original:</p>
              <div className={styles.wordRow}>
                {result.wordResults.map((w, j) => <WordChip key={j} word={w.word} correct={w.correct} />)}
              </div>
            </div>
            <div className={styles.section}>
              <p className={styles.sectionLabel}>{isHandwrite ? 'Your handwriting:' : 'Your answer:'}</p>
              <p className={styles.answerText}>
                {(isHandwrite ? handwrittenText : answers?.[i])?.trim()
                  ? (isHandwrite ? handwrittenText : answers[i])
                  : <span className={styles.noAnswer}>No answer given</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
