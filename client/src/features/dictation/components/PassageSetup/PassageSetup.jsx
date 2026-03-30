import { useState } from "react";
import Button from "../../../../components/ui/Button/Button";
import Loader from "../../../../components/ui/Loader/Loader";
import { LEVEL_LIST, getLevelConfig } from "../../../../constants/levels";
import styles from "./PassageSetup.module.css";

export default function PassageSetup({ passages, loading, onStart }) {
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [isHandwrite, setIsHandwrite] = useState(false);
  const [readPassage, setReadPassage] = useState(null);

  const filtered =
    selectedLevel === "all"
      ? passages
      : passages?.filter((p) => p.level === selectedLevel);

  if (loading) return <Loader text="Loading passages…" />;

  return (
    <div className={styles.wrapper}>
      {/* ── Level filter ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Choose Level</h3>
        <div className={styles.levelTabs}>
          <button
            className={[
              styles.tab,
              selectedLevel === "all" ? styles.tabActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              setSelectedLevel("all");
              setSelectedPassage(null);
            }}
          >
            All
          </button>
          {LEVEL_LIST.map((lvl) => {
            const cfg = getLevelConfig(lvl);
            return (
              <button
                key={lvl}
                className={[
                  styles.tab,
                  selectedLevel === lvl ? styles.tabActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  selectedLevel === lvl
                    ? {
                        borderColor: cfg.color,
                        color: cfg.color,
                        background: cfg.bgColor,
                      }
                    : {}
                }
                onClick={() => {
                  setSelectedLevel(lvl);
                  setSelectedPassage(null);
                }}
              >
                {cfg.emoji} {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Passage scrollable box ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Select a Passage</h3>
          <span className={styles.passageCount}>
            {filtered?.length || 0} passage{filtered?.length !== 1 ? "s" : ""}
            {selectedPassage ? " · 1 selected" : ""}
          </span>
        </div>

        <div className={styles.passageBox}>
          {filtered?.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📭</span>
              <p>No passages found for this level.</p>
            </div>
          ) : (
            <div className={styles.passageList}>
              {filtered?.map((p) => {
                const cfg = getLevelConfig(p.level);
                const isActive = selectedPassage?._id === p._id;
                const preview =
                  p.sentences?.[0] ||
                  p.content?.slice(0, 90) ||
                  p.text?.slice(0, 90) ||
                  "";
                return (
                  <div
                    key={p._id}
                    className={[
                      styles.passageRow,
                      isActive ? styles.passageRowSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      setSelectedPassage((prev) =>
                        prev?._id == p._id ? null : p,
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setSelectedPassage(p)
                    }
                  >
                    {/* Selection indicator */}
                    <div className={styles.radioIndicator}>
                      <div
                        className={[
                          styles.radioOuter,
                          isActive ? styles.radioActive : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {isActive && <div className={styles.radioInner} />}
                      </div>
                    </div>

                    {/* Passage info */}
                    <div className={styles.passageInfo}>
                      <div className={styles.passageInfoTop}>
                        <div className={styles.pasageTitleRow}>
                          <h4 className={styles.passageTitle}>{p.title}</h4>
                          <button
                            className={styles.readBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setReadPassage(p);
                            }}
                            type="button"
                          >
                            📖 Read
                          </button>
                        </div>
                        <div className={styles.passageMeta}>
                          <span
                            className={styles.levelBadge}
                            style={{
                              background: cfg.bgColor,
                              color: cfg.color,
                            }}
                          >
                            {cfg.emoji} {cfg.label}
                          </span>
                          <span className={styles.wordCount}>
                            {p.wordCount || "?"} words
                          </span>
                        </div>
                      </div>
                      {preview && (
                        <p className={styles.passagePreview}>{preview}…</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Practice Mode ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Practice Mode</h3>
        <div className={styles.modeGrid}>
          <button
            className={[
              styles.modeCard,
              !isHandwrite ? styles.modeSelected : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setIsHandwrite(false)}
            type="button"
          >
            <span className={styles.modeIcon}>⌨️</span>
            <span className={styles.modeLabel}>Type Mode</span>
            <span className={styles.modeDesc}>
              Type each sentence after hearing it
            </span>
          </button>
          <button
            className={[styles.modeCard, isHandwrite ? styles.modeSelected : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setIsHandwrite(true)}
            type="button"
          >
            <span className={styles.modeIcon}>✍️</span>
            <span className={styles.modeLabel}>Handwrite Mode</span>
            <span className={styles.modeDesc}>
              Write on paper and upload a photo
            </span>
          </button>
        </div>
      </div>

      {/* ── Start button ── */}
      <Button
        fullWidth
        size="lg"
        disabled={!selectedPassage}
        onClick={() => onStart({ passage: selectedPassage, isHandwrite })}
      >
        🎧 Start Dictation
      </Button>

      {readPassage && (
        <div className={styles.readModal} onClick={() => setReadPassage(null)}>
          <div
            className={styles.readModalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.readModalHeader}>
              <h3 className={styles.readModalTitle}>{readPassage.title}</h3>
              <button
                className={styles.readModalClose}
                onClick={() => setReadPassage(null)}
                type="button"
              >
                ✕
              </button>
            </div>
            <p className={styles.readModalText}>
              {readPassage.content ||
                readPassage.text ||
                readPassage.sentences?.join(" ") ||
                "No content available."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
