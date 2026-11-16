import type { Voice } from 'expo-speech';

// The device's speech voices a review can read in: English ones, the most
// natural first - Apple's Premium, then Enhanced, then the basic voices,
// each by name. Not the novelty voices (the bells, the whispers), which iOS
// files under its old speech synthesis. On Android, whose voices are
// Google's, those read online come after those read on the device: they
// need the internet, and wait on it before each line.
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
  if (isOnlineVoice(voice)) return 0;
  if (voice.identifier.includes('premium')) return 3;
  if (voice.quality === 'Enhanced') return 2;
  // Samantha is iOS's own American English voice: the default's default.
  return voice.name === 'Samantha' ? 1.5 : 1;
}

// Android's voices are named by identifier - "en-us-x-tpf-local" - its
// three-letter part the voice itself, read on the device or online.
const ANDROID_VOICE =
  /^[a-z]{2,3}-[a-z]{2,3}-x-([a-z0-9]{3,4})-(local|network)$/i;

function isOnlineVoice(voice: Voice): boolean {
  return ANDROID_VOICE.exec(voice.identifier)?.[2] === 'network';
}

// How good a voice is, as Settings names it - or, for one of Android's
// read online, that it is, since it won't work offline.
export function voiceQualityLabel(voice: Voice): string | null {
  if (isOnlineVoice(voice)) return 'Online';
  if (voice.identifier.includes('premium')) return 'Premium';
  if (voice.quality === 'Enhanced') return 'Enhanced';
  return null;
}

// A voice's name as Settings shows it: iOS's own ("Daniel"), or for one of
// Android's - named only by identifier - its short name ("Voice TPF"), or
// the language's default voice ("en-US-language").
export function voiceDisplayName(voice: Voice): string {
  const android = ANDROID_VOICE.exec(voice.identifier);
  if (android) return `Voice ${android[1].toUpperCase()}`;
  if (/-language$/.test(voice.identifier)) return 'Default voice';
  return voice.name;
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
