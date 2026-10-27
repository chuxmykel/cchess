import { act, fireEvent, render } from '@testing-library/react-native';

import ChallengeCard from '.';
import { makeChallenge } from '../../testUtils/social';

const NOW = new Date('2026-10-27T10:00:00.000Z');

describe('ChallengeCard', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const challenge = makeChallenge({
    expiresAt: new Date(NOW.getTime() + 90_000).toISOString(),
  });

  it('describes an incoming challenge and answers it', async () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();
    const screen = await render(
      <ChallengeCard
        challenge={challenge}
        direction="incoming"
        onAccept={onAccept}
        onDecline={onDecline}
      />,
    );
    await act(() => jest.advanceTimersByTime(0));

    expect(screen.getByText('Judit Polgar challenges you')).toBeTruthy();
    expect(screen.getByText('5+0 • Rated • 90s')).toBeTruthy();
    await fireEvent.press(
      screen.getByTestId(`accept-challenge-${challenge.id}`),
    );
    await fireEvent.press(
      screen.getByTestId(`decline-challenge-${challenge.id}`),
    );
    expect(onAccept).toHaveBeenCalled();
    expect(onDecline).toHaveBeenCalled();
  });

  it('lets me cancel a challenge I sent', async () => {
    const onCancel = jest.fn();
    const screen = await render(
      <ChallengeCard
        challenge={challenge}
        direction="outgoing"
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText('Waiting for Me')).toBeTruthy();
    await fireEvent.press(
      screen.getByTestId(`cancel-challenge-${challenge.id}`),
    );
    expect(onCancel).toHaveBeenCalled();
  });

  it('disappears once the challenge expires', async () => {
    const screen = await render(
      <ChallengeCard
        challenge={challenge}
        direction="outgoing"
        onCancel={jest.fn()}
      />,
    );

    await act(() => jest.advanceTimersByTime(91_000));

    expect(screen.queryByTestId(`challenge-card-${challenge.id}`)).toBeNull();
  });
});
