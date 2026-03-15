import { useState } from 'react';
import { buildDetailedAnalysis } from '../../../../utils/scoring';
import { getScoreColor, getScoreBg } from '../../../../utils/grading';
import styles from './DetailedReview.module.css';

// ── Word chip: green/red/missing styling ──────────────────────────────────────
function WordChip({ word, typed, correct }) {
  const isMissing = !typed;
  return (
    <span
      className={[
        styles.chip,
        correct   ? styles.chipCorrect  : '',
        isMissing ? styles.chipMissing  : '',
        !correct && !isMissing ? styles.chipWrong : '',
      ].filter(Boolean).join(' ')}
      title={!correct && typed ? `You wrote: "${typed}"` : isMissing ? 'Missing' : ''}
    >
      {word}
      {!correct && typed && !isMissing && (
        <span className={styles.chipTyped}>{typed}</span>
      )}
    </span>
  );
}

// ── Summary bar at top ────────────────────────────────────────────────────────
function SummaryBar({ summary }) {
  const stats = [
    { icon: '✅', label: 'Correct',  value: summary.totalCorrect, color: '#059669', bg: '#ECFDF5' },
    { icon: '❌', label: 'Wrong',    value: summary.totalWrong,   color: '#DC2626', bg: '#FEF2F2' },
    { icon: '⬜', label: 'Missed',   value: summary.totalMissed,  color: '#D97706', bg: '#FFFBEB' },
    { icon: '📊', label: 'Accuracy', value: `${summary.accuracy}%`, color: '#4F46E5', bg: '#EEF2FF' },
  ];

  return (
    <div className={styles.summaryBar}>
      {stats.map((s) => (
        <div key={s.label} className={styles.summaryCard} style={{ background: s.bg }}>
          <span className={styles.summaryIcon}>{s.icon}</span>
          <span className={styles.summaryValue} style={{ color: s.color }}>{s.value}</span>
          <span className={styles.summaryLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Missed-word frequency chart ───────────────────────────────────────────────
function MissedWordsPanel({ topMissed }) {
  if (!topMissed.length) return null;
  const max = topMissed[0].count;
  return (
    <div className={styles.missedPanel}>
      <h4 className={styles.panelTitle}>⬜ Most Missed Words</h4>
      <p className={styles.panelSub}>Words you missed most frequently across all sentences</p>
      <div className={styles.missedList}>
        {topMissed.map(({ word, count }) => (
          <div key={word} className={styles.missedRow}>
            <span className={styles.missedWord}>{word}</span>
            <div className={styles.missedBarWrap}>
              <div
                className={styles.missedBar}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className={styles.missedCount}>{count}×</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Wrong-word substitution list ─────────────────────────────────────────────
function WrongWordsPanel({ allWrong }) {
  const unique = Array.from(
    new Map(allWrong.map((w) => [`${w.expected}→${w.typed}`, w])).values()
  ).slice(0, 12);

  if (!unique.length) return null;
  return (
    <div className={styles.wrongPanel}>
      <h4 className={styles.panelTitle}>❌ Wrong Substitutions</h4>
      <p className={styles.panelSub}>What you wrote vs what was expected</p>
      <div className={styles.wrongGrid}>
        {unique.map((w, i) => (
          <div key={i} className={styles.wrongCard}>
            <span className={styles.wrongExpected}>{w.expected}</span>
            <span className={styles.wrongArrow}>→</span>
            <span className={styles.wrongTyped}>{w.typed}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Per-sentence card ─────────────────────────────────────────────────────────
function SentenceCard({ data, index, isHandwrite }) {
  const [open, setOpen] = useState(index === 0); // first card open by default
  const color = getScoreColor(data.percentage);
  const bg    = getScoreBg(data.percentage);

  return (
    <div className={styles.sentCard}>
      <button
        className={styles.sentHeader}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className={styles.sentNum}>
          {isHandwrite ? 'Full Passage' : `Sentence ${index + 1}`}
        </span>
        <div className={styles.sentHeaderRight}>
          <span
            className={styles.sentPct}
            style={{ color, background: bg }}
          >
            {data.percentage}%
          </span>
          <span className={styles.sentChevron}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className={styles.sentBody}>
          {/* Original with colour-coded chips */}
          <div className={styles.sentSection}>
            <p className={styles.sentSectionLabel}>Original text:</p>
            <div className={styles.wordRow}>
              {data.wordResults.map((w, j) => (
                <WordChip key={j} word={w.word} typed={w.typed} correct={w.correct} />
              ))}
            </div>
          </div>

          {/* Missed words for this sentence */}
          {data.missed.length > 0 && (
            <div className={styles.sentSection}>
              <p className={[styles.sentSectionLabel, styles.labelMissed].join(' ')}>
                ⬜ Missed words ({data.missed.length}):
              </p>
              <div className={styles.wordRow}>
                {data.missed.map((w, j) => (
                  <span key={j} className={styles.tagMissed}>{w}</span>
                ))}
              </div>
            </div>
          )}

          {/* Wrong words for this sentence */}
          {data.wrong.length > 0 && (
            <div className={styles.sentSection}>
              <p className={[styles.sentSectionLabel, styles.labelWrong].join(' ')}>
                ❌ Wrong words ({data.wrong.length}):
              </p>
              <div className={styles.wrongPairs}>
                {data.wrong.map((w, j) => (
                  <span key={j} className={styles.wrongPair}>
                    <span className={styles.wrongPairExpected}>{w.expected}</span>
                    <span className={styles.wrongPairArrow}>→</span>
                    <span className={styles.wrongPairTyped}>{w.typed}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.missed.length === 0 && data.wrong.length === 0 && (
            <p className={styles.perfectMsg}>🎉 Perfect sentence!</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function DetailedReview({ sentenceResults, sentences, isHandwrite }) {
  const analysis = buildDetailedAnalysis(sentenceResults, sentences);

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>🔍 Detailed Answer Check</h2>
        <p className={styles.subtitle}>
          Word-by-word breakdown of your dictation — green = correct, red = wrong, orange = missed
        </p>
      </div>

      <SummaryBar summary={analysis.summary} />

      <div className={styles.panels}>
        <MissedWordsPanel topMissed={analysis.topMissed} />
        <WrongWordsPanel  allWrong={analysis.allWrong}   />
      </div>

      <div className={styles.sentenceList}>
        {analysis.perSentence.map((data, i) => (
          <SentenceCard
            key={i}
            data={data}
            index={i}
            isHandwrite={isHandwrite}
          />
        ))}
      </div>
    </div>
  );
}
