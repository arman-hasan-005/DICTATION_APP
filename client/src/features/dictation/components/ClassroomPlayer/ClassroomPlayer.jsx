import ProgressBar from "../../../../components/ui/ProgressBar/ProgressBar";
import styles from "./ClassroomPlayer.module.css";

const SOURCE_META = {
  stored: {
    label: "Stored Audio",
    icon: "📼",
    color: "#059669",
    bg: "#ECFDF5",
  },
  google: { label: "Google TTS", icon: "☁️", color: "#2563EB", bg: "#EFF6FF" },
  browser: {
    label: "Browser Voice",
    icon: "🌐",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
};

export default function ClassroomPlayer({
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

  const statusText = () => {
    if (loading) return "⏳ Loading audio…";
    if (pauseActive) return `⏸ Pause — next in ${pauseCountdown}s`;
    if (playing && totalRepeats > 1)
      return `🔊 Playing (${currentRepeat}/${totalRepeats})`;
    if (playing) return "🔊 Listening…";
    if (hasAudio) return "✅ Ready — press replay or continue";
    if (!browserSupported && !isUploaded)
      return "⚠️ Browser speech not supported — press play to check";
    return "▶ Press play to hear the dictation";
  };

  return (
    <div className={styles.player}>
      {/* Top bar: progress + info badges */}
      <div className={styles.topBar}>
        <div className={styles.progressWrap}>
          <ProgressBar
            value={progress}
            showValue
            label={
              isHandwrite
                ? "Full Passage"
                : `Sentence ${currentIndex + 1} / ${totalCount}`
            }
          />
        </div>
        <div className={styles.badges}>
          {src && (
            <span
              className={styles.sourceBadge}
              style={{
                background: src.bg,
                color: src.color,
                borderColor: src.color + "33",
              }}
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
            playing ? styles.playing : "",
            loading ? styles.loadingBtn : "",
            pauseActive ? styles.pausing : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => {
            if (playing) {
              onPause();
            } else {
              // Prime the Web Speech API synchronously inside the user gesture.
              // Browsers require speechSynthesis.speak() to originate from a user
              // gesture. For pre-written passages there is no HTTP delay before
              // speak() is called, so the gesture window can expire before the
              // 150ms cancel-delay inside speakText(). Calling cancel() here
              // (synchronously, in the click handler) keeps the API "activated"
              // so the subsequent async speak() call is accepted by the browser.
              if (typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
              onStart();
            }
          }}
          disabled={loading || pauseActive}
          aria-label={playing ? "Pause" : "Play"}
          type="button"
        >
          {loading ? <span className={styles.spinner} /> : playing ? "⏸" : "▶"}
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
                style={{
                  width: `${((pauseDuration - pauseCountdown) / pauseDuration) * 100}%`,
                }}
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
                  i < currentRepeat ? styles.pillDone : "",
                  i === currentRepeat - 1 && playing ? styles.pillActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            ))}
          </div>
        )}
      </div>

      <p className={styles.status}>{statusText()}</p>
      {error && <p className={styles.error}>⚠️ {error}</p>}
    </div>
  );
}
