/**
 * UploadZone
 *
 * Extracted from SetupPage where it was defined as an inline function
 * component (~80 lines of JSX nested inside the page).
 *
 * WHY EXTRACTED:
 *   Inline function components re-create on every parent render and can't
 *   be memoized. Moving it to its own file:
 *     1. Allows React.memo to prevent unnecessary re-renders.
 *     2. Makes it reusable (also used on the dedicated /upload page).
 *     3. Keeps SetupPage lean and readable.
 *
 * PROPS:
 *   onFilePick    fn(File)   — called when a file is selected
 *   acceptAttr    string     — file input `accept` attribute
 *   file          File|null  — currently selected file
 *   preview       string|null — object URL for image preview
 *   isProcessing  boolean
 *   onReset       fn()       — clear the current file
 */

import { memo, useRef, useState } from 'react';
import styles from './UploadZone.module.css';

const FORMAT_TAGS = [
  ['📄', 'PDF'],
  ['📝', 'DOCX'],
  ['📃', 'TXT'],
  ['🖼️', 'Image'],
];

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type) {
  if (type === 'application/pdf') return '📄';
  if (type?.includes('word')) return '📝';
  return '📃';
}

const UploadZone = memo(function UploadZone({
  onFilePick,
  acceptAttr,
  file,
  preview,
  isProcessing,
  onReset,
}) {
  const inputRef          = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFilePick(dropped);
  };

  const handleKeyDown = (e) => {
    if (!file && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      className={[
        styles.zone,
        dragging    ? styles.zoneDragging : '',
        file        ? styles.zoneHasFile  : '',
      ].filter(Boolean).join(' ')}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      role={!file ? 'button' : undefined}
      tabIndex={!file ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={!file ? 'Upload a file' : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className={styles.hiddenInput}
        onChange={(e) => {
          if (e.target.files?.[0]) onFilePick(e.target.files[0]);
          e.target.value = '';          // allow re-picking same file
        }}
      />

      {!file ? (
        <div className={styles.emptyState}>
          <span className={styles.icon}>{dragging ? '📂' : '📁'}</span>
          <p className={styles.title}>
            {dragging ? 'Drop it here!' : 'Drop a file or click to browse'}
          </p>
          <p className={styles.sub}>PDF, DOCX, TXT, or Image · Max 15 MB</p>
          <div className={styles.formatRow}>
            {FORMAT_TAGS.map(([icon, label]) => (
              <span key={label} className={styles.formatTag}>
                {icon} {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.fileState}>
          {preview ? (
            <img src={preview} alt="Preview" className={styles.previewImg} />
          ) : (
            <span className={styles.fileIcon}>{fileIcon(file.type)}</span>
          )}
          <div className={styles.fileMeta}>
            <p className={styles.fileName}>{file.name}</p>
            <p className={styles.fileSize}>
              {formatBytes(file.size)} · {isProcessing ? 'Extracting…' : 'Ready'}
            </p>
          </div>
          {!isProcessing && (
            <button
              className={styles.changeBtn}
              onClick={(e) => { e.stopPropagation(); onReset(); }}
              type="button"
              aria-label="Change file"
            >
              Change file
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default UploadZone;
