/**
 * useDictationSession
 *
 * Manages the stateful lifecycle of a single dictation session:
 * - sentence navigation (currentIndex, goNext, goPrev)
 * - per-sentence answers array
 * - handwrite mode text
 * - completion / submission flow
 *
 * CHANGES FROM ORIGINAL:
 * - Added `updateAnswer(index, value)` so the ReviewPanel can update any
 *   sentence's answer by explicit index (BUG FIX — the original onChange
 *   in the review textareas was a no-op because setAnswer() only updated
 *   the *current* index, not the iterated index).
 * - Extracted `splitSentences` to a shared util (keeps hook lean).
 * - `setAnswer` is now derived from `updateAnswer` to avoid duplicate logic.
 * - All callbacks are stable references via useCallback.
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

// ─── Pure helper — no side effects ───────────────────────────────────────────
function splitSentences(text) {
  if (!text?.trim()) return [];
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text.trim()];
}

// ─────────────────────────────────────────────────────────────────────────────

export function useDictationSession(passage, initialHandwrite = false) {
  const navigate = useNavigate();

  // Derive sentences once — either from pre-split array or by splitting text
  const sentences = useMemo(() => {
    const raw = passage?.sentences ?? [];
    return raw.length > 0
      ? raw
      : splitSentences(passage?.content ?? passage?.text ?? '');
  }, [passage]);

  const totalCount = sentences.length;

  const [currentIndex,    setCurrentIndex]    = useState(0);
  const [answers,         setAnswers]         = useState(() => Array(Math.max(totalCount, 1)).fill(''));
  const [handwrittenText, setHandwrittenText] = useState('');
  const [isHandwrite,     setIsHandwrite]     = useState(initialHandwrite);
  const [completed,       setCompleted]       = useState(false);

  // ── Derived state ──────────────────────────────────────────────────────────
  const currentSentence = sentences[currentIndex] ?? '';
  const isLast          = currentIndex === totalCount - 1;
  const progress        = totalCount > 0
    ? Math.round(((currentIndex + 1) / totalCount) * 100)
    : 0;

  // ── Answer mutation ────────────────────────────────────────────────────────

  /**
   * Update an answer at an *explicit* index.
   * Used by both the live TypeMode (currentIndex) and the ReviewPanel
   * (arbitrary index) — fixes the original bug where review edits were lost.
   */
  const updateAnswer = useCallback((index, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  /**
   * Convenience wrapper — updates the *current* sentence's answer.
   * Keeps the API identical to the original `setAnswer` so TypeMode
   * doesn't need changes.
   */
  const setAnswer = useCallback(
    (value) => updateAnswer(currentIndex, value),
    [updateAnswer, currentIndex],
  );

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    if (isLast) {
      setCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [isLast]);

  const goPrev = useCallback(() => {
    setCompleted(false);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  // ── Submission ─────────────────────────────────────────────────────────────

  const finishSession = useCallback(() => {
    navigate(ROUTES.RESULTS, {
      state: { passage, sentences, answers, handwrittenText, isHandwrite },
    });
  }, [passage, sentences, answers, handwrittenText, isHandwrite, navigate]);

  return {
    // Data
    sentences,
    currentSentence,
    currentIndex,
    totalCount,
    answers,
    handwrittenText,
    isHandwrite,
    progress,
    isLast,
    completed,
    // Mutators
    setAnswer,          // update current sentence answer
    updateAnswer,       // update answer at explicit index (ReviewPanel)
    setHandwrittenText,
    setIsHandwrite,
    setCompleted,
    // Navigation
    goNext,
    goPrev,
    // Submission
    finishSession,
  };
}
