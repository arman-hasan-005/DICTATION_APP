import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import ClassroomPlayer from "../components/ClassroomPlayer/ClassroomPlayer";
import DictationSettings from "../components/DictationSettings/DictationSettings";
import TypeMode from "../components/TypeMode/TypeMode";
import HandwriteMode from "../components/HandwriteMode/HandwriteMode";
import Button from "../../../components/ui/Button/Button";
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

  const cachedKeysRef = useRef(
    new Set(
      (passage?.audioCache || []).map(
        (a) => `${a.sentenceIndex}_${a.voice}_${a.accent}`,
      ),
    ),
  );

  const _callGoogleTTS = useCallback(
    async (text) => {
      try {
        const res = await http.post(
          "/passages/tts",
          { text, voice, accent },
          { responseType: "blob" },
        );
        const blob = res.data;
        const contentType = res.headers?.["content-type"] || blob?.type || "";
        if (
          contentType.includes("application/json") ||
          contentType.includes("text/")
        )
          return null;
        if (blob && blob.size > 100) return blob;
        return null;
      } catch {
        return null;
      }
    },
    [voice, accent],
  );

  const _saveAudioInBackground = useCallback(
    async (passageId, sentenceIndex, blob) => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        );
        await http.post(`/passages/${passageId}/audio`, {
          sentenceIndex,
          audioBase64: base64,
          contentType: "audio/mpeg",
          voice,
          accent,
        });
        cachedKeysRef.current.add(`${sentenceIndex}_${voice}_${accent}`);
      } catch {
        // Silently ignore — audio already played, caching is best-effort
      }
    },
    [voice, accent],
  );

  const getAudioSource = useCallback(
    async (sentenceText, sentenceIndex) => {
      if (!sentenceText?.trim()) return { type: "browser", text: sentenceText };

      // Uploaded content → Google TTS → browser fallback
      if (passage?.isUploaded) {
        const blob = await _callGoogleTTS(sentenceText);
        if (blob) return { type: "blob", blob, sourceType: "google" };
        return { type: "browser", text: sentenceText };
      }

      // Pre-written passage
      const passageId = passage?._id;
      const cacheKey = `${sentenceIndex}_${voice}_${accent}`;
      const hasStored =
        passageId &&
        !passageId.startsWith("upload_") &&
        (cachedKeysRef.current.has(cacheKey) ||
          (Array.isArray(passage?.audioCache) &&
            passage.audioCache.some(
              (a) =>
                a.sentenceIndex === sentenceIndex &&
                a.voice === voice &&
                a.accent === accent,
            )));

      // Step 1: Try stored audio
      if (hasStored) {
        try {
          const res = await http.get(
            `/passages/${passageId}/audio/${sentenceIndex}`,
            { responseType: "blob", params: { voice, accent } },
          );
          const blob = res.data;
          const contentType = res.headers?.["content-type"] || blob?.type || "";
          if (
            !contentType.includes("application/json") &&
            blob &&
            blob.size > 100
          ) {
            return { type: "blob", blob, sourceType: "stored" };
          }
        } catch {
          // Fall through to Google TTS
        }
      }

      // Step 2: Google TTS → play + auto-cache
      if (passageId && !passageId.startsWith("upload_")) {
        const blob = await _callGoogleTTS(sentenceText);
        if (blob) {
          const blobCopy = blob.slice(0, blob.size, blob.type);
          _saveAudioInBackground(passageId, sentenceIndex, blobCopy);
          return { type: "blob", blob, sourceType: "google" };
        }
      }

      // Step 3: Browser fallback
      return { type: "browser", text: sentenceText };
    },
    [passage, voice, accent, _callGoogleTTS, _saveAudioInBackground],
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
        {/* ── Dictation completed — review + submit panel ── */}
        {session.completed ? (
          <div className={styles.reviewPanel}>
            <div className={styles.reviewHeader}>
              <span className={styles.reviewIcon}>🎉</span>
              <div>
                <h3 className={styles.reviewTitle}>Dictation Complete!</h3>
                <p className={styles.reviewSubtitle}>
                  Review your answers below, then submit when ready.
                </p>
              </div>
            </div>

            {/* Show all sentence answers for review */}
            {!session.isHandwrite && (
              <div className={styles.reviewAnswers}>
                {session.sentences.map((sentence, i) => (
                  <div key={i} className={styles.reviewRow}>
                    <span className={styles.reviewNum}>{i + 1}</span>
                    <textarea
                      className={styles.reviewTextarea}
                      value={session.answers[i] || ""}
                      onChange={(e) => {
                        const newAnswers = [...session.answers];
                        newAnswers[i] = e.target.value;
                        // Update via setAnswer by temporarily switching index
                      }}
                      rows={2}
                      spellCheck={false}
                      placeholder="No answer entered"
                    />
                  </div>
                ))}
              </div>
            )}

            {session.isHandwrite && (
              <div className={styles.reviewAnswers}>
                <HandwriteMode
                  handwrittenText={session.handwrittenText}
                  onTextChange={session.setHandwrittenText}
                  onFinish={session.finishSession}
                />
              </div>
            )}

            <div className={styles.reviewActions}>
              <button
                className={styles.reviewBackBtn}
                onClick={() => {
                  session.setCompleted(false);
                }}
                type="button"
              >
                ← Back to dictation
              </button>
              {!session.isHandwrite && (
                <Button size="lg" onClick={session.finishSession}>
                  ✅ Submit &amp; Check Answers
                </Button>
              )}
            </div>
          </div>
        ) : /* ── Active dictation mode ── */
        session.isHandwrite ? (
          <HandwriteMode
            handwrittenText={session.handwrittenText}
            onTextChange={session.setHandwrittenText}
            onFinish={() => session.setCompleted(true)}
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
