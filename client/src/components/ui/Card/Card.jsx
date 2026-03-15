import styles from './Card.module.css';
export default function Card({ children, className='', onClick, hoverable=false, padding='md' }) {
  return <div className={[styles.card,hoverable?styles.hoverable:'',styles[`pad${padding}`],className].filter(Boolean).join(' ')} onClick={onClick}>{children}</div>;
}
