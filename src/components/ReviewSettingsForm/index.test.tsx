import { fireEvent, render } from '@testing-library/react-native';
import * as Speech from 'expo-speech';

import ReviewSettingsForm from '.';
import { DEFAULT_REVIEW_SETTINGS } from '../../constants/review';

const SAMANTHA = {
  identifier: 'com.apple.voice.compact.en-US.Samantha',
  name: 'Samantha',
  quality: 'Default',
  language: 'en-US',
} as Speech.Voice;
const ZOE = {
  identifier: 'com.apple.voice.premium.en-US.Zoe',
  name: 'Zoe',
  quality: 'Enhanced',
  language: 'en-US',
} as Speech.Voice;

async function renderForm(settings = DEFAULT_REVIEW_SETTINGS) {
  const onChange = jest.fn();
  const screen = await render(
    <ReviewSettingsForm
      settings={settings}
      onChange={onChange}
      voices={[ZOE, SAMANTHA]}
    />,
  );
  return { screen, onChange };
}

describe('ReviewSettingsForm', () => {
  afterEach(() => jest.clearAllMocks());

  it('turns each setting on and off', async () => {
    const { screen, onChange } = await renderForm();

    await fireEvent(
      screen.getByTestId('review-setting-voice'),
      'valueChange',
      false,
    );
    expect(onChange).toHaveBeenLastCalledWith({ voice: false });
    await fireEvent(
      screen.getByTestId('review-setting-showBestMoves'),
      'valueChange',
      true,
    );
    expect(onChange).toHaveBeenLastCalledWith({ showBestMoves: true });
  });

  it('lists the voices, the best chosen until another is', async () => {
    const { screen, onChange } = await renderForm();

    expect(screen.getByTestId(`review-voice-${ZOE.identifier}`)).toBeSelected();
    expect(screen.getByText('Premium · en-US')).toBeTruthy();

    await fireEvent.press(
      screen.getByTestId(`review-voice-${SAMANTHA.identifier}`),
    );
    expect(onChange).toHaveBeenLastCalledWith({ voiceId: SAMANTHA.identifier });
  });

  it('plays a voice to hear it', async () => {
    const { screen } = await renderForm();

    await fireEvent.press(
      screen.getByTestId(`review-voice-hear-${SAMANTHA.identifier}`),
    );

    expect(Speech.speak).toHaveBeenCalledWith(
      expect.stringMatching(/key moments/),
      expect.objectContaining({ voice: SAMANTHA.identifier }),
    );
  });

  it('hides the voices while the voice is off', async () => {
    const { screen } = await renderForm({
      ...DEFAULT_REVIEW_SETTINGS,
      voice: false,
    });

    expect(screen.queryByTestId(`review-voice-${ZOE.identifier}`)).toBeNull();
  });

  it('chooses whose moves to review, and how hard to look', async () => {
    const { screen, onChange } = await renderForm();

    await fireEvent.press(screen.getByTestId('review-as-black'));
    expect(onChange).toHaveBeenLastCalledWith({ reviewAs: 'black' });
    await fireEvent.press(screen.getByTestId('review-strength-deep'));
    expect(onChange).toHaveBeenLastCalledWith({ strength: 'deep' });
  });
});
