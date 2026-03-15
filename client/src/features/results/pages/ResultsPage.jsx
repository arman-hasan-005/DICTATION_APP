import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import ScoreCards from "../components/ScoreCards/ScoreCards";
import SentenceReview from "../components/SentenceReview/SentenceReview";
import DetailedReview from "../components/DetailedReview/DetailedReview";
import BadgeUnlock from "../components/BadgeUnlock/BadgeUnlock";
import Button from "../../../components/ui/Button/Button";
import { useResultsData } from "../hooks/useResultsData";
import styles from "./ResultsPage.module.css";

const TABS = [
  { id: "overview", label: "📊 Overview" },
  { id: "detailed", label: "🔍 Detailed Check" },
  { id: "sentences", label: "📝 Sentence Review" },
];

export default function ResultsPage() {
  const {
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
  } = useResultsData();

  if (!passage) return null;

  return (
    <PageWrapper>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Results</h1>
          <p className={styles.subtitle}>
            {passage.title}&nbsp;·&nbsp;
            {isHandwrite ? "✍️ Handwrite Mode" : "⌨️ Type Mode"}
          </p>
        </div>
        <div className={styles.headerBtns}>
          <Button variant="secondary" onClick={goSetup}>
            🔄 Try Again
          </Button>
          <Button onClick={goDashboard}>🏠 Dashboard</Button>
        </div>
      </div>

      {saveError && <p className={styles.saveError}>⚠️ {saveError}</p>}

      {/* Badge notifications */}
      <BadgeUnlock newBadges={newBadges} />

      {/* Tab navigation */}
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={[styles.tab, activeTab === t.id ? styles.tabActive : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setActiveTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <ScoreCards
          grade={grade}
          overallPercentage={overallPercentage}
          totalCorrect={totalCorrect}
          totalWords={totalWords}
          answeredSentences={answeredSentences}
          totalSentences={sentences?.length}
          xpEarned={xpEarned}
          saving={saving}
          isHandwrite={isHandwrite}
        />
      )}

      {/* ── Detailed check tab (Feature 4) ── */}
      {activeTab === "detailed" && (
        <DetailedReview
          sentenceResults={sentenceResults}
          sentences={sentences}
          isHandwrite={isHandwrite}
        />
      )}

      {/* ── Sentence-by-sentence review tab ── */}
      {activeTab === "sentences" && (
        <SentenceReview
          sentenceResults={sentenceResults}
          sentences={sentences}
          answers={answers}
          handwrittenText={handwrittenText}
          isHandwrite={isHandwrite}
        />
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerMsg}>
          🎉 You scored <strong>{overallPercentage}%</strong> — {grade.message}
        </p>
        <div className={styles.headerBtns}>
          <Button variant="secondary" onClick={goSetup}>
            🔄 Try Again
          </Button>
          <Button onClick={goDashboard}>🏠 Dashboard</Button>
        </div>
      </div>
    </PageWrapper>
  );
}
