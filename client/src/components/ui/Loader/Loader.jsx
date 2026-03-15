import styles from './Loader.module.css';
export default function Loader({ size='md', fullPage=false, text='' }) {
  return (
    <div className={[styles.wrapper,fullPage?styles.fullPage:''].filter(Boolean).join(' ')}>
      <div className={[styles.spinner,styles[size]].join(' ')} />
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}
