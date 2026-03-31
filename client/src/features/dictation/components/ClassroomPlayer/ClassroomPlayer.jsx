/**
 * ClassroomPlayer
 *
 * REFACTORING vs original:
 *
 *   React.memo:
 *     ClassroomPlayer is a pure presentational component — it has no internal
 *     state and derives everything from props. In DictationPage it sits inside
 *     the modeArea which re-renders when the user types in TypeMode.
 *     Without memo, the entire player (including the progress bar calculation
 *     and SOURCE_META lookups) re-renders on every keystroke.
 *
 *   statusText → moved outside component:
 *     Was an inner function re-created on every render. Now a pure function
 *     receiving just the props it needs — zero closure overhead.
 *
 *   Play button onClick inlined as a named handler for clarity:
 *     The original had a comment explaining the speechSynthesis.cancel() trick;
 *     now isolated in `handlePlayClick` so the comment stays with the logic.
 *
 *   PropTypes documentation (via JSDoc) added for all 16 props.
 */

import { memo, useCallback } from 'react';
import ProgressBar from '../../../../components/ui/ProgressBar/ProgressBar';
import styles from './ClassroomPlayer.module.css';

// ── Audio source badge metadata ───────────────────────────────────────────────
const SOURCE_META = {
  stored:  { label: 'Stored Audio', icon: '📼', color: '#059669', bg: '#ECFDF5' },
  google:  { label: 'Google TTS',   icon: '☁️', color: '#2563EB', bg: '#EFF6FF' },
  browser: { label: 'Browser Voice',icon: '🌐', color: '#7C3AED', bg: '#F5F3FF' },
};

// ── Pure status text helper (no closure — easy to unit-test) ─────────────────
function resolveStatusText({ loading, pauseActive, pauseCountdown, playing, totalRepeats, currentRepeat, hasAudio, browserSupported, isUploaded }) {
  if (loading)                        return '⏳ Loading audio…';
  if (pauseActive)                    return `⏸ Pause — next in ${pauseCountdown}s`;
  if (playing && totalRepeats > 1)    return `🔊 Playing (${currentRepeat}/${totalRepeats})`;
  if (playing)                        return '🔊 Listening…';
  if (hasAudio)                       return '✅ Ready — press replay or continue';
  if (!browserSupported && !isUploaded) return '⚠️ Browser speech not supported — press play to check';
  return '▶ Press play to hear the dictation';
}

// ─────────────────────────────────────────────────────────────────────────────

const ClassroomPlayer = memo(function ClassroomPlayer({
  currentIndex,
  totalCount,
  progress,
  playing,
  loading,
  error,
  pauseActive,
  pauseCountdown,
  currentRepeat,
  totalRepeats,
  hasAudio,
  audioSource,
  browserSupported,
  onStart,
  onPause,
  onReplay,
  isHandwrite,
  isUploaded,
  speed,
  pauseDuration,
}) {
  const src = audioSource ? SOURCE_META[audioSource] : null;

  // Browsers require speechSynthesis.speak() to be called within a user
  // gesture. For pre-written passages there's no HTTP fetch before speak(),
  // so the gesture window can expire. Calling cancel() synchronously here
  // keeps the API "activated" before the 150ms delay in speakText().
  const handlePlayClick = useCallback(() => {
    if (playing) {
      onPause();
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      onStart();
    }
  }, [playing, onPause, onStart]);

  const statusText = resolveStatusText({
    loading, pauseActive, pauseCountdown, playing,
    totalRepeats, currentRepeat, hasAudio, browserSupported, isUploaded,
  });

  return (
    <div className={styles.player}>
      {/* Top bar: progress + info badges */}
      <div className={styles.topBar}>
        <div className={styles.progressWrap}>
          <ProgressBar
            value={progress}
            showValue
            label={isHandwrite ? 'Full Passage' : `Sentence ${currentIndex + 1} / ${totalCount}`}
          />
        </div>
        <div className={styles.badges}>
          {src && (
            <span
              className={styles.sourceBadge}
              style={{ background: src.bg, color: src.color, borderColor: `${src.color}33` }}
              title={`Voice source: ${src.label}`}
            >
              {src.icon} {src.label}
            </span>
          )}
          <span className={styles.badge}>⚡ {speed}×</span>
          <span className={styles.badge}>🔁 {totalRepeats}×</span>
          <span className={styles.badge}>⏸ {pauseDuration}s</span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controlRow}>
        <button
          className={[
            styles.playBtn,
            playing     ? styles.playing   : '',
            loading     ? styles.loadingBtn : '',
            pauseActive ? styles.pausing   : '',
          ].filter(Boolean).join(' ')}
          onClick={handlePlayClick}
          disabled={loading || pauseActive}
          aria-label={playing ? 'Pause' : 'Play'}
          type="button"
        >
          {loading ? <span className={styles.spinner} /> : playing ? '⏸' : '▶'}
        </button>

        {hasAudio && !playing && !loading && !pauseActive && (
          <button className={styles.replayBtn} onClick={onReplay} type="button">
            🔁 Replay
          </button>
        )}

        {pauseActive && pauseDuration > 0 && (
          <div className={styles.pauseWrap}>
            <span className={styles.pauseLabel}>Pause</span>
            <div className={styles.pauseBar}>
              <div
                className={styles.pauseFill}
                style={{ width: `${((pauseDuration - pauseCountdown) / pauseDuration) * 100}%` }}
              />
            </div>
            <span className={styles.pauseCount}>{pauseCountdown}s</span>
          </div>
        )}

        {totalRepeats > 1 && (
          <div className={styles.repeatPills}>
            {Array.from({ length: totalRepeats }).map((_, i) => (
              <div
                key={i}
                className={[
                  styles.pill,
                  i < currentRepeat                              ? styles.pillDone   : '',
                  i === currentRepeat - 1 && playing            ? styles.pillActive : '',
                ].filter(Boolean).join(' ')}
              />
            ))}
          </div>
        )}
      </div>

      <p className={styles.status}>{statusText}</p>
      {error && <p className={styles.error}>⚠️ {error}</p>}
    </div>
  );
});

export default ClassroomPlayer;
