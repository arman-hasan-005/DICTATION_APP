import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import ClassroomPlayer from "../components/ClassroomPlayer/ClassroomPlayer";
import DictationSettings from "../components/DictationSettings/DictationSettings";
import TypeMode from "../components/TypeMode/TypeMode";
import HandwriteMode from "../components/HandwriteMode/HandwriteMode";
import { useDictationSession } from "../hooks/useDictationSession";
import { useClassroomPlayer } from "../hooks/useClassroomPlayer";
import { useDictationSettings } from "../../../context/DictationSettingsContext";
import { useAuth } from "../../../hooks/useAuth";
import {
  getAccentIcon,
  getGenderLabel,
  getAccentLabel,
} from "../../../constants/voices";
import http from "../../../services/http";
import { ROUTES } from "../../../constants/routes";
import styles from "./DictationPage.module.css";

export default function DictationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useDictationSettings();

  const { passage, isHandwrite: initHandwrite } = location.state || {};
  const session = useDictationSession(passage, initHandwrite);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!passage) navigate(ROUTES.SETUP);
  }, [passage, navigate]);

  const voice = settings.voice ?? user?.preferredVoice ?? "female";
  const accent = settings.accent ?? user?.preferredAccent ?? "american";

  /**
   * getAudioSource — resolves how to play a single sentence.
   *
   * Pre-written passage:
   *   Has audioIndexes entry → fetch stored audio → fallback browser on any error
   *   No entry              → browser speech directly
   *
   * Uploaded content:
   *   POST /passages/tts → Google TTS mp3 blob  → fallback browser
   *   Server returns fallback JSON or any error → browser speech
   */
  const getAudioSource = useCallback(
    async (sentenceText, sentenceIndex) => {
      if (!sentenceText?.trim()) {
        return { type: "browser", text: sentenceText };
      }

      // ── Path A: Uploaded content → Google TTS ────────────────────────────
      if (passage?.isUploaded) {
        try {
          const res = await http.post(
            "/passages/tts",
            { text: sentenceText, voice, accent },
            { responseType: "blob" },
          );

          // Server may return JSON { fallback: true } even with responseType:'blob'
          // Detect by reading the blob as text
          const blob = res.data;
          const contentType = res.headers?.["content-type"] || blob?.type || "";

          if (
            contentType.includes("application/json") ||
            contentType.includes("text/")
          ) {
            // Server signalled fallback
            return { type: "browser", text: sentenceText };
          }

          // Sanity check — a real MP3 starts with 0xFF 0xFB or ID3 header
          if (blob && blob.size > 100) {
            return { type: "blob", blob, sourceType: "google" };
          }

          return { type: "browser", text: sentenceText };
        } catch {
          return { type: "browser", text: sentenceText };
        }
      }

      // ── Path B: Pre-written passage → stored audio ───────────────────────
      const passageId = passage?._id;
      const hasStored =
        passageId &&
        !passageId.startsWith("upload_") &&
        Array.isArray(passage?.audioIndexes) &&
        passage.audioIndexes.includes(sentenceIndex);

      if (hasStored) {
        try {
          const res = await http.get(
            `/passages/${passageId}/audio/${sentenceIndex}`,
            { responseType: "blob" },
          );

          const blob = res.data;
          const contentType = res.headers?.["content-type"] || blob?.type || "";

          // 404 returns JSON — detect and fall through
          if (
            contentType.includes("application/json") ||
            contentType.includes("text/")
          ) {
            return { type: "browser", text: sentenceText };
          }

          if (blob && blob.size > 100) {
            return { type: "blob", blob, sourceType: "stored" };
          }

          return { type: "browser", text: sentenceText };
        } catch {
          return { type: "browser", text: sentenceText };
        }
      }

      // ── Path C: No audio available → browser speech ──────────────────────
      return { type: "browser", text: sentenceText };
    },
    [passage, voice, accent],
  );

  const classroom = useClassroomPlayer({
    getAudioSource,
    sentences: session.sentences,
    currentIndex: session.currentIndex,
    settings,
    onAdvance: session.goNext,
  });

  if (!passage) return null;

  const voiceLabel = `${getAccentIcon(accent)} ${getGenderLabel(voice)} · ${getAccentLabel(accent)}`;

  return (
    <PageWrapper>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{passage.title}</h1>
          <p className={styles.meta}>
            {session.isHandwrite ? "✍️ Handwrite Mode" : "⌨️ Type Mode"}
            &nbsp;·&nbsp;
            <span style={{ textTransform: "capitalize" }}>{passage.level}</span>
            &nbsp;·&nbsp;
            <span className={styles.voicePill}>{voiceLabel}</span>
            {passage.isUploaded && (
              <span className={styles.uploadedPill}>📄 Uploaded</span>
            )}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={[
              styles.settingsToggle,
              showSettings ? styles.settingsToggleActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setShowSettings((v) => !v)}
            type="button"
          >
            ⚙️ Settings
          </button>
          <button
            className={styles.exitBtn}
            onClick={() => {
              classroom.stop();
              navigate(ROUTES.SETUP);
            }}
            type="button"
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {showSettings && (
        <div className={styles.settingsPanel}>
          <DictationSettings compact />
        </div>
      )}

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

      <div className={styles.modeArea}>
        {session.isHandwrite ? (
          <HandwriteMode
            handwrittenText={session.handwrittenText}
            onTextChange={session.setHandwrittenText}
            onFinish={session.finishSession}
          />
        ) : (
          <TypeMode
            currentIndex={session.currentIndex}
            totalCount={session.totalCount}
            answer={session.answers[session.currentIndex] || ""}
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
