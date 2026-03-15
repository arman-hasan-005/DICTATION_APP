import { useRef, useState } from 'react';
import styles from './FileUploader.module.css';

const FILE_TYPES = [
  { ext: 'PDF',  icon: '📄', color: '#DC2626' },
  { ext: 'DOCX', icon: '📝', color: '#2563EB' },
  { ext: 'TXT',  icon: '📃', color: '#059669' },
  { ext: 'Image',icon: '🖼️', color: '#7C3AED' },
];

export default function FileUploader({ onFilePick, acceptAttr, file, error }) {
  const inputRef   = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFilePick(dropped);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={[styles.dropzone, dragging ? styles.dragging : '', file ? styles.hasFile : ''].filter(Boolean).join(' ')}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          className={styles.hidden}
          onChange={(e) => { if (e.target.files?.[0]) onFilePick(e.target.files[0]); e.target.value = ''; }}
        />

        {file ? (
          <div className={styles.fileInfo}>
            <span className={styles.fileIcon}>
              {file.type.startsWith('image/') ? '🖼️' :
               file.type === 'application/pdf' ? '📄' :
               file.type.includes('word') ? '📝' : '📃'}
            </span>
            <div>
              <p className={styles.fileName}>{file.name}</p>
              <p className={styles.fileMeta}>{formatSize(file.size)}</p>
            </div>
            <span className={styles.changeHint}>Click to change</span>
          </div>
        ) : (
          <>
            <div className={styles.uploadIcon}>{dragging ? '📂' : '📁'}</div>
            <p className={styles.dropTitle}>{dragging ? 'Drop it here!' : 'Drop your file or click to browse'}</p>
            <p className={styles.dropSub}>Max file size: 15 MB</p>
          </>
        )}
      </div>

      {error && <p className={styles.error}>⚠️ {error}</p>}

      <div className={styles.supportedTypes}>
        <p className={styles.supportedLabel}>Supported formats:</p>
        <div className={styles.typeList}>
          {FILE_TYPES.map((t) => (
            <span key={t.ext} className={styles.typeBadge} style={{ color: t.color, background: `${t.color}18` }}>
              {t.icon} {t.ext}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
