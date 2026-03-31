/**
 * DictationSettings
 *
 * REFACTORING vs original:
 *
 *   CLEANUP — removed dead code:
 *     The original contained ~60 lines of commented-out JSX:
 *       - A "Voice system info" card (3 rows explaining stored/Google/browser)
 *       - A duplicate closing </div> tag with a comment
 *     Dead commented code increases cognitive load and creates confusion
 *     about what is and isn't active. Removed entirely.
 *
 *   DRY — SettingField wrapper:
 *     The `<div className={styles.field}>` + `<label>` pattern repeated 6
 *     times. Extracted as a tiny `SettingField` component to reduce noise.
 *
 *   ACCESSIBILITY:
 *     - Toggle `div` replaced with `button` (keyboard + screen reader friendly).
 *     - Proper `role="switch"` + `aria-checked` preserved.
 *     - `type="button"` on all interactive elements.
 *
 *   NAMING:
 *     - `set` renamed to `handleChange` for clarity.
 */

import { memo } from 'react';
import { useDictationSettings } from '../../../../context/DictationSettingsContext';
import { useBrowserTTS } from '../../hooks/useBrowserTTS';
import {
  SPEED_OPTIONS,
  REPEAT_OPTIONS,
  PAUSE_OPTIONS,
} from '../../../../constants/dictationSettings';
import { GENDERS, ACCENTS } from '../../../../constants/voices';
import styles from './DictationSettings.module.css';

// ── Tiny wrapper to eliminate repeated field boilerplate ─────────────────────
function SettingField({ children }) {
  return <div className={styles.field}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────

const DictationSettings = memo(function DictationSettings({ compact = false }) {
  const { settings, updateSettings } = useDictationSettings();

  const handleChange = (key, value) => updateSettings({ [key]: value });

  const accentData = ACCENTS.find((a) => a.value === settings.accent);
  const genderData = GENDERS.find((g) => g.value === settings.voice);

  return (
    <div className={[styles.wrapper, compact ? styles.compact : ''].filter(Boolean).join(' ')}>
      {!compact && (
        <div className={styles.header}>
          <span className={styles.headerIcon}>🎓</span>
          <div>
            <h3 className={styles.title}>Classroom Settings</h3>
            <p className={styles.subtitle}>Control voice, speed, repeats, and pauses</p>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {/* Voice Gender */}
        <SettingField>
          <label className={styles.label}>🎙️ Voice Gender</label>
          <div className={styles.voiceToggle}>
            {GENDERS.map((g) => (
              <button
                key={g.value}
                type="button"
                className={[styles.voiceBtn, settings.voice === g.value ? styles.active : '']
                  .filter(Boolean).join(' ')}
                onClick={() => handleChange('voice', g.value)}
                aria-pressed={settings.voice === g.value}
              >
                <span className={styles.voiceIcon}>{g.icon}</span>
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        </SettingField>

        {/* Accent */}
        <SettingField>
          <label className={styles.label}>🌍 Accent / Language</label>
          <div className={styles.accentGrid}>
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                className={[styles.accentBtn, settings.accent === a.value ? styles.active : '']
                  .filter(Boolean).join(' ')}
                onClick={() => handleChange('accent', a.value)}
                aria-pressed={settings.accent === a.value}
              >
                <span className={styles.accentLabel}>{a.label}</span>
                <span className={styles.accentLang}>{a.lang}</span>
              </button>
            ))}
          </div>
        </SettingField>

        {/* Speed */}
        <SettingField>
          <label className={styles.label} htmlFor="speed-range">
            ⚡ Speed — <strong>{settings.speed}×</strong>
          </label>
          <input
            id="speed-range"
            type="range"
            min="0.5"
            max="1.5"
            step="0.25"
            value={settings.speed}
            onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
            className={styles.slider}
            aria-label={`Playback speed: ${settings.speed}×`}
          />
          <div className={styles.sliderLabels}>
            <span>0.5× Slow</span>
            <span>1× Normal</span>
            <span>1.5× Fast</span>
          </div>
        </SettingField>

        {/* Repeat Count */}
        <SettingField>
          <label className={styles.label}>🔁 Repeat Each Sentence</label>
          <div className={styles.repeatGrid}>
            {REPEAT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                className={[styles.repeatBtn, settings.repeatCount === n ? styles.active : '']
                  .filter(Boolean).join(' ')}
                onClick={() => handleChange('repeatCount', n)}
                aria-pressed={settings.repeatCount === n}
              >
                {n}×
              </button>
            ))}
          </div>
        </SettingField>

        {/* Pause Duration */}
        <SettingField>
          <label className={styles.label} htmlFor="pause-select">
            ⏸ Pause After Each Sentence
          </label>
          <select
            id="pause-select"
            className={styles.select}
            value={settings.pauseDuration}
            onChange={(e) => handleChange('pauseDuration', Number(e.target.value))}
          >
            {PAUSE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </SettingField>

        {/* Auto-advance toggle */}
        <SettingField>
          <label className={styles.toggleLabel}>
            <div className={styles.toggleInfo}>
              <span className={styles.label}>🚀 Auto-advance to next sentence</span>
              <span className={styles.hint}>Moves on automatically after the pause ends</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoAdvance}
              className={[styles.toggle, settings.autoAdvance ? styles.toggleOn : '']
                .filter(Boolean).join(' ')}
              onClick={() => handleChange('autoAdvance', !settings.autoAdvance)}
            >
              <div className={styles.toggleThumb} />
            </button>
          </label>
        </SettingField>
      </div>

      {/* Settings summary preview (full mode only) */}
      {!compact && (
        <div className={styles.preview}>
          <span className={styles.previewIcon}>📋</span>
          <p className={styles.previewText}>
            <strong>
              {genderData?.icon} {genderData?.label} · {accentData?.icon} {accentData?.label}
            </strong>{' '}
            voice at <strong>{settings.speed}×</strong> speed, repeated{' '}
            <strong>{settings.repeatCount}×</strong>, pausing{' '}
            <strong>{settings.pauseDuration}s</strong>.
            {settings.autoAdvance ? ' Auto-advances.' : ''}
          </p>
        </div>
      )}
    </div>
  );
});

export default DictationSettings;
