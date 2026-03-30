import { useBrowserTTS } from "../../hooks/useBrowserTTS";
import { useDictationSettings } from "../../../../context/DictationSettingsContext";
import {
  SPEED_OPTIONS,
  REPEAT_OPTIONS,
  PAUSE_OPTIONS,
} from "../../../../constants/dictationSettings";
import { GENDERS, ACCENTS, getAccentIcon } from "../../../../constants/voices";
import styles from "./DictationSettings.module.css";

export default function DictationSettings({ compact = false }) {
  const { settings, updateSettings } = useDictationSettings();
  const { isSupported: browserSupported, voices } = useBrowserTTS();
  const set = (key, value) => updateSettings({ [key]: value });

  const accentData = ACCENTS.find((a) => a.value === settings.accent);
  const genderData = GENDERS.find((g) => g.value === settings.voice);

  return (
    <div
      className={[styles.wrapper, compact ? styles.compact : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {!compact && (
        <div className={styles.header}>
          <span className={styles.headerIcon}>🎓</span>
          <div>
            <h3 className={styles.title}>Classroom Settings</h3>
            <p className={styles.subtitle}>
              Control voice, speed, repeats, and pauses
            </p>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {/* ── Voice Gender ── */}
        <div className={styles.field}>
          <label className={styles.label}>🎙️ Voice Gender</label>
          <div className={styles.voiceToggle}>
            {GENDERS.map((g) => (
              <button
                key={g.value}
                type="button"
                className={[
                  styles.voiceBtn,
                  settings.voice === g.value ? styles.active : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => set("voice", g.value)}
              >
                <span className={styles.voiceIcon}>{g.icon}</span>
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Accent ── */}
        <div className={styles.field}>
          <label className={styles.label}>🌍 Accent / Language</label>
          <div className={styles.accentGrid}>
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                className={[
                  styles.accentBtn,
                  settings.accent === a.value ? styles.active : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => set("accent", a.value)}
              >
                {/*<span className={styles.accentFlag}>{a.icon}</span>*/}
                <span className={styles.accentLabel}>{a.label}</span>
                <span className={styles.accentLang}>{a.lang}</span>
              </button>
            ))}
          </div>
        </div>

        {/* </div> {/* ── Voice system info ── */}
        {/*
        <div className={styles.voiceInfoCard}>
          <div className={styles.voiceInfoRow}>
            <span className={styles.voiceInfoIcon}>📼</span>
            <div>
              <p className={styles.voiceInfoTitle}>Pre-written passages</p>
              <p className={styles.voiceInfoDesc}>
                Use stored audio files from the database. Falls back to browser
                voice if not available.
              </p>
            </div>
          </div>
          <div className={styles.voiceInfoRow}>
            <span className={styles.voiceInfoIcon}>☁️</span>
            <div>
              <p className={styles.voiceInfoTitle}>Uploaded content</p>
              <p className={styles.voiceInfoDesc}>
                Uses Google Cloud TTS. Falls back to browser voice
                automatically.
              </p>
            </div>
          </div>
          <div className={styles.voiceInfoRow}>
            <span className={styles.voiceInfoIcon}>🌐</span>
            <div>
              <p className={styles.voiceInfoTitle}>Browser voice</p>
              <p
                className={[
                  styles.voiceInfoDesc,
                  !browserSupported ? styles.unsupported : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {browserSupported
                  ? `Available — ${voices.length} voice${voices.length !== 1 ? "s" : ""} on this device`
                  : "Not supported in this browser"}
              </p>
            </div>
          </div>
        </div> */}

        {/* ── Speed ── */}
        <div className={styles.field}>
          <label className={styles.label}>
            ⚡ Speed — <strong>{settings.speed}×</strong>
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.25"
            value={settings.speed}
            onChange={(e) => set("speed", parseFloat(e.target.value))}
            className={styles.slider}
          />
          <div className={styles.sliderLabels}>
            <span>0.5× Slow</span>
            <span>1× Normal</span>
            <span>1.5× Fast</span>
          </div>
        </div>

        {/* ── Repeat Count ── */}
        <div className={styles.field}>
          <label className={styles.label}>🔁 Repeat Each Sentence</label>
          <div className={styles.repeatGrid}>
            {REPEAT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                className={[
                  styles.repeatBtn,
                  settings.repeatCount === n ? styles.active : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => set("repeatCount", n)}
              >
                {n}×
              </button>
            ))}
          </div>
        </div>

        {/* ── Pause Duration ── */}
        <div className={styles.field}>
          <label className={styles.label}>⏸ Pause After Each Sentence</label>
          <select
            className={styles.select}
            value={settings.pauseDuration}
            onChange={(e) => set("pauseDuration", Number(e.target.value))}
          >
            {PAUSE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Auto-advance ── */}
        <div className={styles.field}>
          <label className={styles.toggleLabel}>
            <div className={styles.toggleInfo}>
              <span className={styles.label}>
                🚀 Auto-advance to next sentence
              </span>
              <span className={styles.hint}>
                Moves on automatically after the pause ends
              </span>
            </div>
            <div
              className={[
                styles.toggle,
                settings.autoAdvance ? styles.toggleOn : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => set("autoAdvance", !settings.autoAdvance)}
              role="switch"
              aria-checked={settings.autoAdvance}
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                set("autoAdvance", !settings.autoAdvance)
              }
            >
              <div className={styles.toggleThumb} />
            </div>
          </label>
        </div>
      </div>

      {!compact && (
        <div className={styles.preview}>
          <span className={styles.previewIcon}>📋</span>
          <p className={styles.previewText}>
            <strong>
              {genderData?.icon} {genderData?.label} · {accentData?.icon}{" "}
              {accentData?.label}
            </strong>{" "}
            voice at <strong>{settings.speed}×</strong> speed, repeated{" "}
            <strong>{settings.repeatCount}×</strong>, pausing{" "}
            <strong>{settings.pauseDuration}s</strong>.
            {settings.autoAdvance ? " Auto-advances." : ""}
          </p>
        </div>
      )}
    </div>
  );
}
