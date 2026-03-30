import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";

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

  const rawSentences = passage?.sentences || [];
  const sentences =
    rawSentences.length > 0
      ? rawSentences
      : splitSentences(passage?.content || passage?.text || "");

  const totalCount = sentences.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() =>
    Array(Math.max(totalCount, 1)).fill(""),
  );
  const [handwrittenText, setHandwrittenText] = useState("");
  const [isHandwrite, setIsHandwrite] = useState(initialHandwrite);
  const [completed, setCompleted] = useState(false);

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

  // goNext — only moves between sentences, never navigates away
  // When on last sentence, marks session as completed for manual review
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

  // finishSession — called only when user explicitly clicks Submit
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
    completed,
    setAnswer,
    setHandwrittenText,
    setIsHandwrite,
    goNext,
    goPrev,
    finishSession,
    setCompleted,
  };
};
