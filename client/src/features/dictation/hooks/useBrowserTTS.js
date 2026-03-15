/**
 * browserTTS — plain module with full console logging for debugging
 */

let keepAliveTimer = null;

function startKeepAlive() {
  stopKeepAlive();
  keepAliveTimer = setInterval(() => {
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

function getAccentLang(accent) {
  const map = { american: "en-US", british: "en-GB", indian: "en-IN" };
  return map[accent] || "en-US";
}

function pickVoice(gender, accent) {
  const voices = window.speechSynthesis?.getVoices() || [];
  if (!voices.length) return null;
  const lang = getAccentLang(accent);
  const langBase = lang.split("-")[0];
  const femaleHints = [
    "female",
    "woman",
    "fiona",
    "samantha",
    "kate",
    "victoria",
    "karen",
    "moira",
    "tessa",
    "zira",
  ];
  const maleHints = [
    "male",
    "man",
    "daniel",
    "alex",
    "fred",
    "rishi",
    "thomas",
    "oliver",
    "david",
  ];
  const hints = gender === "female" ? femaleHints : maleHints;
  const exactLang = voices.filter(
    (v) => v.lang === lang || v.lang.startsWith(lang),
  );
  const baseLang = voices.filter((v) => v.lang.startsWith(langBase));
  const anyEn = voices.filter((v) => v.lang.startsWith("en"));
  for (const hint of hints) {
    const match = exactLang.find((v) => v.name.toLowerCase().includes(hint));
    if (match) return match;
  }
  return (
    exactLang[0] ||
    baseLang[0] ||
    anyEn[0] ||
    voices.find((v) => v.default) ||
    voices[0] ||
    null
  );
}

export function speakText(text, options = {}) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    console.log(
      "[TTS] speakText called. text=",
      JSON.stringify(text?.slice(0, 50)),
      "synth=",
      !!synth,
    );

    if (!synth || !text?.trim()) {
      console.warn("[TTS] EARLY EXIT — synth missing or text empty");
      resolve();
      return;
    }

    const { gender = "female", accent = "american", rate = 1.0 } = options;
    const isActive = synth.speaking || synth.pending;
    console.log(
      "[TTS] engine state — speaking:",
      synth.speaking,
      "pending:",
      synth.pending,
      "isActive:",
      isActive,
    );

    const run = () => {
      console.log("[TTS] run() called — creating utterance");
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = getAccentLang(accent);
      utterance.rate = Math.min(2.0, Math.max(0.1, rate));
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voice = pickVoice(gender, accent);
      if (voice) {
        utterance.voice = voice;
        console.log("[TTS] voice selected:", voice.name);
      } else {
        console.warn("[TTS] no voice found, using browser default");
      }

      let done = false;
      const finish = (reason) => {
        if (done) return;
        done = true;
        console.log("[TTS] finish called, reason:", reason);
        stopKeepAlive();
        resolve();
      };

      const wordCount = text.trim().split(/\s+/).length;
      const safetyMs =
        Math.max(6000, (wordCount / Math.max(rate, 0.5)) * 500) + 3000;
      const safetyTimer = setTimeout(() => finish("safety-timeout"), safetyMs);

      utterance.onstart = () => {
        console.log("[TTS] onstart fired ✅");
        startKeepAlive();
      };
      utterance.onend = () => {
        clearTimeout(safetyTimer);
        finish("onend");
      };
      utterance.onerror = (e) => {
        clearTimeout(safetyTimer);
        console.error("[TTS] onerror:", e.error);
        finish("onerror:" + e.error);
      };

      console.log("[TTS] calling synth.speak()...");
      synth.speak(utterance);
      console.log(
        "[TTS] after synth.speak() — speaking:",
        synth.speaking,
        "pending:",
        synth.pending,
      );
    };

    if (isActive) {
      console.log("[TTS] cancelling active speech, then waiting 150ms");
      synth.cancel();
      stopKeepAlive();
      setTimeout(run, 150);
    } else {
      console.log("[TTS] engine idle — calling run() directly");
      run();
    }
  });
}

export function cancelSpeech() {
  console.log("[TTS] cancelSpeech called");
  stopKeepAlive();
  window.speechSynthesis?.cancel();
}

export function useBrowserTTS() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
