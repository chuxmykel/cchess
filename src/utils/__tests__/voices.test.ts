import type { Voice } from 'expo-speech';

import {
  chooseVoice,
  reviewVoices,
  voiceDisplayName,
  voiceQualityLabel,
} from '../voices';

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

// Android's own (Google's) voices: named by their identifier, the ones read
// on the device ("local") and the ones read online ("network").
const TPF_LOCAL = voice('en-us-x-tpf-local', 'en-us-x-tpf-local', 'Enhanced');
const IOL_NETWORK = voice(
  'en-us-x-iol-network',
  'en-us-x-iol-network',
  'Enhanced',
);
const GBD_LOCAL = voice(
  'en-gb-x-gbd-local',
  'en-gb-x-gbd-local',
  'Default',
  'en-GB',
);
const ANDROID_DEFAULT = voice('en-US-language', 'en-US-language', 'Enhanced');

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

  it("ranks Android's voices read on the device above those read online", () => {
    expect(
      reviewVoices([IOL_NETWORK, GBD_LOCAL, TPF_LOCAL]).map(
        (v) => v.identifier,
      ),
    ).toEqual([
      'en-us-x-tpf-local',
      'en-gb-x-gbd-local',
      'en-us-x-iol-network',
    ]);
    expect(chooseVoice([IOL_NETWORK, TPF_LOCAL], null)).toBe(TPF_LOCAL);
  });

  it("says an Android voice is read online, as it won't work offline", () => {
    expect(voiceQualityLabel(IOL_NETWORK)).toBe('Online');
    expect(voiceQualityLabel(TPF_LOCAL)).toBe('Enhanced');
  });

  it("names Android's voices by their own short name, not their identifier", () => {
    expect(voiceDisplayName(TPF_LOCAL)).toBe('Voice TPF');
    expect(voiceDisplayName(IOL_NETWORK)).toBe('Voice IOL');
    expect(voiceDisplayName(ANDROID_DEFAULT)).toBe('Default voice');
    expect(voiceDisplayName(DANIEL)).toBe('Daniel');
  });
});
