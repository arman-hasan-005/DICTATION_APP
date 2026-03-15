import { useState, useRef, useCallback } from 'react';

export const useAudioPlayer = () => {
  const audioRef            = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [canReplay,setCanReplay]= useState(false);

  const play = useCallback((audioUrl) => {
    if (!audioUrl) return;
    setError('');
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setLoading(true);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.oncanplaythrough = () => setLoading(false);
    audio.onplay    = () => { setPlaying(true); setLoading(false); };
    audio.onpause   = () => setPlaying(false);
    audio.onended   = () => { setPlaying(false); setCanReplay(true); };
    audio.onerror   = () => { setLoading(false); setPlaying(false); setError('Audio playback failed. Please try again.'); };
    audio.play().catch(() => { setLoading(false); setError('Could not play audio.'); });
  }, []);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);

  const replay = useCallback(() => {
    if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); setCanReplay(false); }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlaying(false); setCanReplay(false);
  }, []);

  return { playing, loading, error, canReplay, play, pause, replay, stop };
};
