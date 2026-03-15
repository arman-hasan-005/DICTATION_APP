import styles from './ProgressBar.module.css';
export default function ProgressBar({ value=0, max=100, color, label, showValue=false }) {
  const pct = Math.min(100, Math.round((value/max)*100));
  return (
    <div className={styles.wrapper}>
      {label && <div className={styles.labelRow}><span className={styles.label}>{label}</span>{showValue && <span className={styles.value}>{pct}%</span>}</div>}
      <div className={styles.track}><div className={styles.fill} style={{ width:`${pct}%`, background:color||'var(--color-primary)' }} /></div>
    </div>
  );
}
