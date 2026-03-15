import styles from './Input.module.css';
export default function Input({ label, error, hint, id, leftIcon, rightIcon, className='', ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g,'-');
  return (
    <div className={[styles.wrapper,className].join(' ')}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <div className={styles.inputRow}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input id={inputId} className={[styles.input,error?styles.inputError:'',leftIcon?styles.hasLeft:'',rightIcon?styles.hasRight:''].filter(Boolean).join(' ')} {...props} />
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>
      {error && <span className={styles.errorMsg}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
