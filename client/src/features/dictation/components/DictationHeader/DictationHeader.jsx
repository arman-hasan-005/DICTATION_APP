/**
 * DictationHeader
 *
 * Extracted from DictationPage. Renders the top bar:
 *   - Passage title + mode/level/voice meta line
 *   - Settings toggle button
 *   - Exit button
 *
 * WHY EXTRACTED:
 *   DictationPage was ~250 lines. The header is purely presentational
 *   (zero state, zero effects) — a textbook case for a pure component.
 *   React.memo prevents re-renders when only the player state changes.
 */

import { memo } from 'react';
import styles from './DictationHeader.module.css';

const DictationHeader = memo(function DictationHeader({
  title,
  level,
  isHandwrite,
  isUploaded,
  voiceLabel,
  showSettings,
  onToggleSettings,
  onExit,
}) {
  return (
    <div className={styles.header}>
      <div className={styles.info}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.meta}>
          {isHandwrite ? '✍️ Handwrite Mode' : '⌨️ Type Mode'}
          &nbsp;·&nbsp;
          <span className={styles.level}>{level}</span>
          &nbsp;·&nbsp;
          <span className={styles.voicePill}>{voiceLabel}</span>
          {isUploaded && <span className={styles.uploadedPill}>📄 Uploaded</span>}
        </p>
      </div>

      <div className={styles.actions}>
        <button
          className={[
            styles.settingsBtn,
            showSettings ? styles.settingsBtnActive : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={onToggleSettings}
          type="button"
          aria-pressed={showSettings}
          aria-label="Toggle settings"
        >
          ⚙️ Settings
        </button>

        <button
          className={styles.exitBtn}
          onClick={onExit}
          type="button"
          aria-label="Exit dictation"
        >
          ✕ Exit
        </button>
      </div>
    </div>
  );
});

export default DictationHeader;
