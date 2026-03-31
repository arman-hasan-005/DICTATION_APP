/**
 * HandwriteMode — upload handwritten notebook photos and check answers
 *
 * OCR PIPELINE
 * ═══════════════════════════════════════════════════════════════
 *
 *  For each uploaded image:
 *
 *  1. POST /api/upload/ocr-handwriting
 *     Server runs Google Vision + Tesseract concurrently.
 *     Results are merged with per-word confidence voting.
 *     Returns { text, confidence, source, fallbackUsed }.
 *
 *  2. If server responds with requiresClientOCR: true
 *     (both server engines failed — Vision quota/error AND Tesseract crash)
 *     → run window.Tesseract.recognize() in the browser on the base64 image.
 *
 *  3. If the POST /api/upload/ocr-handwriting request itself fails
 *     (network down, server 500, timeout)
 *     → run window.Tesseract.recognize() directly on the original File object.
 *
 *  The user sees the same UI regardless of path.
 *  A small badge shows which engine(s) ran and the confidence score.
 */

import { useRef, useState, useCallback } from 'react';
import Button        from '../../../../components/ui/Button/Button';
import uploadService from '../../../../services/uploadService';
import styles        from './HandwriteMode.module.css';

// ── Client-side Tesseract (last-resort fallback only) ─────────────────────────
const TESS_CONFIG = {
  tessedit_pageseg_mode:    '6',  // PSM 6: uniform block
  tessedit_ocr_engine_mode: '1',  // OEM 1: LSTM only
};

async function runClientTesseract(source, onProgress) {
  if (!window.Tesseract) {
    throw new Error('OCR library not loaded — please type your answer manually.');
  }
  return new Promise((resolve, reject) => {
    window.Tesseract.recognize(source, 'eng', {
      ...TESS_CONFIG,
      logger: (m) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          onProgress(Math.round(m.progress * 100));
        }
      },
    })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
}

