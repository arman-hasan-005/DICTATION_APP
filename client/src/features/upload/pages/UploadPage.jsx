import { useNavigate } from 'react-router-dom';
import PageWrapper  from '../../../components/layout/PageWrapper/PageWrapper';
import FileUploader from '../components/FileUploader/FileUploader';
import TextPreview  from '../components/TextPreview/TextPreview';
import Button       from '../../../components/ui/Button/Button';
import Loader       from '../../../components/ui/Loader/Loader';
import { useUpload } from '../hooks/useUpload';
import { ROUTES }   from '../../../constants/routes';
import styles       from './UploadPage.module.css';

export default function UploadPage() {
  const navigate = useNavigate();
  const {
    file, preview, uploading, error, result, editedText, ocrRunning,
    acceptAttr, setEditedText, handleFilePick, extract, finaliseText, reset,
    hasResult, canProceed,
  } = useUpload();

  const handleStartDictation = (isHandwrite = false) => {
    const passage = finaliseText();
    if (!passage) return;
    navigate(ROUTES.DICTATION, { state: { passage, isHandwrite } });
  };

  const editedSentenceCount = editedText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean).length || (editedText.trim() ? 1 : 0);

  const editedWordCount = editedText.split(/\s+/).filter(Boolean).length;

  return (
    <PageWrapper>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(ROUTES.SETUP)} type="button">
          ← Back to Setup
        </button>
        <div>
          <h1 className={styles.title}>Upload Content for Dictation</h1>
          <p className={styles.subtitle}>
            Upload a PDF, Word document, text file, or photo — we&apos;ll extract the text and use it for your dictation session.
          </p>
        </div>
      </div>

      <div className={styles.body}>
        {/* Step 1 — Upload */}
        <section className={styles.step}>
          <div className={styles.stepBadge}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepLabel}>Upload File</span>
          </div>
          <FileUploader
            onFilePick={handleFilePick}
            acceptAttr={acceptAttr}
            file={file}
            error={!hasResult ? error : ''}
          />
        </section>

        {/* Image preview */}
        {preview && (
          <div className={styles.imagePreviewWrap}>
            <img src={preview} alt="Uploaded file preview" className={styles.imagePreview} />
          </div>
        )}

        {/* Step 2 — Extract */}
        {file && !hasResult && (
          <section className={styles.step}>
            <div className={styles.stepBadge}>
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepLabel}>Extract Text</span>
            </div>
            <Button
              fullWidth
              size="lg"
              onClick={extract}
              loading={uploading || ocrRunning}
              disabled={uploading || ocrRunning}
            >
              {uploading ? '⏳ Uploading…' : ocrRunning ? '🔍 Running OCR…' : '✨ Extract Text'}
            </Button>
            {error && <p className={styles.extractError}>⚠️ {error}</p>}
          </section>
        )}

        {/* Loading state */}
        {(uploading || ocrRunning) && (
          <Loader text={ocrRunning ? 'Scanning handwriting with OCR…' : 'Extracting text from file…'} />
        )}

        {/* Step 3 — Review & Edit */}
        {hasResult && !uploading && (
          <section className={styles.step}>
            <div className={styles.stepBadge}>
              <span className={styles.stepNum}>{result?.type === 'image_manual' ? '2' : '3'}</span>
              <span className={styles.stepLabel}>
                {result?.type === 'image_manual' ? 'Type the Text Manually' : 'Review & Edit'}
              </span>
            </div>

            {result?.type === 'image_manual' && (
              <div className={styles.ocrFallback}>
                <p>🖼️ OCR could not automatically read the image. Please type the text below manually or paste it from another source.</p>
              </div>
            )}
            {error && hasResult && <p className={styles.extractError}>⚠️ {error}</p>}

            <TextPreview
              text={editedText}
              wordCount={editedWordCount}
              sentenceCount={editedSentenceCount}
              onTextChange={setEditedText}
              fileName={result?.fileName}
            />
          </section>
        )}

        {/* Step 4 — Start Dictation */}
        {hasResult && canProceed && (
          <section className={styles.step}>
            <div className={styles.stepBadge}>
              <span className={styles.stepNum}>{result?.type === 'image_manual' ? '3' : '4'}</span>
              <span className={styles.stepLabel}>Start Dictation</span>
            </div>
            <div className={styles.startModes}>
              <button
                className={styles.modeCard}
                onClick={() => handleStartDictation(false)}
                type="button"
              >
                <span className={styles.modeCardIcon}>⌨️</span>
                <div>
                  <p className={styles.modeCardTitle}>Type Mode</p>
                  <p className={styles.modeCardDesc}>Listen and type each sentence</p>
                </div>
              </button>
              <button
                className={styles.modeCard}
                onClick={() => handleStartDictation(true)}
                type="button"
              >
                <span className={styles.modeCardIcon}>✍️</span>
                <div>
                  <p className={styles.modeCardTitle}>Handwrite Mode</p>
                  <p className={styles.modeCardDesc}>Write on paper, then photograph</p>
                </div>
              </button>
            </div>
            <button className={styles.resetLink} onClick={reset} type="button">
              🔄 Upload a different file
            </button>
          </section>
        )}
      </div>
    </PageWrapper>
  );
}
