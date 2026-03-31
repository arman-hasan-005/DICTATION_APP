import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import PassageSetup from "../components/PassageSetup/PassageSetup";
import { useFetch } from "../../../hooks/useFetch";
import { useUpload } from "../../upload/hooks/useUpload";
import passageService from "../../../services/passageService";
import { ROUTES } from "../../../constants/routes";
import styles from "./SetupPage.module.css";

export default function SetupPage() {
  const navigate = useNavigate();
  const { data, loading } = useFetch(() => passageService.getAll());
  const passages = data?.passages || data || [];
  const [activeTab, setActiveTab] = useState("passages");
  const upload = useUpload();

  const handleStart = ({ passage, isHandwrite }) => {
    navigate(ROUTES.DICTATION, { state: { passage, isHandwrite } });
  };

  const handleUploadStart = (isHandwrite = false) => {
    const passage = upload.finaliseText();
    if (!passage) return;
    navigate(ROUTES.DICTATION, { state: { passage, isHandwrite } });
  };

  const wordCount = upload.editedText.split(/\s+/).filter(Boolean).length;
  const sentenceCount =
    upload.editedText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean).length || (upload.editedText.trim() ? 1 : 0);

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

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={[
            styles.tab,
            activeTab === "passages" ? styles.tabActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setActiveTab("passages")}
        >
          📚 Passages
        </button>
        <button
          className={[
            styles.tab,
            activeTab === "upload" ? styles.tabActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setActiveTab("upload")}
        >
          📄 Upload Content
        </button>
      </div>

      {/* Passages tab */}
      {activeTab === "passages" && (
        <PassageSetup
          passages={passages}
          loading={loading}
          onStart={handleStart}
        />
      )}

      {/* Upload tab — single unified box */}
      {activeTab === "upload" && (
        <div className={styles.uploadBox}>
          {/* ── Top: file drop zone ── */}
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

          {/* ── Processing indicator ── */}
          {upload.isProcessing && (
            <div className={styles.processingBar}>
              <span className={styles.spinner} />
              <span>
                {upload.ocrRunning
                  ? "🔍 Scanning handwriting with OCR…"
                  : "⏳ Extracting text from file…"}
              </span>
            </div>
          )}

          {/* ── Error ── */}
          {upload.error && (
            <div className={styles.errorBanner}>⚠️ {upload.error}</div>
          )}

          {/* ── Extracted text box ── */}
          {(upload.hasResult || upload.isProcessing) && (
            <div className={styles.extractedBox}>
              <div className={styles.extractedHeader}>
                <span className={styles.extractedIcon}>📋</span>
                <div>
                  <p className={styles.extractedTitle}>Extracted Text</p>
                  {upload.result?.fileName && (
                    <p className={styles.extractedFile}>
                      {upload.result.fileName}
                    </p>
                  )}
                </div>
                {upload.hasResult && (
                  <div className={styles.extractedStats}>
                    <span className={styles.statBadge}>{wordCount} words</span>
                    <span className={styles.statBadge}>
                      {sentenceCount} sentences
                    </span>
                  </div>
                )}
              </div>

              {upload.result?.type === "image_manual" && (
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
                    ? "Extracting text…"
                    : "Extracted text will appear here. You can edit it before starting."
                }
                disabled={upload.isProcessing}
                rows={8}
                spellCheck={true}
              />
            </div>
          )}

          {/* ── Start dictation modes ── */}
          {upload.canProceed && (
            <div className={styles.startSection}>
              <p className={styles.startLabel}>Choose how to practice:</p>
              <div className={styles.modeGrid}>
                <button
                  className={styles.modeCard}
                  onClick={() => handleUploadStart(false)}
                  type="button"
                >
                  <span className={styles.modeEmoji}>⌨️</span>
                  <div className={styles.modeText}>
                    <span className={styles.modeTitle}>Type Mode</span>
                    <span className={styles.modeDesc}>
                      Listen and type each sentence
                    </span>
                  </div>
                </button>
                <button
                  className={styles.modeCard}
                  onClick={() => handleUploadStart(true)}
                  type="button"
                >
                  <span className={styles.modeEmoji}>✍️</span>
                  <div className={styles.modeText}>
                    <span className={styles.modeTitle}>Handwrite Mode</span>
                    <span className={styles.modeDesc}>
                      Write on paper, then photograph
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}

/* ── Inline upload zone sub-component ── */
function UploadZone({
  onFilePick,
  acceptAttr,
  file,
  preview,
  isProcessing,
  onReset,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFilePick(dropped);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={[
        styles.dropZone,
        dragging ? styles.dropZoneDragging : "",
        file ? styles.dropZoneHasFile : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      role={!file ? "button" : undefined}
      tabIndex={!file ? 0 : undefined}
      onKeyDown={(e) => !file && e.key === "Enter" && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className={styles.hiddenInput}
        onChange={(e) => {
          if (e.target.files?.[0]) onFilePick(e.target.files[0]);
          e.target.value = "";
        }}
      />

      {!file ? (
        /* Empty state */
        <div className={styles.dropEmpty}>
          <span className={styles.dropIcon}>{dragging ? "📂" : "📁"}</span>
          <p className={styles.dropTitle}>
            {dragging ? "Drop it here!" : "Drop a file or click to browse"}
          </p>
          <p className={styles.dropSub}>PDF, DOCX, TXT, or Image · Max 15 MB</p>
          <div className={styles.formatRow}>
            {[
              ["📄", "PDF"],
              ["📝", "DOCX"],
              ["📃", "TXT"],
              ["🖼️", "Image"],
            ].map(([icon, label]) => (
              <span key={label} className={styles.formatTag}>
                {icon} {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* File picked state */
        <div className={styles.fileInfo}>
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className={styles.filePreviewImg}
            />
          ) : (
            <span className={styles.fileIcon}>
              {file.type === "application/pdf"
                ? "📄"
                : file.type.includes("word")
                  ? "📝"
                  : "📃"}
            </span>
          )}
          <div className={styles.fileMeta}>
            <p className={styles.fileName}>{file.name}</p>
            <p className={styles.fileSize}>
              {formatSize(file.size)} · {isProcessing ? "Extracting…" : "Ready"}
            </p>
          </div>
          {!isProcessing && (
            <button
              className={styles.changeFileBtn}
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              type="button"
            >
              Change file
            </button>
          )}
        </div>
      )}
    </div>
  );
}
