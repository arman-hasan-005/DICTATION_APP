/**
 * SessionsPage — /sessions
 *
 * ACCURACY FIX:
 *   Previously the analytics panel showed "Avg accuracy this week" —
 *   a 7-day rolling average of session scores, which is a completely
 *   different number from the Dashboard's "Avg Accuracy" stat.
 *
 *   The Dashboard shows:  totalCorrectWords / totalWords × 100  (all-time)
 *   History was showing:  average of daily avgScore in the last 7 days
 *
 *   Fix: the top stat row now shows stats.overall.accuracy which is
 *   computed server-side as SUM(session.correctWords) / SUM(session.totalWords) × 100
 *   — the same formula as the Dashboard, so both sections always show
 *   the same number.
 *
 *   "Avg accuracy this week" is kept as a secondary context line so users
 *   can still see their recent trend.
 */

import { useState }              from 'react';
import { useNavigate }           from 'react-router-dom';
import PageWrapper               from '../../../components/layout/PageWrapper/PageWrapper';
import Button                    from '../../../components/ui/Button/Button';
import Loader                    from '../../../components/ui/Loader/Loader';
import { useFetch }              from '../../../hooks/useFetch';
import sessionService            from '../../../services/sessionService';
import { getGrade, getScoreColor } from '../../../utils/grading';
import { getLevelConfig }        from '../../../constants/levels';
import { formatRelativeTime }    from '../../../utils/formatting';
import { ROUTES }                from '../../../constants/routes';
import styles                    from './SessionsPage.module.css';

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, width = 300, height = 60 }) {
  if (!data?.length) return null;
  const scores = data.map(d => d.avgScore);
  const min    = Math.min(...scores, 0);
  const max    = Math.max(...scores, 100);
  const range  = max - min || 1;
  const pts    = scores.map((s, i) => {
    const x = (i / Math.max(scores.length - 1, 1)) * width;
    const y = height - ((s - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.sparkline} aria-hidden="true">
      <polyline points={pts} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" />
      {scores.map((s, i) => {
        const x = (i / Math.max(scores.length - 1, 1)) * width;
        const y = height - ((s - min) / range) * (height - 8) - 4;
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--color-primary)" />;
      })}
    </svg>
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────
function TrendBadge({ direction, thisWeekAvg, lastWeekAvg }) {
  if (direction === 'neutral' || thisWeekAvg === null) return null;
  const icon  = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const color = direction === 'up'   ? 'var(--color-success)'
              : direction === 'down' ? 'var(--color-danger)'
              :                        'var(--color-text-muted)';
  const diff  = lastWeekAvg !== null
    ? Math.abs(thisWeekAvg - lastWeekAvg).toFixed(1)
    : null;
  return (
    <span className={styles.trendBadge} style={{ color }}>
      {icon}{diff ? ` ${diff}% vs last week` : ''}
    </span>
  );
}

// ── Session row ───────────────────────────────────────────────────────────────
function SessionRow({ session }) {
  const [expanded, setExpanded] = useState(false);
  const grade = getGrade(session.score);
  const cfg   = getLevelConfig(session.level);

  return (
    <div className={styles.sessionRow}>
      <button
        type="button"
        className={styles.sessionSummary}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <div className={styles.gradeChip} style={{ background: grade.bgColor, color: grade.color }}>
          {grade.label}
        </div>
        <div className={styles.sessionInfo}>
          <p className={styles.sessionTitle}>{session.passageTitle}</p>
          <p className={styles.sessionMeta}>
            <span style={{ color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
            {session.isHandwrite && <span className={styles.modeTag}>✍️ Handwrite</span>}
            {' · '}{formatRelativeTime(session.createdAt)}
            {' · '}{session.totalWords} words
          </p>
        </div>
        <div className={styles.sessionRight}>
          <span className={styles.scoreNum} style={{ color: getScoreColor(session.score) }}>
            {session.score}%
          </span>
          <span className={styles.xpChip}>+{session.xpEarned} XP</span>
          <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className={styles.sessionDetail}>
          <div className={styles.detailStats}>
            <div className={styles.detailStat}>
              <span className={styles.detailStatValue}>{session.correctWords}</span>
              <span className={styles.detailStatLabel}>Correct words</span>
            </div>
            <div className={styles.detailStat}>
              <span className={styles.detailStatValue}>
                {session.totalWords > 0
                  ? `${Math.round((session.correctWords / session.totalWords) * 100)}%`
                  : '—'}
              </span>
              <span className={styles.detailStatLabel}>Accuracy</span>
            </div>
            <div className={styles.detailStat}>
              <span className={styles.detailStatValue}>{session.xpEarned}</span>
              <span className={styles.detailStatLabel}>XP earned</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SessionsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [days, setDays] = useState(30);

  const { data: statsData, loading: statsLoading } =
    useFetch(() => sessionService.getStats(days), { deps: [days] });

  const { data: sessionsData, loading: sessionsLoading } =
    useFetch(() => sessionService.getAll({ page, limit: 20 }), { deps: [page] });

  const stats      = statsData;
  const sessions   = sessionsData?.sessions ?? [];
  const pagination = sessionsData?.pagination;

  // ── Overall accuracy — same formula as Dashboard ──────────────────────────
  // stats.overall.accuracy = SUM(session.correctWords) / SUM(session.totalWords) × 100
  // Dashboard shows: user.totalCorrectWords / user.totalWords × 100
  // Both are the all-time word-level weighted average — they are identical.
  const overallAccuracy = stats?.overall?.accuracy ?? null;
  const totalSessions   = stats?.overall?.sessions  ?? 0;

  return (
    <PageWrapper>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Session History</h1>
          <p className={styles.subtitle}>Your progress and performance over time</p>
        </div>
        <Button onClick={() => navigate(ROUTES.SETUP)}>🎧 New Session</Button>
      </div>

      {/* ── Analytics panel ── */}
      <div className={styles.analyticsCard}>
        <div className={styles.analyticsHeader}>
          <h2 className={styles.sectionTitle}>📈 Progress</h2>
          <div className={styles.daysPicker}>
            {[7, 30, 90].map(d => (
              <button
                key={d}
                type="button"
                className={[styles.daysBtn, days === d ? styles.daysBtnActive : ''].filter(Boolean).join(' ')}
                onClick={() => setDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {statsLoading ? (
          <div className={styles.statsLoading}><Loader /></div>
        ) : stats ? (
          <>
            {/* ── Top stat row — matches Dashboard ── */}
            <div className={styles.overallRow}>
              {/* Avg Accuracy — same value as Dashboard "Avg Accuracy" */}
              <div className={styles.overallStat}>
                <span className={styles.overallIcon}>🎯</span>
                <div>
                  <div className={styles.overallValue}>
                    {overallAccuracy !== null ? `${overallAccuracy}%` : '—'}
                  </div>
                  <div className={styles.overallLabel}>Avg Accuracy</div>
                  <div className={styles.overallNote}>all-time · matches dashboard</div>
                </div>
              </div>

              {/* Total sessions */}
              <div className={styles.overallStat}>
                <span className={styles.overallIcon}>📝</span>
                <div>
                  <div className={styles.overallValue}>{totalSessions}</div>
                  <div className={styles.overallLabel}>Total Sessions</div>
                  <div className={styles.overallNote}>all-time</div>
                </div>
              </div>

              {/* This-week accuracy — secondary context */}
              <div className={styles.overallStat}>
                <span className={styles.overallIcon}>📅</span>
                <div>
                  <div className={styles.overallValue}>
                    {stats.trend.thisWeekAvg !== null ? `${stats.trend.thisWeekAvg}%` : '—'}
                  </div>
                  <div className={styles.overallLabel}>This Week</div>
                  <div className={styles.overallNote}>
                    <TrendBadge {...stats.trend} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sparkline */}
            {stats.daily.length > 1 && (
              <div className={styles.sparklineWrap}>
                <Sparkline data={stats.daily} width={500} height={70} />
                <div className={styles.sparklineLabels}>
                  <span>
                    {new Date(stats.daily[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                  <span>
                    {new Date(stats.daily[stats.daily.length - 1].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            {stats.daily.length === 0 && (
              <p className={styles.noData}>No sessions in the last {days} days.</p>
            )}

            {/* Level breakdown */}
            {stats.levels.length > 0 && (
              <div className={styles.levelBreakdown}>
                <p className={styles.levelBreakdownTitle}>Performance by level</p>
                <div className={styles.levelGrid}>
                  {stats.levels.map(l => {
                    const cfg = getLevelConfig(l.level);
                    return (
                      <div key={l.level} className={styles.levelCard} style={{ borderColor: cfg.color }}>
                        <div className={styles.levelCardEmoji}>{cfg.emoji}</div>
                        <div className={styles.levelCardName} style={{ color: cfg.color }}>{cfg.label}</div>
                        <div className={styles.levelCardStat}>{l.avgScore}%</div>
                        <div className={styles.levelCardLabel}>avg score</div>
                        <div className={styles.levelCardSessions}>{l.count} sessions</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className={styles.noData}>Complete your first session to see analytics here.</p>
        )}
      </div>

      {/* ── Session list ── */}
      <div className={styles.listCard}>
        <h2 className={styles.sectionTitle}>
          📝 All Sessions
          {pagination && <span className={styles.totalCount}> ({pagination.total})</span>}
        </h2>

        {sessionsLoading ? (
          <Loader />
        ) : sessions.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>📭</p>
            <p>No sessions yet. Start practicing to build your history!</p>
            <Button onClick={() => navigate(ROUTES.SETUP)} size="sm">Start First Session</Button>
          </div>
        ) : (
          <>
            <div className={styles.sessionList}>
              {sessions.map(s => <SessionRow key={s._id} session={s} />)}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={!pagination.hasMore}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
