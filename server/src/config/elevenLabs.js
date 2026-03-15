const { elevenLabsKey } = require("./env");

const VOICE_IDS = {
  female: "EXAVITQu4vr4xnSDxMaL", // Sarah
  male: "TxGEqnHWrfWFTfGW9XjX", // Josh
};

const generateSpeech = async (text, voice = "female") => {
  const voiceId = VOICE_IDS[voice] || VOICE_IDS.female;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": elevenLabsKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.detail?.message || `ElevenLabs error: ${response.status}`,
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

module.exports = { generateSpeech, VOICE_IDS };
