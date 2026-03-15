import Navbar from '../Navbar/Navbar';
import styles from './PageWrapper.module.css';
export default function PageWrapper({ children, maxWidth = '' }) {
  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.body}>
        <main className={styles.main} style={maxWidth ? { maxWidth } : undefined}>
          {children}
        </main>
      </div>
    </div>
  );
}
