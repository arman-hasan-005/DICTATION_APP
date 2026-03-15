import { useRef, useState } from 'react';
import Button from '../../../../components/ui/Button/Button';
import styles from './HandwriteMode.module.css';

const NOTEBOOK_TABS = [
  { id: 'notebook', icon: '📓', label: 'Notebook' },
  { id: 'photo',    icon: '📷', label: 'Submit Photo' },
];

export default function HandwriteMode({ handwrittenText, onTextChange, onFinish }) {
  const fileRef = useRef(null);
  const [activeTab, setActiveTab] = useState('notebook');
  const [preview,   setPreview]   = useState(null);
  const [scanning,  setScanning]  = useState(false);
  const [scanErr,   setScanErr]   = useState('');
  const [photoText, setPhotoText] = useState('');

  // --- Photo / OCR tab ---
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanErr('');
    setPreview(URL.createObjectURL(file));
    setScanning(true);
    try {
      if (window.Tesseract) {
        const r = await window.Tesseract.recognize(file, 'eng');
        const extracted = r.data.text.trim();
        setPhotoText(extracted);
        onTextChange(extracted);
      } else {
        setScanErr('OCR library not loaded. Type your text manually in the Notebook tab.');
      }
    } catch {
      setScanErr('Could not scan image. Please type manually in the Notebook tab.');
    } finally {
      setScanning(false);
    }
  };

  const handlePhotoTextEdit = (val) => {
    setPhotoText(val);
    onTextChange(val);
  };

  const canSubmit = handwrittenText.trim().length > 0;

  return (
    <div className={styles.wrapper}>
      {/* Tabs */}
      <div className={styles.tabs}>
        {NOTEBOOK_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={[styles.tab, activeTab === t.id ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Notebook writing area ── */}
      {activeTab === 'notebook' && (
        <div className={styles.notebookPanel}>
          <p className={styles.instruction}>
            🖊️ Listen to the dictation, then write your answer below. The lines help simulate a real notebook.
          </p>
          <div className={styles.notebookOuter}>
            <div className={styles.notebookMargin} />
            <div className={styles.notebookLines}>
              {/* Lined paper effect via CSS — textarea sits on top */}
              <textarea
                className={styles.notebookTextarea}
                value={handwrittenText}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Write your dictation answer here…"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          </div>
          <div className={styles.notebookMeta}>
            <span>{handwrittenText.split(/\s+/).filter(Boolean).length} words written</span>
          </div>
        </div>
      )}

      {/* ── Photo submission tab ── */}
      {activeTab === 'photo' && (
        <div className={styles.photoPanel}>
          <p className={styles.instruction}>
            📸 Write on real paper, then take a photo or upload it. We&apos;ll scan it automatically.
          </p>

          <div
            className={[styles.uploadArea, preview ? styles.uploadAreaHasImage : ''].filter(Boolean).join(' ')}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Handwriting preview" className={styles.preview} />
            ) : (
              <>
                <span className={styles.uploadIcon}>📷</span>
                <p className={styles.uploadLabel}>Tap to take photo or upload image</p>
                <p className={styles.uploadHint}>JPG, PNG supported</p>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className={styles.hidden}
          />

          {scanning && (
            <div className={styles.scanningBanner}>
              <span className={styles.scanSpinner} />
              Scanning your handwriting…
            </div>
          )}

          {scanErr && <p className={styles.scanErr}>⚠️ {scanErr}</p>}

          {(photoText || scanErr) && (
            <div className={styles.extractedSection}>
              <label className={styles.extractedLabel}>
                Extracted text <span className={styles.editHint}>(review &amp; edit before submitting)</span>
              </label>
              <textarea
                className={styles.extractedTextarea}
                value={photoText}
                onChange={(e) => handlePhotoTextEdit(e.target.value)}
                placeholder="Extracted text will appear here, or type manually…"
                rows={6}
                spellCheck={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Submit button — always visible */}
      <Button
        fullWidth
        size="lg"
        onClick={onFinish}
        disabled={!canSubmit}
      >
        ✅ Submit &amp; Check My Answer
      </Button>

      {!canSubmit && (
        <p className={styles.submitHint}>
          {activeTab === 'notebook'
            ? 'Write your answer in the notebook above, then submit.'
            : 'Scan or type your answer, then submit.'}
        </p>
      )}
    </div>
  );
}
