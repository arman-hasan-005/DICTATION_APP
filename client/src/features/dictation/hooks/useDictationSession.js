import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";

/**
 * Split text into sentences client-side.
 * Used as fallback when passage.sentences is empty (e.g. old DB records).
 */
function splitSentences(text) {
  if (!text?.trim()) return [];
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text.trim()];
}

export const useDictationSession = (passage, initialHandwrite = false) => {
  const navigate = useNavigate();

  // Use passage.sentences if populated; otherwise split from passage.text.
  // This fixes the case where old DB records have sentences: [] but text is set.
  const rawSentences = passage?.sentences || [];
  const sentences =
    rawSentences.length > 0
      ? rawSentences
      : splitSentences(passage?.text || passage?.content || "");

  const totalCount = sentences.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() =>
    Array(Math.max(totalCount, 1)).fill(""),
  );
  const [handwrittenText, setHandwrittenText] = useState("");
  const [isHandwrite, setIsHandwrite] = useState(initialHandwrite);

  const currentSentence = sentences[currentIndex] || "";
  const isLast = currentIndex === totalCount - 1;
  const progress =
    totalCount > 0 ? Math.round(((currentIndex + 1) / totalCount) * 100) : 0;

  const setAnswer = useCallback(
    (value) => {
      setAnswers((prev) => {
        const n = [...prev];
        n[currentIndex] = value;
        return n;
      });
    },
    [currentIndex],
  );

  const goNext = useCallback(() => {
    if (isLast) {
      navigate(ROUTES.RESULTS, {
        state: { passage, sentences, answers, handwrittenText, isHandwrite },
      });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [
    isLast,
    passage,
    sentences,
    answers,
    handwrittenText,
    isHandwrite,
    navigate,
  ]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const finishSession = useCallback(() => {
    navigate(ROUTES.RESULTS, {
      state: { passage, sentences, answers, handwrittenText, isHandwrite },
    });
  }, [passage, sentences, answers, handwrittenText, isHandwrite, navigate]);

  return {
    sentences,
    currentSentence,
    currentIndex,
    totalCount,
    answers,
    handwrittenText,
    isHandwrite,
    progress,
    isLast,
    setAnswer,
    setHandwrittenText,
    setIsHandwrite,
    goNext,
    goPrev,
    finishSession,
  };
};
