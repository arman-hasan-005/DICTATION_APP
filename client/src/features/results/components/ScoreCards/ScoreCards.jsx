import ProgressBar from '../../../../components/ui/ProgressBar/ProgressBar';
import styles from './ScoreCards.module.css';

const StatCard = ({ icon, value, sub, label, color }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statValue} style={color?{color}:undefined}>
      {value}{sub && <span className={styles.statSub}>/{sub}</span>}
    </div>
    <div className={styles.statLabel}>{label}</div>
  </div>
);

export default function ScoreCards({ grade, overallPercentage, totalCorrect, totalWords, answeredSentences, totalSentences, xpEarned, saving, isHandwrite }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.gradeCard} style={{ background: grade.bgColor, borderColor: grade.color }}>
        <div className={styles.gradeLabel}>Grade</div>
        <div className={styles.gradeLetter} style={{ color: grade.color }}>{grade.label}</div>
        <div className={styles.gradeMsg} style={{ color: grade.color }}>{grade.message}</div>
      </div>
      <div className={styles.statsRow}>
        <StatCard icon="🎯" value={`${overallPercentage}%`} label="Overall Accuracy" color="var(--color-primary)" />
        <StatCard icon="📝" value={totalCorrect} sub={totalWords} label="Words Correct" />
        <StatCard icon="📖" value={answeredSentences} sub={isHandwrite ? 1 : totalSentences} label={isHandwrite ? 'Passage Attempted' : 'Sentences Done'} />
        <StatCard icon="⚡" value={saving ? '…' : `+${xpEarned}`} label="XP Earned" color="var(--color-warning)" />
      </div>
      <div className={styles.progressSection}>
        <ProgressBar value={overallPercentage} color={grade.color} label="Overall Score" showValue />
      </div>
    </div>
  );
}
