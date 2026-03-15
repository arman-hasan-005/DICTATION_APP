import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import sessionService from '../../../services/sessionService';
import { scoreSentence, scoreHandwrite, aggregateResults } from '../../../utils/scoring';
import { getGrade } from '../../../utils/grading';
import { ROUTES } from '../../../constants/routes';

export const useResultsData = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const { passage, sentences, answers, handwrittenText, isHandwrite } = location.state || {};

  const [xpEarned,   setXpEarned]   = useState(0);
  const [newBadges,  setNewBadges]  = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [saveError,  setSaveError]  = useState('');
  const [activeTab,  setActiveTab]  = useState('overview');

  // ── Compute scores (exact original logic) ──────────────────────────────────
  const sentenceResults = isHandwrite
    ? scoreHandwrite(sentences || [], handwrittenText)
    : (sentences || []).map((s, i) => scoreSentence(s, answers?.[i] || ''));

  const { totalCorrect, totalWords, overallPercentage } = aggregateResults(sentenceResults);

  const answeredSentences = isHandwrite
    ? (handwrittenText?.trim() ? 1 : 0)
    : (answers?.filter((a) => a?.trim()).length || 0);

  const grade = getGrade(overallPercentage);

  // ── Save session once on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!passage || saved) return;
    const save = async () => {
      setSaving(true);
      try {
        const res = await sessionService.save({
          passageId:    passage._id || null,
          passageTitle: passage.title,
          level:        passage.level || 'beginner',
          totalWords,
          correctWords: totalCorrect,
          score:        overallPercentage,
          isHandwrite:  !!isHandwrite,
          sentences: isHandwrite
            ? [{ original: (sentences || []).join(' '), answer: handwrittenText || '', score: overallPercentage }]
            : sentenceResults.map((r, i) => ({
                original: sentences[i],
                answer:   answers?.[i] || '',
                score:    r.percentage,
              })),
        });
        setXpEarned(res.data.xpEarned || 0);
        setNewBadges(res.data.newBadges || []);
        if (res.data.updatedUser) updateUser(res.data.updatedUser);
        setSaved(true);
      } catch {
        setSaveError('Could not save session. Your results are still shown.');
      } finally {
        setSaving(false);
      }
    };
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    passage, sentences, answers, handwrittenText, isHandwrite,
    sentenceResults, totalCorrect, totalWords, overallPercentage,
    answeredSentences, grade, xpEarned, newBadges, saving, saveError,
    activeTab, setActiveTab,
    goSetup:     () => navigate(ROUTES.SETUP),
    goDashboard: () => navigate(ROUTES.DASHBOARD),
  };
};
