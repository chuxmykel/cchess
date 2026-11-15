import type { Voice } from 'expo-speech';

// The device's speech voices a review can read in: English ones, the most
// natural first - Apple's Premium, then Enhanced, then the basic voices,
// each by name. Not the novelty voices (the bells, the whispers), which iOS
// files under its old speech synthesis.
export function reviewVoices(voices: Voice[]): Voice[] {
  return voices
    .filter(
      (voice) =>
        voice.language.startsWith('en') &&
        !voice.identifier.includes('speech.synthesis') &&
        !voice.identifier.includes('eloquence'),
    )
    .sort(
      (a, b) =>
        voiceRank(b) - voiceRank(a) ||
        a.name.localeCompare(b.name) ||
        a.language.localeCompare(b.language),
    );
}

function voiceRank(voice: Voice): number {
  if (voice.identifier.includes('premium')) return 3;
  if (voice.quality === 'Enhanced') return 2;
  // Samantha is iOS's own American English voice: the default's default.
  return voice.name === 'Samantha' ? 1.5 : 1;
}

// How good a voice is, as Settings names it.
export function voiceQualityLabel(voice: Voice): string | null {
  if (voice.identifier.includes('premium')) return 'Premium';
  if (voice.quality === 'Enhanced') return 'Enhanced';
  return null;
}

// The voice to read in: the one chosen, while it's still on the device -
// or else the best there is.
export function chooseVoice(
  voices: Voice[],
  chosenId: string | null,
): Voice | null {
  const usable = reviewVoices(voices);
  return (
    usable.find((voice) => voice.identifier === chosenId) ?? usable[0] ?? null
  );
}
