import { useNavigate } from 'react-router-dom';
import { getGrade, getScoreColor } from '../../../../utils/grading';
import { formatRelativeTime }      from '../../../../utils/formatting';
import { getLevelConfig }          from '../../../../constants/levels';
import { ROUTES }                  from '../../../../constants/routes';
import Button                      from '../../../../components/ui/Button/Button';
import styles                      from './RecentSessions.module.css';

export default function RecentSessions({ sessions = [], loading }) {
  const navigate = useNavigate();
  if (loading) return <div className={styles.skeleton} />;
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Sessions</h2>
        <div className={styles.headerActions}>
          {sessions.length > 0 && (
            <button
              type="button"
              className={styles.viewAllBtn}
              onClick={() => navigate(ROUTES.SESSIONS)}
            >
              View all →
            </button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SETUP)}>
            + New Session
          </Button>
        </div>
      </div>
      {sessions.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>📭</p>
          <p className={styles.emptyText}>No sessions yet. Start practicing!</p>
          <Button onClick={() => navigate(ROUTES.SETUP)} size="sm">Start First Session</Button>
        </div>
      ) : (
        <div className={styles.list}>
          {sessions.map(s => {
            const grade = getGrade(s.score);
            const cfg   = getLevelConfig(s.level);
            return (
              <div key={s._id} className={styles.row}>
                <div className={styles.gradeChip} style={{ background: grade.bgColor, color: grade.color }}>
                  {grade.label}
                </div>
                <div className={styles.info}>
                  <p className={styles.passageTitle}>{s.passageTitle}</p>
                  <p className={styles.meta}>
                    <span style={{ color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
                    {' · '}{formatRelativeTime(s.createdAt)}
                  </p>
                </div>
                <div className={styles.score} style={{ color: getScoreColor(s.score) }}>
                  {s.score}%
                </div>
                <div className={styles.xp}>+{s.xpEarned} XP</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
