import styles from './TextPreview.module.css';

export default function TextPreview({ text, wordCount, sentenceCount, onTextChange, fileName }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>📋</span>
          <div>
            <h3 className={styles.title}>Extracted Text</h3>
            <p className={styles.source}>{fileName || 'Uploaded file'}</p>
          </div>
        </div>
        <div className={styles.stats}>
          <span className={styles.stat}><strong>{wordCount}</strong> words</span>
          <span className={styles.statDot}>·</span>
          <span className={styles.stat}><strong>{sentenceCount}</strong> sentences</span>
        </div>
      </div>

      <p className={styles.editNote}>
        ✏️ Review and edit the extracted text before starting dictation.
      </p>

      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={10}
        placeholder="Extracted text will appear here…"
        spellCheck={true}
      />

      <div className={styles.charCount}>{text.length} characters</div>
    </div>
  );
}
