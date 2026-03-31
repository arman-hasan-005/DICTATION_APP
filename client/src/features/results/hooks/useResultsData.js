/**
 * useResultsData
 *
 * BUG FIX — uploaded sessions never saved:
 *
 *   Uploaded passages get a synthetic _id like "upload_1748293847".
 *   This is NOT a valid MongoDB ObjectId. The server's Session model
 *   has passageId: { type: ObjectId, ref: 'Passage' }. When the client
 *   sent passage._id directly, Mongoose threw a CastError → 400 → the
 *   session silently failed to save every time an uploaded file was used.
 *
 *   Fix: if passage.isUploaded is true (or _id starts with "upload_"),
 *   send passageId: null so Mongoose stores NULL (the intended value for
 *   user-uploaded content that has no DB passage record).
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate }       from 'react-router-dom';
import { useAuth }                        from '../../../hooks/useAuth';
import sessionService                     from '../../../services/sessionService';
import { scoreSentence, scoreHandwrite, aggregateResults } from '../../../utils/scoring';
import { getGrade }                       from '../../../utils/grading';
import { ROUTES }                         from '../../../constants/routes';

/** True if this passage was uploaded by the user (not a DB passage) */
const isUploadedPassage = (passage) =>
  passage?.isUploaded === true ||
  (typeof passage?._id === 'string' && passage._id.startsWith('upload_'));

export function useResultsData() {
  const location       = useLocation();
  const navigate       = useNavigate();
  const { updateUser } = useAuth();

  const { passage, sentences, answers, handwrittenText, isHandwrite } =
    location.state ?? {};

  const [xpEarned,  setXpEarned]  = useState(0);
  const [newBadges, setNewBadges] = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // ── Scoring — memoized: never changes after mount ─────────────────────────
  const {
    sentenceResults,
    totalCorrect,
    totalWords,
    overallPercentage,
    answeredSentences,
    grade,
  } = useMemo(() => {
    const results = isHandwrite
      ? scoreHandwrite(sentences ?? [], handwrittenText)
      : (sentences ?? []).map((s, i) => scoreSentence(s, answers?.[i] ?? ''));

    const aggregate = aggregateResults(results);

    const answered = isHandwrite
      ? (handwrittenText?.trim() ? 1 : 0)
      : (answers?.filter((a) => a?.trim()).length ?? 0);

    return {
      sentenceResults:   results,
      totalCorrect:      aggregate.totalCorrect,
      totalWords:        aggregate.totalWords,
      overallPercentage: aggregate.overallPercentage,
      answeredSentences: answered,
      grade:             getGrade(aggregate.overallPercentage),
    };
  }, [sentences, answers, handwrittenText, isHandwrite]);

  // ── Session save — fires exactly once (StrictMode-safe) ───────────────────
  const savedRef = useRef(false);

  useEffect(() => {
    if (!passage || savedRef.current) return;
    savedRef.current = true;  // set synchronously before any async work

    const save = async () => {
      setSaving(true);
      try {
        const payload = {
          // ── KEY FIX ───────────────────────────────────────────────────────
          // Uploaded passages have a synthetic _id like "upload_1748293847".
          // That is NOT a valid MongoDB ObjectId — sending it causes a
          // Mongoose CastError (HTTP 400) and the session is never written.
          // Send null for uploaded passages so MongoDB stores NULL correctly.
          passageId:    isUploadedPassage(passage) ? null : (passage._id ?? null),
          passageTitle: passage.title,
          level:        passage.level ?? 'beginner',
          totalWords,
          correctWords: totalCorrect,
          score:        overallPercentage,
          isHandwrite:  !!isHandwrite,
          sentences: isHandwrite
            ? [{
                original: (sentences ?? []).join(' '),
                answer:   handwrittenText ?? '',
                score:    overallPercentage,
              }]
            : sentenceResults.map((r, i) => ({
                original: sentences[i],
                answer:   answers?.[i] ?? '',
                score:    r.percentage,
              })),
        };

        const res = await sessionService.save(payload);
        setXpEarned(res.data.xpEarned    ?? 0);
        setNewBadges(res.data.newBadges   ?? []);
        if (res.data.updatedUser) updateUser(res.data.updatedUser);
      } catch {
        savedRef.current = false;  // allow retry if user re-navigates
        setSaveError('Could not save session. Your results are still shown.');
      } finally {
        setSaving(false);
      }
    };

    save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goSetup    = useCallback(() => navigate(ROUTES.SETUP),    [navigate]);
  const goDashboard= useCallback(() => navigate(ROUTES.DASHBOARD),[navigate]);
  const goHistory  = useCallback(() => navigate(ROUTES.SESSIONS), [navigate]);

  return {
    passage, sentences, answers, handwrittenText, isHandwrite,
    sentenceResults, totalCorrect, totalWords, overallPercentage,
    answeredSentences, grade,
    xpEarned, newBadges, saving, saveError,
    activeTab, setActiveTab,
    goSetup, goDashboard, goHistory,
    isUploaded: isUploadedPassage(passage),
  };
}
