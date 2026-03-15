import { useState, useRef, useCallback, useEffect } from "react";
import { speakText, cancelSpeech, useBrowserTTS } from "./useBrowserTTS";

export const useClassroomPlayer = ({
  getAudioSource,
  sentences,
  currentIndex,
  settings,
  onAdvance,
}) => {
  const settingsRef = useRef(settings);
  const sentencesRef = useRef(sentences);
  const onAdvanceRef = useRef(onAdvance);
  const getSourceRef = useRef(getAudioSource);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    sentencesRef.current = sentences;
  }, [sentences]);
  useEffect(() => {
    onAdvanceRef.current = onAdvance;
  }, [onAdvance]);
  useEffect(() => {
    getSourceRef.current = getAudioSource;
  }, [getAudioSource]);

  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const seqIdRef = useRef(0);
  const idxRef = useRef(currentIndex);
  const pendingAutoPlayRef = useRef(false);
  const startSequenceRef = useRef(null);

  useEffect(() => {
    idxRef.current = currentIndex;
  }, [currentIndex]);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pauseActive, setPauseActive] = useState(false);
  const [pauseCountdown, setPauseCountdown] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [audioSource, setAudioSource] = useState(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      _stopAudio();
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    seqIdRef.current++;
    clearTimeout(timeoutRef.current);
    _stopAudio();
    setPlaying(false);
    setPauseActive(false);
    setCurrentRepeat(0);
    setPauseCountdown(0);
    setAudioSource(null);
    setError("");

    setAudioSource(null);
    setError("");

    if (pendingAutoPlayRef.current && isMountedRef.current) {
      pendingAutoPlayRef.current = false;
      setTimeout(() => {
        if (isMountedRef.current) startSequenceRef.current?.();
      }, 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  function _stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }

  function _playBlob(blobUrl, speed) {
    return new Promise((resolve) => {
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      audio.playbackRate = Math.min(4, Math.max(0.1, speed));
      audio.onplay = () => {
        if (isMountedRef.current) setPlaying(true);
      };
      audio.onended = () => {
        if (isMountedRef.current) setPlaying(false);
        resolve();
      };
      audio.onerror = () => {
        if (isMountedRef.current) setPlaying(false);
        resolve();
      };
      audio.play().catch(() => {
        if (isMountedRef.current) setPlaying(false);
        resolve();
      });
    });
  }

  function _playBrowser(text, speed) {
    console.log(
      "[Player] _playBrowser called. text=",
      JSON.stringify(text?.slice(0, 50)),
      "speed=",
      speed,
    );
    if (!useBrowserTTS()) {
      console.warn("[Player] browser TTS not supported");
      return Promise.resolve();
    }
    if (!text?.trim()) {
      console.warn("[Player] _playBrowser: text is empty!");
      return Promise.resolve();
    }
    const s = settingsRef.current || {};
    console.log(
      "[Player] settings for speech — voice:",
      s.voice,
      "accent:",
      s.accent,
    );
    setPlaying(true);
    return speakText(text, {
      gender: s.voice || "female",
      accent: s.accent || "american",
      rate: speed,
    }).then(() => {
      console.log("[Player] speakText resolved");
      if (isMountedRef.current) setPlaying(false);
    });
  }

  function _waitPause(seconds, seqId) {
    return new Promise((resolve) => {
      if (seconds <= 0 || !isMountedRef.current || seqIdRef.current !== seqId) {
        resolve();
        return;
      }
      setPauseActive(true);
      setPauseCountdown(seconds);
      let rem = seconds;
      const tick = () => {
        if (!isMountedRef.current || seqIdRef.current !== seqId) {
          setPauseActive(false);
          resolve();
          return;
        }
        rem -= 1;
        if (rem <= 0) {
          setPauseActive(false);
          setPauseCountdown(0);
          resolve();
        } else {
          setPauseCountdown(rem);
          timeoutRef.current = setTimeout(tick, 1000);
        }
      };
      timeoutRef.current = setTimeout(tick, 1000);
    });
  }

  const startSequence = useCallback(async () => {
    if (loading || playing) return;

    const seqId = ++seqIdRef.current;
    clearTimeout(timeoutRef.current);
    _stopAudio();
    setPlaying(false);
    setPauseActive(false);
    setError("");
    setLoading(true);

    const idx = idxRef.current;
    const text = sentencesRef.current?.[idx] || "";
    const s = settingsRef.current || {};
    const speed = s.speed ?? 1.0;
    const repeatCount = s.repeatCount ?? 1;
    const pauseDuration = s.pauseDuration ?? 2;
    const autoAdvance = s.autoAdvance ?? false;

    console.log(
      "[Player] startSequence — idx:",
      idx,
      "text:",
      JSON.stringify(text?.slice(0, 60)),
    );
    console.log(
      "[Player] sentences in ref:",
      sentencesRef.current?.length,
      "items",
    );
    console.log("[Player] seqId:", seqId);

    // 1. Resolve source
    let source;
    try {
      source = await getSourceRef.current(text, idx);
    } catch (e) {
      console.error("[Player] getAudioSource threw:", e);
      source = { type: "browser", text };
    }

    console.log(
      "[Player] source resolved — type:",
      source?.type,
      "sourceType:",
      source?.sourceType,
    );

    if (!isMountedRef.current || seqIdRef.current !== seqId) {
      console.warn(
        "[Player] aborted after getAudioSource — mounted:",
        isMountedRef.current,
        "seqId match:",
        seqIdRef.current === seqId,
      );
      return;
    }

    if (source.type === "blob" && source.blob) {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(source.blob);
      setAudioSource(source.sourceType || "stored");
    } else {
      blobUrlRef.current = null;
      setAudioSource("browser");
    }

    setLoading(false);

    // 2. Play N times
    for (let r = 1; r <= repeatCount; r++) {
      if (!isMountedRef.current || seqIdRef.current !== seqId) return;
      setCurrentRepeat(r);

      console.log(
        "[Player] playing repeat",
        r,
        "of",
        repeatCount,
        "— type:",
        source.type,
      );

      if (source.type === "blob" && blobUrlRef.current) {
        await _playBlob(blobUrlRef.current, speed);
      } else {
        await _playBrowser(text, speed);
      }

      if (!isMountedRef.current || seqIdRef.current !== seqId) return;

      if (r < repeatCount) {
        await _waitPause(Math.max(1, Math.round(pauseDuration * 0.5)), seqId);
      }
    }

    if (!isMountedRef.current || seqIdRef.current !== seqId) return;
    setCurrentRepeat(0);

    if (pauseDuration > 0) await _waitPause(pauseDuration, seqId);

    if (!isMountedRef.current || seqIdRef.current !== seqId) return;
    if (autoAdvance) {
      pendingAutoPlayRef.current = true;
      onAdvanceRef.current?.();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, playing]);
  startSequenceRef.current = startSequence;

  const replay = useCallback(() => {
    if (playing || loading) return;
    const idx = idxRef.current;
    const text = sentencesRef.current?.[idx] || "";
    const s = settingsRef.current || {};
    clearTimeout(timeoutRef.current);
    _stopAudio();
    if (blobUrlRef.current) {
      setPlaying(false);
      _playBlob(blobUrlRef.current, s.speed ?? 1.0);
    } else {
      setPlaying(false);
      _playBrowser(text, s.speed ?? 1.0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, loading]);

  const pause = useCallback(() => {
    clearTimeout(timeoutRef.current);
    _stopAudio();
    cancelSpeech();
    setPlaying(false);
    setPauseActive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(() => {
    seqIdRef.current++;
    clearTimeout(timeoutRef.current);
    _stopAudio();
    cancelSpeech();
    setPlaying(false);
    setPauseActive(false);
    setCurrentRepeat(0);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    playing,
    loading,
    error,
    pauseActive,
    pauseCountdown,
    currentRepeat,
    totalRepeats: settings?.repeatCount ?? 1,
    audioSource,
    hasAudio: !!blobUrlRef.current,
    browserSupported: useBrowserTTS(),
    startSequence,
    replay,
    pause,
    stop,
  };
};
