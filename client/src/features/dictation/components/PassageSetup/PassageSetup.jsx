import { useState } from 'react';
import Button from '../../../../components/ui/Button/Button';
import Loader from '../../../../components/ui/Loader/Loader';
import { LEVEL_LIST, getLevelConfig } from '../../../../constants/levels';
import styles from './PassageSetup.module.css';

export default function PassageSetup({ passages, loading, onStart }) {
  const [selectedLevel,   setSelectedLevel]   = useState('all');
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [isHandwrite,     setIsHandwrite]     = useState(false);

  const filtered = selectedLevel === 'all' ? passages : passages?.filter(p => p.level === selectedLevel);

  if (loading) return <Loader text="Loading passages…" />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Choose Level</h3>
        <div className={styles.levelTabs}>
          <button className={[styles.tab, selectedLevel==='all'?styles.tabActive:''].filter(Boolean).join(' ')} onClick={() => setSelectedLevel('all')}>All</button>
          {LEVEL_LIST.map(lvl => { const cfg = getLevelConfig(lvl); return (
            <button key={lvl} className={[styles.tab, selectedLevel===lvl?styles.tabActive:''].filter(Boolean).join(' ')}
              style={selectedLevel===lvl?{borderColor:cfg.color,color:cfg.color,background:cfg.bgColor}:{}} onClick={() => setSelectedLevel(lvl)}>
              {cfg.emoji} {cfg.label}
            </button>
          );})}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Select a Passage</h3>
        {filtered?.length === 0
          ? <p className={styles.empty}>No passages found for this level.</p>
          : <div className={styles.passageGrid}>
              {filtered?.map(p => { const cfg = getLevelConfig(p.level); return (
                <div key={p._id} className={[styles.passageCard, selectedPassage?._id===p._id?styles.passageSelected:''].filter(Boolean).join(' ')} onClick={() => setSelectedPassage(p)}>
                  <div className={styles.passageTop}>
                    <span className={styles.levelBadge} style={{background:cfg.bgColor,color:cfg.color}}>{cfg.emoji} {cfg.label}</span>
                    <span className={styles.wordCount}>{p.wordCount || '?'} words</span>
                  </div>
                  <h4 className={styles.passageTitle}>{p.title}</h4>
                  <p className={styles.passagePreview}>{p.sentences?.[0] || p.text?.slice(0,80)}…</p>
                </div>
              );})}
            </div>
        }
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Practice Mode</h3>
        <div className={styles.modeGrid}>
          <button className={[styles.modeCard, !isHandwrite?styles.modeSelected:''].filter(Boolean).join(' ')} onClick={() => setIsHandwrite(false)}>
            <span className={styles.modeIcon}>⌨️</span>
            <span className={styles.modeLabel}>Type Mode</span>
            <span className={styles.modeDesc}>Type each sentence after hearing it</span>
          </button>
          <button className={[styles.modeCard, isHandwrite?styles.modeSelected:''].filter(Boolean).join(' ')} onClick={() => setIsHandwrite(true)}>
            <span className={styles.modeIcon}>✍️</span>
            <span className={styles.modeLabel}>Handwrite Mode</span>
            <span className={styles.modeDesc}>Write the full passage by hand</span>
          </button>
        </div>
      </div>

      <Button fullWidth size="lg" disabled={!selectedPassage} onClick={() => onStart({ passage: selectedPassage, isHandwrite })}>
        🎧 Start Dictation
      </Button>
    </div>
  );
}
