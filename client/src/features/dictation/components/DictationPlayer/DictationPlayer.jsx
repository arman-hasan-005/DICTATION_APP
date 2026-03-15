import ProgressBar from '../../../../components/ui/ProgressBar/ProgressBar';
import styles from './DictationPlayer.module.css';

export default function DictationPlayer({ currentIndex, totalCount, progress, playing, audioLoading, audioError, canReplay, onPlay, onPause, onReplay, isHandwrite }) {
  return (
    <div className={styles.player}>
      <div className={styles.progressSection}>
        <ProgressBar value={progress} showValue label={isHandwrite ? 'Full Passage' : `Sentence ${currentIndex + 1} of ${totalCount}`} />
      </div>
      <div className={styles.controls}>
        <button className={[styles.playBtn, playing?styles.playing:''].filter(Boolean).join(' ')} onClick={playing?onPause:onPlay} disabled={audioLoading}>
          {audioLoading ? '⏳' : playing ? '⏸' : '▶'}
        </button>
        {canReplay && <button className={styles.replayBtn} onClick={onReplay}>🔁 Replay</button>}
        <p className={styles.hint}>{audioLoading?'Generating audio…':playing?'Listening…':'Press play to hear the passage'}</p>
      </div>
      {audioError && <p className={styles.audioError}>⚠️ {audioError}</p>}
    </div>
  );
}
