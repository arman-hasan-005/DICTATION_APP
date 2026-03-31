/**
 * useResultsData
 *
 * REFACTORING vs original:
 *
 *   PERFORMANCE — useMemo for scoring:
 *     The original computed sentenceResults / totals / grade *inline* in the
 *     hook body on every render. scoreSentence() + levenshtein() are O(n²)
 *     for long passages. Wrapping in useMemo ensures they only re-run when
 *     the source data changes (which is never after mount — data comes from
 *     router state).
 *
 *   RELIABILITY — savedRef guard (preserved + documented):
 *     React 18 StrictMode double-mounts components. Using useRef (not useState)
 *     ensures the save fires exactly once regardless of mount count.
 *
 *   CLARITY:
 *     - `save()` extracted as a named inner function for readability.
 *     - Navigation helpers memoized with useCallback.
 *     - Derived `answeredSentences` moved inside useMemo block.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import sessionService from '../../../services/sessionService';
import { scoreSentence, scoreHandwrite, aggregateResults } from '../../../utils/scoring';
import { getGrade } from '../../../utils/grading';
import { ROUTES } from '../../../constants/routes';

export function useResultsData() {
  const location          = useLocation();
  const navigate          = useNavigate();
  const { updateUser }    = useAuth();

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
      sentenceResults:    results,
      totalCorrect:       aggregate.totalCorrect,
      totalWords:         aggregate.totalWords,
      overallPercentage:  aggregate.overallPercentage,
      answeredSentences:  answered,
      grade:              getGrade(aggregate.overallPercentage),
    };
  }, [sentences, answers, handwrittenText, isHandwrite]);

  // ── Session save — fires exactly once (StrictMode-safe) ───────────────────
  const savedRef = useRef(false);

  useEffect(() => {
    if (!passage || savedRef.current) return;
    savedRef.current = true;   // set before async call to block second mount

    const save = async () => {
      setSaving(true);
      try {
        const payload = {
          passageId:    passage._id ?? null,
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
        setXpEarned(res.data.xpEarned ?? 0);
        setNewBadges(res.data.newBadges ?? []);
        if (res.data.updatedUser) updateUser(res.data.updatedUser);
      } catch {
        savedRef.current = false;  // allow retry on explicit re-navigation
        setSaveError('Could not save session. Your results are still shown.');
      } finally {
        setSaving(false);
      }
    };

    save();
    // Intentionally omitting deps — this fires once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goSetup     = useCallback(() => navigate(ROUTES.SETUP),     [navigate]);
  const goDashboard = useCallback(() => navigate(ROUTES.DASHBOARD), [navigate]);

  return {
    passage,
    sentences,
    answers,
    handwrittenText,
    isHandwrite,
    sentenceResults,
    totalCorrect,
    totalWords,
    overallPercentage,
    answeredSentences,
    grade,
    xpEarned,
    newBadges,
    saving,
    saveError,
    activeTab,
    setActiveTab,
    goSetup,
    goDashboard,
  };
}
