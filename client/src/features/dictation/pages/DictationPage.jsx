/**
 * DictationPage
 *
 * REFACTORING SUMMARY vs original (~250 lines → ~120 lines):
 *
 *   EXTRACTED to dedicated files:
 *     - Audio resolution logic  → usePassageAudio hook
 *     - Top header bar          → DictationHeader component
 *     - Completion review panel → ReviewPanel component
 *
 *   BUG FIXED:
 *     - ReviewPanel answer edits now use `updateAnswer(index, value)` so
 *       changes made during review are actually persisted before submission.
 *
 *   PERFORMANCE:
 *     - DictationHeader is React.memo'd — pure presentational, stable props
 *     - ReviewPanel is React.memo'd — only re-renders when answers change
 *     - usePassageAudio stable callbacks via useCallback
 *
 *   This component is now a pure orchestrator:
 *     1. Reads routing state
 *     2. Wires hooks together
 *     3. Renders the layout shell
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageWrapper from '../../../components/layout/PageWrapper/PageWrapper';
import ClassroomPlayer from '../components/ClassroomPlayer/ClassroomPlayer';
import DictationSettings from '../components/DictationSettings/DictationSettings';
import TypeMode from '../components/TypeMode/TypeMode';
import HandwriteMode from '../components/HandwriteMode/HandwriteMode';
import DictationHeader from '../components/DictationHeader/DictationHeader';
import ReviewPanel from '../components/ReviewPanel/ReviewPanel';
import { useDictationSession } from '../hooks/useDictationSession';
import { useClassroomPlayer } from '../hooks/useClassroomPlayer';
import { usePassageAudio } from '../hooks/usePassageAudio';
import { useDictationSettings } from '../../../context/DictationSettingsContext';
import { useAuth } from '../../../hooks/useAuth';
import { getAccentIcon, getGenderLabel, getAccentLabel } from '../../../constants/voices';
import { ROUTES } from '../../../constants/routes';
import styles from './DictationPage.module.css';

export default function DictationPage() {
  const location          = useLocation();
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const { settings }      = useDictationSettings();
  const [showSettings, setShowSettings] = useState(false);

  const { passage, isHandwrite: initHandwrite } = location.state ?? {};

  // Guard — redirect if no passage in state
  useEffect(() => {
    if (!passage) navigate(ROUTES.SETUP);
  }, [passage, navigate]);

  // ── Derived voice/accent (settings win, user prefs as fallback) ───────────
  const voice  = settings.voice  ?? user?.preferredVoice  ?? 'female';
  const accent = settings.accent ?? user?.preferredAccent ?? 'american';

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const session      = useDictationSession(passage, initHandwrite);
  const { getAudioSource } = usePassageAudio({ passage, voice, accent });

  const classroom = useClassroomPlayer({
    getAudioSource,
    sentences:    session.sentences,
    currentIndex: session.currentIndex,
    settings,
    onAdvance:    session.goNext,
  });

  if (!passage) return null;

  const voiceLabel = `${getAccentIcon(accent)} ${getGenderLabel(voice)} · ${getAccentLabel(accent)}`;

  const handleExit = () => {
    classroom.stop();
    navigate(ROUTES.SETUP);
  };

  return (
    <PageWrapper>
      {/* ── Header ── */}
      <DictationHeader
        title={passage.title}
        level={passage.level}
        isHandwrite={session.isHandwrite}
        isUploaded={!!passage.isUploaded}
        voiceLabel={voiceLabel}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((v) => !v)}
        onExit={handleExit}
      />

      {/* ── Inline settings panel ── */}
      {showSettings && (
        <div className={styles.settingsPanel}>
          <DictationSettings compact />
        </div>
      )}

      {/* ── Audio player ── */}
      <ClassroomPlayer
        currentIndex={session.currentIndex}
        totalCount={session.totalCount}
        progress={session.progress}
        playing={classroom.playing}
        loading={classroom.loading}
        error={classroom.error}
        pauseActive={classroom.pauseActive}
        pauseCountdown={classroom.pauseCountdown}
        currentRepeat={classroom.currentRepeat}
        totalRepeats={classroom.totalRepeats}
        hasAudio={classroom.hasAudio}
        audioSource={classroom.audioSource}
        browserSupported={classroom.browserSupported}
        onStart={classroom.startSequence}
        onPause={classroom.pause}
        onReplay={classroom.replay}
        isHandwrite={session.isHandwrite}
        isUploaded={!!passage.isUploaded}
        speed={settings.speed}
        pauseDuration={settings.pauseDuration}
      />

      {/* ── Input area ── */}
      <div className={styles.modeArea}>
        {session.completed ? (
          /* Review + submit */
          <ReviewPanel
            sentences={session.sentences}
            answers={session.answers}
            isHandwrite={session.isHandwrite}
            handwrittenText={session.handwrittenText}
            onUpdateAnswer={session.updateAnswer}         // ← BUG FIX
            onSetHandwrittenText={session.setHandwrittenText}
            onBack={() => session.setCompleted(false)}
            onSubmit={session.finishSession}
          />
        ) : session.isHandwrite ? (
          /* Active handwrite */
          <HandwriteMode
            handwrittenText={session.handwrittenText}
            onTextChange={session.setHandwrittenText}
            onFinish={() => session.setCompleted(true)}
          />
        ) : (
          /* Active type mode */
          <TypeMode
            currentIndex={session.currentIndex}
            totalCount={session.totalCount}
            answer={session.answers[session.currentIndex] ?? ''}
            onAnswerChange={session.setAnswer}
            onNext={session.goNext}
            onPrev={session.goPrev}
            isLast={session.isLast}
          />
        )}
      </div>
    </PageWrapper>
  );
}
