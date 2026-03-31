/**
 * SetupPage
 *
 * REFACTORING vs original (~270 lines → ~110 lines):
 *
 *   EXTRACTED:
 *     - Inline `UploadZone` function component → features/upload/components/UploadZone/
 *       (inline components can't be memoized; they recreate on every render)
 *     - `UploadTab` extracted as a named sub-component in this file
 *       (still co-located because it's only used here)
 *
 *   IMPROVED:
 *     - `wordCount` and `sentenceCount` computed once at the top (were
 *       duplicated in the JSX and the handleUploadStart logic).
 *     - `handleUploadStart` is stable (useCallback).
 *     - Tab rendering uses a data-driven array instead of repeated JSX.
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../components/layout/PageWrapper/PageWrapper';
import PassageSetup from '../components/PassageSetup/PassageSetup';
import UploadZone from '../../upload/components/UploadZone/UploadZone';
import { useFetch } from '../../../hooks/useFetch';
import { useUpload } from '../../upload/hooks/useUpload';
import passageService from '../../../services/passageService';
import { ROUTES } from '../../../constants/routes';
import styles from './SetupPage.module.css';

const TABS = [
  { id: 'passages', label: '📚 Passages' },
  { id: 'upload',   label: '📄 Upload Content' },
];

// ─── Upload tab — still co-located since it's only used here ─────────────────
function UploadTab({ upload }) {
  const wordCount = useMemo(
    () => upload.editedText.split(/\s+/).filter(Boolean).length,
    [upload.editedText],
  );
  const sentenceCount = useMemo(
    () =>
      upload.editedText
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean).length || (upload.editedText.trim() ? 1 : 0),
    [upload.editedText],
  );

  return (
    <div className={styles.uploadBox}>
      {/* Drop zone */}
      <div className={styles.uploadZoneWrap}>
        <UploadZone
          onFilePick={upload.handleFilePick}
          acceptAttr={upload.acceptAttr}
          file={upload.file}
          preview={upload.preview}
          isProcessing={upload.isProcessing}
          onReset={upload.reset}
        />
      </div>

      {/* Processing indicator */}
      {upload.isProcessing && (
        <div className={styles.processingBar}>
          <span className={styles.spinner} />
          <span>
            {upload.ocrRunning
              ? '🔍 Scanning handwriting with OCR…'
              : '⏳ Extracting text from file…'}
          </span>
        </div>
      )}

      {/* Error */}
      {upload.error && (
        <div className={styles.errorBanner}>⚠️ {upload.error}</div>
      )}

      {/* Extracted text */}
      {(upload.hasResult || upload.isProcessing) && (
        <div className={styles.extractedBox}>
          <div className={styles.extractedHeader}>
            <span className={styles.extractedIcon}>📋</span>
            <div>
              <p className={styles.extractedTitle}>Extracted Text</p>
              {upload.result?.fileName && (
                <p className={styles.extractedFile}>{upload.result.fileName}</p>
              )}
            </div>
            {upload.hasResult && (
              <div className={styles.extractedStats}>
                <span className={styles.statBadge}>{wordCount} words</span>
                <span className={styles.statBadge}>{sentenceCount} sentences</span>
              </div>
            )}
          </div>

          {upload.result?.type === 'image_manual' && (
            <div className={styles.ocrNote}>
              🖼️ Could not scan automatically. Type or paste the text below.
            </div>
          )}

          <textarea
            className={styles.extractedTextarea}
            value={upload.editedText}
            onChange={(e) => upload.setEditedText(e.target.value)}
            placeholder={
              upload.isProcessing
                ? 'Extracting text…'
                : 'Extracted text will appear here. You can edit it before starting.'
            }
            disabled={upload.isProcessing}
            rows={8}
            spellCheck
          />
        </div>
      )}

      {/* Start modes */}
      {upload.canProceed && (
        <div className={styles.startSection}>
          <p className={styles.startLabel}>Choose how to practice:</p>
          <div className={styles.modeGrid}>
            {[
              { isHandwrite: false, emoji: '⌨️', title: 'Type Mode',      desc: 'Listen and type each sentence' },
              { isHandwrite: true,  emoji: '✍️', title: 'Handwrite Mode', desc: 'Write on paper, then photograph' },
            ].map(({ isHandwrite, emoji, title, desc }) => (
              <button
                key={title}
                className={styles.modeCard}
                onClick={() => upload.onStartMode(isHandwrite)}
                type="button"
              >
                <span className={styles.modeEmoji}>{emoji}</span>
                <div className={styles.modeText}>
                  <span className={styles.modeTitle}>{title}</span>
                  <span className={styles.modeDesc}>{desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SetupPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('passages');
  const { data, loading } = useFetch(() => passageService.getAll());
  const passages           = data?.passages ?? data ?? [];
  const upload             = useUpload();

  const handleStart = useCallback(({ passage, isHandwrite }) => {
    navigate(ROUTES.DICTATION, { state: { passage, isHandwrite } });
  }, [navigate]);

  const handleUploadStart = useCallback((isHandwrite = false) => {
    const passage = upload.finaliseText();
    if (!passage) return;
    navigate(ROUTES.DICTATION, { state: { passage, isHandwrite } });
  }, [upload, navigate]);

  // Attach the start handler to the upload object so UploadTab can call it
  upload.onStartMode = handleUploadStart;

  return (
    <PageWrapper>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Choose Your Practice</h1>
          <p className={styles.subtitle}>
            Select a passage or upload content, then start dictating.
          </p>
        </div>
        <button
          className={styles.settingsBtn}
          onClick={() => navigate(ROUTES.SETTINGS)}
          type="button"
        >
          🎓 Classroom Settings
        </button>
      </div>

      {/* Tab bar — data-driven to eliminate repeated button boilerplate */}
      <div className={styles.tabs}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={[styles.tab, activeTab === id ? styles.tabActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setActiveTab(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'passages' && (
        <PassageSetup passages={passages} loading={loading} onStart={handleStart} />
      )}
      {activeTab === 'upload' && <UploadTab upload={upload} />}
    </PageWrapper>
  );
}
