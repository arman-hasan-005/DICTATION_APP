// ── Original scoring logic (preserved exactly) ────────────────────────────────

export const normalize = (str) =>
  str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

export const levenshtein = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
};

export const scoreSentence = (original, answer) => {
  const origWords = normalize(original).split(/\s+/).filter(Boolean);
  const ansWords  = normalize(answer || '').split(/\s+/).filter(Boolean);
  let correct = 0;
  const wordResults = origWords.map((word, i) => {
    const match = ansWords[i] === word;
    if (match) correct++;
    return { word, typed: ansWords[i] || '', correct: match };
  });
  return {
    wordResults,
    correct,
    total: origWords.length,
    percentage: origWords.length > 0 ? Math.round((correct / origWords.length) * 100) : 0,
  };
};

export const scoreHandwrite = (originalSentences, handwrittenText) => {
  const originalFull = originalSentences.join(' ');
  const origWords    = normalize(originalFull).split(/\s+/).filter(Boolean);
  const ansWords     = normalize(handwrittenText || '').split(/\s+/).filter(Boolean);
  let correct = 0;
  const wordResults = origWords.map((word, i) => {
    const typed     = ansWords[i] || '';
    const isCorrect = typed === word || levenshtein(typed, word) <= 1;
    if (isCorrect) correct++;
    return { word, typed, correct: isCorrect };
  });
  return [{
    wordResults,
    correct,
    total: origWords.length,
    percentage: origWords.length > 0 ? Math.round((correct / origWords.length) * 100) : 0,
  }];
};

export const aggregateResults = (results) => {
  const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);
  const totalWords   = results.reduce((sum, r) => sum + r.total,   0);
  return {
    totalCorrect,
    totalWords,
    overallPercentage: totalWords > 0 ? Math.round((totalCorrect / totalWords) * 100) : 0,
  };
};

// ── Feature 4: Detailed answer analysis ──────────────────────────────────────

/**
 * Returns a rich breakdown of mistakes for a single sentence.
 * Each wordResult gets a `status`: 'correct' | 'wrong' | 'missing' | 'extra'
 */
export const analyseWordResults = (wordResults) => {
  const missed = [];
  const wrong  = [];
  const extra  = [];

  wordResults.forEach((w) => {
    if (w.correct) return;
    if (!w.typed)           missed.push(w.word);
    else                    wrong.push({ expected: w.word, typed: w.typed });
  });

  return { missed, wrong, extra };
};

/**
 * Build a comprehensive analysis across all sentence results.
 */
export const buildDetailedAnalysis = (sentenceResults, sentences) => {
  const allMissed = [];
  const allWrong  = [];
  let   totalWords   = 0;
  let   totalCorrect = 0;
  let   totalMissed  = 0;
  let   totalWrong   = 0;

  const perSentence = sentenceResults.map((r, i) => {
    const { missed, wrong } = analyseWordResults(r.wordResults);
    allMissed.push(...missed);
    allWrong.push(...wrong);
    totalWords   += r.total;
    totalCorrect += r.correct;
    totalMissed  += missed.length;
    totalWrong   += wrong.length;
    return {
      index:      i,
      sentence:   sentences?.[i] || '',
      percentage: r.percentage,
      correct:    r.correct,
      total:      r.total,
      missed,
      wrong,
      wordResults: r.wordResults,
    };
  });

  // Frequency maps
  const missedFreq = allMissed.reduce((acc, w) => { acc[w] = (acc[w] || 0) + 1; return acc; }, {});
  const topMissed  = Object.entries(missedFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    perSentence,
    summary: {
      totalWords,
      totalCorrect,
      totalMissed,
      totalWrong,
      accuracy:   totalWords > 0 ? Math.round((totalCorrect / totalWords) * 100) : 0,
      missRate:   totalWords > 0 ? Math.round((totalMissed / totalWords) * 100) : 0,
      wrongRate:  totalWords > 0 ? Math.round((totalWrong  / totalWords) * 100) : 0,
    },
    topMissed,
    allWrong,
  };
};
