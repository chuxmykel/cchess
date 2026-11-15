import type { Voice } from 'expo-speech';

import { chooseVoice, reviewVoices, voiceQualityLabel } from '../voices';

const voice = (
  identifier: string,
  name: string,
  quality: 'Default' | 'Enhanced' = 'Default',
  language = 'en-US',
) => ({ identifier, name, quality, language }) as Voice;

const SAMANTHA = voice('com.apple.voice.compact.en-US.Samantha', 'Samantha');
const KAREN = voice('com.apple.voice.compact.en-AU.Karen', 'Karen');
const DANIEL = voice(
  'com.apple.voice.enhanced.en-GB.Daniel',
  'Daniel',
  'Enhanced',
  'en-GB',
);
const ZOE = voice('com.apple.voice.premium.en-US.Zoe', 'Zoe', 'Enhanced');
const BELLS = voice('com.apple.speech.synthesis.voice.Bells', 'Bells');
const THOMAS = voice(
  'com.apple.voice.compact.fr-FR.Thomas',
  'Thomas',
  'Default',
  'fr-FR',
);

describe('voices', () => {
  it('lists English voices, the most natural first', () => {
    expect(
      reviewVoices([KAREN, BELLS, SAMANTHA, THOMAS, DANIEL, ZOE]).map(
        (v) => v.name,
      ),
    ).toEqual(['Zoe', 'Daniel', 'Samantha', 'Karen']);
  });

  it('names how good a voice is', () => {
    expect(voiceQualityLabel(ZOE)).toBe('Premium');
    expect(voiceQualityLabel(DANIEL)).toBe('Enhanced');
    expect(voiceQualityLabel(SAMANTHA)).toBeNull();
  });

  it('reads in the voice chosen, or else the best there is', () => {
    const voices = [KAREN, SAMANTHA, DANIEL];
    expect(chooseVoice(voices, KAREN.identifier)).toBe(KAREN);
    expect(chooseVoice(voices, null)).toBe(DANIEL);
    expect(chooseVoice(voices, ZOE.identifier)).toBe(DANIEL);
    expect(chooseVoice([THOMAS], null)).toBeNull();
  });
});
