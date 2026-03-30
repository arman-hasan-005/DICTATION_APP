import { useRef, useState } from "react";
import Button from "../../../../components/ui/Button/Button";
import styles from "./HandwriteMode.module.css";

/**
 * HandwriteMode — upload a handwritten notebook photo for checking.
 * The user writes on real paper, photographs it, uploads it here,
 * and the OCR engine extracts the text for evaluation.
 */
export default function HandwriteMode({
  handwrittenText,
  onTextChange,
  onFinish,
}) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanErr, setScanErr] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanErr("");
    setPreview(URL.createObjectURL(file));
    setScanning(true);
    try {
      if (window.Tesseract) {
        const r = await window.Tesseract.recognize(file, "eng");
        const extracted = r.data.text.trim();
        onTextChange(extracted);
      } else {
        setScanErr(
          "OCR library not loaded. Please type your answer manually below.",
        );
      }
    } catch {
      setScanErr(
        "Could not scan the image. Please type your answer manually below.",
      );
    } finally {
      setScanning(false);
    }
  };

  const canSubmit = handwrittenText.trim().length > 0;

  return (
    <div className={styles.wrapper}>
      {/* Instruction */}
      <div className={styles.instruction}>
        <span className={styles.instructionIcon}>📝</span>
        <p>
          Write your dictation answer on paper, then photograph it and upload
          below. We will scan your handwriting and check it automatically.
        </p>
      </div>

      {/* Upload area */}
      <div
        className={[styles.uploadArea, preview ? styles.hasImage : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Handwriting preview"
              className={styles.preview}
            />
            <span className={styles.changeHint}>Tap to change photo</span>
          </>
        ) : (
          <>
            <span className={styles.uploadIcon}>📷</span>
            <p className={styles.uploadLabel}>
              Tap to take a photo or upload image
            </p>
            <p className={styles.uploadHint}>JPG, PNG supported · Max 15 MB</p>
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

      {/* Scanning indicator */}
      {scanning && (
        <div className={styles.scanningBanner}>
          <span className={styles.spinner} />
          Scanning your handwriting…
        </div>
      )}

      {/* Scan error */}
      {scanErr && <p className={styles.scanErr}>⚠️ {scanErr}</p>}

      {/* Extracted text — shown after scan so user can review/correct */}
      {(handwrittenText || scanErr) && (
        <div className={styles.extractedSection}>
          <label className={styles.extractedLabel}>
            Extracted text
            <span className={styles.editHint}>
              {" "}
              — review and edit before submitting
            </span>
          </label>
          <textarea
            className={styles.extractedTextarea}
            value={handwrittenText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Extracted text will appear here, or type manually…"
            rows={5}
            spellCheck={false}
          />
          <span className={styles.wordCount}>
            {handwrittenText.trim().split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      )}

      {/* Submit */}
      <Button fullWidth size="lg" onClick={onFinish} disabled={!canSubmit}>
        ✅ Submit &amp; Check My Answer
      </Button>

      {!canSubmit && (
        <p className={styles.submitHint}>
          Upload a photo of your handwriting above to continue.
        </p>
      )}
    </div>
  );
}
