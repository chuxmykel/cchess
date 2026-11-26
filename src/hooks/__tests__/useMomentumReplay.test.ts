import { act, renderHook } from '@testing-library/react-native';
import { createAudioPlayer } from 'expo-audio';

import { SOUNDS } from '../../constants/sounds';
import { GameSound } from '../../domain/moveSound';
import { MOMENTUM } from '../../domain/review/thresholds';
import { momentumStepMs, useMomentumReplay } from '../useMomentumReplay';

const playsOf = (sound: GameSound) =>
  jest.mocked(jest.mocked(createAudioPlayer)(SOUNDS[sound]).play).mock.calls
    .length;

// Four moves: the turning point the capture, the third.
const MOVES = [{ san: 'e4' }, { san: 'e5' }, { san: 'Bxf7+' }, { san: 'Kxf7' }];
const STEP = momentumStepMs(MOVES.length + 1);

const advance = (ms: number) => act(async () => jest.advanceTimersByTime(ms));

describe('momentumStepMs', () => {
  it('shares the replay out over the moves, within its limits', () => {
    expect(momentumStepMs(5)).toBe(MOMENTUM.maxStepMs);
    expect(momentumStepMs(20)).toBe(MOMENTUM.replayMs / 20);
    expect(momentumStepMs(500)).toBe(MOMENTUM.minStepMs);
  });
});

describe('useMomentumReplay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it('rests at the end until played, then steps through the game and stops', async () => {
    const { result } = await renderHook(() => useMomentumReplay(MOVES, [2]));
    expect(result.current).toMatchObject({ at: null, isPlaying: false });

    await act(async () => result.current.play());
    expect(result.current).toMatchObject({ at: 0, isPlaying: true });
    await advance(STEP);
    expect(result.current.at).toBe(1);
    await advance(STEP);
    await advance(STEP);
    expect(result.current.at).toBe(3);

    // Held at the turning point a moment longer.
    await advance(STEP);
    expect(result.current.at).toBe(3);
    await advance(MOMENTUM.turnHoldMs);
    expect(result.current.at).toBe(4);

    await advance(STEP);
    expect(result.current).toMatchObject({ at: null, isPlaying: false });
  });

  it('stops when asked', async () => {
    const { result } = await renderHook(() => useMomentumReplay(MOVES, [2]));
    await act(async () => result.current.play());
    await advance(STEP);

    await act(async () => result.current.stop());
    expect(result.current).toMatchObject({ at: null, isPlaying: false });
    await advance(10 * STEP);
    expect(result.current.at).toBeNull();
  });

  it('sounds the turning points it passes, and nothing else', async () => {
    const { result } = await renderHook(() => useMomentumReplay(MOVES, [2]));
    await act(async () => result.current.play());

    for (let i = 0; i < MOVES.length; i++) {
      await advance(STEP + MOMENTUM.turnHoldMs);
    }

    // Bxf7+ is a check; e4, e5 and Kxf7 played no sound.
    expect(playsOf('check')).toBe(1);
    expect(playsOf('move')).toBe(0);
    expect(playsOf('capture')).toBe(0);
  });
});
