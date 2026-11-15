import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

import { REVIEW_SPEECH_RATE } from '../constants/review';
import { chooseVoice, reviewVoices } from '../utils/voices';
import { useAppIsActive } from './useAppIsActive';

// The device's English voices, the most natural first - none until they've
// been asked of iOS.
export function useSpeechVoices(): Speech.Voice[] | null {
  const [voices, setVoices] = useState<Speech.Voice[] | null>(null);
  useEffect(() => {
    let current = true;
    Speech.getAvailableVoicesAsync()
      .then((all) => {
        if (current) setVoices(reviewVoices(all));
      })
      .catch(() => {
        if (current) setVoices([]);
      });
    return () => {
      current = false;
    };
  }, []);
  return voices;
}

export type ReviewVoice = {
  // Reads this aloud, in place of whatever was being read.
  say: (text: string) => void;
  stop: () => void;
};

// The review's voice: iOS's own speech, on the device - free, offline, and
// in the app's audio session, so the silent switch quiets it as it does the
// move sounds. Nothing's said while it's off, and what's being said stops
// when it's turned off, the app goes to the background or the screen
// closes.
export function useReviewVoice(
  enabled: boolean,
  voiceId: string | null,
): ReviewVoice {
  const voices = useSpeechVoices();
  const active = useAppIsActive();
  const voice = voices ? chooseVoice(voices, voiceId) : null;
  const options = useRef<Speech.SpeechOptions>({});
  useEffect(() => {
    options.current = {
      voice: voice?.identifier,
      language: voice?.language ?? 'en-US',
      rate: REVIEW_SPEECH_RATE,
    };
  }, [voice]);

  const stop = useCallback(() => {
    Speech.stop().catch(() => {});
  }, []);

  const say = useCallback(
    (text: string) => {
      if (!enabled || !active) return;
      Speech.stop().catch(() => {});
      Speech.speak(text, options.current);
    },
    [enabled, active],
  );

  useEffect(() => {
    if (!enabled || !active) stop();
  }, [enabled, active, stop]);
  useEffect(() => stop, [stop]);

  return { say, stop };
}