// ── Source badge labels ────────────────────────────────────────────────────────
const SOURCE_LABELS = {
  'vision+tesseract': '🔬 Vision + Tesseract',
  'google_vision':    '☁️  Google Vision',
  'tesseract':        '🖥️  Tesseract (server)',
  'tesseract_client': '💻 Tesseract (device)',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function HandwriteMode({ handwrittenText, onTextChange, onFinish }) {
  const fileRef = useRef(null);

  const [previews,  setPreviews]  = useState([]);
  const [scanning,  setScanning]  = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [scanErr,   setScanErr]   = useState('');
  const [ocrMeta,   setOcrMeta]   = useState(null); // { confidence, source, fallbackUsed }
  const [pageCount, setPageCount] = useState(0);

  // ── Per-file OCR: server hybrid → client fallback ─────────────────────────
  const recogniseFile = useCallback(async (file, pageIdx, totalPages) => {
    const baseProgress  = (pageIdx / totalPages) * 100;
    const pageShare     = 100 / totalPages;
    const updateProgress = (pct) =>
      setProgress(Math.round(baseProgress + (pct / 100) * pageShare));

    // Step 1 — server hybrid (Vision + Tesseract)
    setStatusMsg(
      totalPages > 1
        ? `Page ${pageIdx + 1} of ${totalPages}: analysing on server…`
        : 'Analysing handwriting…'
    );

    let serverData = null;
    try {
      const res = await uploadService.ocrHandwriting(file);
      serverData = res.data;
      updateProgress(60);
    } catch (err) {
      // Network error, 500, timeout — fall through to client Tesseract
      console.warn('[HandwriteMode] Server OCR request failed, using client fallback:', err.message);
    }

    // Step 2a — server succeeded with extracted text
    if (serverData && !serverData.requiresClientOCR) {
      updateProgress(100);
      return {
        text:         serverData.text ?? '',
        confidence:   serverData.confidence ?? null,
        source:       serverData.source ?? 'server',
        fallbackUsed: serverData.fallbackUsed ?? false,
      };
    }

    // Step 2b — server needs client OCR (both engines failed) or network error
    setStatusMsg(
      totalPages > 1
        ? `Page ${pageIdx + 1} of ${totalPages}: scanning on device…`
        : 'Scanning on device…'
    );

    // Prefer the base64 the server returned (already uploaded), else use the raw File
    const tessSource = serverData?.requiresClientOCR && serverData.imageBase64
      ? `data:${serverData.mimeType};base64,${serverData.imageBase64}`
      : file;

    try {
      const tessData = await runClientTesseract(tessSource, (pct) =>
        updateProgress(60 + pct * 0.4)
      );
      return {
        text:         tessData.text?.trim() ?? '',
        confidence:   Math.round(tessData.confidence ?? 0),
        source:       'tesseract_client',
        fallbackUsed: true,
      };
    } catch {
      throw new Error(
        'Could not extract text from this image. ' +
        'Please ensure it is clear and well-lit, or type your answer below.'
      );
    }
  }, []);

  // ── Handle file selection ─────────────────────────────────────────────────
  const handleFiles = useCallback(async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setScanErr('');
    setProgress(0);
    setStatusMsg('');
    setOcrMeta(null);
    setPreviews(files.map(f => URL.createObjectURL(f)));
    setPageCount(files.length);
    setScanning(true);

    try {
      const pageResults = [];
      for (let i = 0; i < files.length; i++) {
        pageResults.push(await recogniseFile(files[i], i, files.length));
      }

      const fullText = pageResults.map(r => r.text).filter(Boolean).join('\n\n').trim();

      if (!fullText) {
        throw new Error(
          'No text detected in the uploaded image(s). ' +
          'Please ensure photos are clear, well-lit, and in focus.'
        );
      }

      // Aggregate metadata across pages
      const confVals   = pageResults.map(r => r.confidence).filter(c => c !== null);
      const avgConf    = confVals.length
        ? Math.round(confVals.reduce((a, b) => a + b, 0) / confVals.length)
        : null;
      const anyFallback = pageResults.some(r => r.fallbackUsed);
      const sources     = [...new Set(pageResults.map(r => r.source))];
      const source      = sources.length === 1 ? sources[0] : 'vision+tesseract';

      setOcrMeta({ confidence: avgConf, source, fallbackUsed: anyFallback });
      onTextChange(fullText);
      setProgress(100);
      setStatusMsg('');
    } catch (err) {
      setScanErr(err.message ?? 'Scan failed. Please try again or type your answer.');
    } finally {
      setScanning(false);
      e.target.value = ''; // allow re-selecting the same file
    }
  }, [recogniseFile, onTextChange]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const canSubmit = handwrittenText.trim().length > 0;

  // Confidence badge
  const ConfidenceBadge = ocrMeta ? (() => {
    const { confidence, source, fallbackUsed } = ocrMeta;
    const level  = confidence === null ? 'Med'
      : confidence >= 75 ? 'High'
      : confidence >= 50 ? 'Med' : 'Low';
    const icon   = level === 'High' ? '✅' : level === 'Med' ? '⚠️' : '❌';
    const label  = SOURCE_LABELS[source] ?? source;
    return (
      <div className={styles.ocrMetaRow}>
        <span className={`${styles.confidenceBadge} ${styles[`conf${level}`]}`}>
          {icon}
          {confidence !== null && <>&nbsp;{confidence}% confidence</>}
          &nbsp;·&nbsp;{label}
          {fallbackUsed && <span className={styles.fallbackTag}>&nbsp;(fallback)</span>}
        </span>
        {confidence !== null && confidence < 60 && (
          <span className={styles.lowConfWarn}>
            Low confidence — please review the text carefully before submitting.
          </span>
        )}
      </div>
    );
  })() : null;

  return (
    <div className={styles.wrapper}>

      {/* Instructions */}
      <div className={styles.instruction}>
        <span className={styles.instructionIcon}>📝</span>
        <div>
          <p>Write your dictation on paper, photograph it, then upload below.</p>
          <p className={styles.tipText}>
            💡 Best results: good lighting, flat paper, no shadows, camera directly above.
          </p>
        </div>
      </div>

      {/* Upload area */}
      <div
        className={[styles.uploadArea, previews.length ? styles.hasImage : '']
          .filter(Boolean).join(' ')}
        onClick={() => !scanning && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !scanning && fileRef.current?.click()}
        aria-label="Upload handwriting photo"
      >
        {previews.length ? (
          <div className={styles.previewGrid}>
            {previews.map((src, i) => (
              <img key={i} src={src} alt={`Page ${i + 1}`} className={styles.preview} />
            ))}
            {!scanning && (
              <span className={styles.changeHint}>
                Tap to change photo{pageCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : (
          <>
            <span className={styles.uploadIcon}>📷</span>
            <p className={styles.uploadLabel}>Tap to take a photo or upload image</p>
            <p className={styles.uploadHint}>JPG · PNG · Max 15 MB · Multiple pages supported</p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFiles}
        className={styles.hidden}
      />

      {/* Progress */}
      {scanning && (
        <div className={styles.scanningBanner}>
          <span className={styles.spinner} />
          <div className={styles.progressWrap}>
            <span>
              {statusMsg || `Scanning${pageCount > 1 ? ` (${pageCount} pages)` : ''}… ${progress}%`}
            </span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Error + retry */}
      {scanErr && (
        <div className={styles.scanErrBox}>
          <p className={styles.scanErr}>⚠️ {scanErr}</p>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => fileRef.current?.click()}
          >
            🔄 Try again with a different photo
          </button>
        </div>
      )}

      {/* Extracted text */}
      {(handwrittenText || scanErr) && (
        <div className={styles.extractedSection}>
          <div className={styles.extractedHeader}>
            <label className={styles.extractedLabel}>
              Extracted text
              <span className={styles.editHint}> — review and edit before submitting</span>
            </label>
          </div>

          {ConfidenceBadge}

          <textarea
            className={styles.extractedTextarea}
            value={handwrittenText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Extracted text will appear here, or type manually…"
            rows={6}
            spellCheck={false}
          />
          <span className={styles.wordCount}>
            {handwrittenText.trim().split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      )}

      {/* Submit */}
      <Button fullWidth size="lg" onClick={onFinish} disabled={!canSubmit || scanning}>
        ✅ Submit &amp; Check My Answer
      </Button>

      {!canSubmit && !scanning && (
        <p className={styles.submitHint}>
          Upload a photo of your handwriting above to continue.
        </p>
      )}
    </div>
  );
}
