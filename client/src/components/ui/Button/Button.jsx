import styles from './Button.module.css';
export default function Button({ children, variant='primary', size='md', loading=false, fullWidth=false, disabled=false, type='button', onClick, className='', ...props }) {
  const cls = [styles.btn,styles[variant],styles[size],fullWidth?styles.fullWidth:'',loading?styles.loading:'',className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} disabled={disabled||loading} onClick={onClick} {...props}>
      {loading && <span className={styles.spinner} />}
      <span className={loading?styles.hiddenText:''}>{children}</span>
    </button>
  );
}
