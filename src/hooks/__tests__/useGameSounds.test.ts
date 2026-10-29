import { act, renderHook } from '@testing-library/react-native';
import { createAudioPlayer } from 'expo-audio';

import { SOUNDS } from '../../constants/sounds';
import { GameSound } from '../../domain/moveSound';
import {
  useGameOverSound,
  useGameStartSound,
  useMoveNavigationSounds,
  useMoveSounds,
} from '../useGameSounds';

function playerFor(sound: GameSound) {
  return jest.mocked(createAudioPlayer)(SOUNDS[sound]);
}

function playsOf(sound: GameSound): number {
  return jest.mocked(playerFor(sound).play).mock.calls.length;
}

describe('useMoveSounds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stays quiet until a move is played', async () => {
    await renderHook(() => useMoveSounds(null));

    (['move', 'capture', 'castle', 'check', 'checkmate'] as const).forEach(
      (sound) => expect(playsOf(sound)).toBe(0),
    );
  });

  it("plays each move's own sound, from the start", async () => {
    const { rerender } = await renderHook(
      ({ move }: { move: { san: string } }) => useMoveSounds(move),
      { initialProps: { move: { san: 'e4' } } },
    );
    expect(playsOf('move')).toBe(1);
    expect(playerFor('move').seekTo).toHaveBeenCalledWith(0);

    await rerender({ move: { san: 'exd5' } });
    expect(playsOf('capture')).toBe(1);

    await rerender({ move: { san: 'O-O' } });
    expect(playsOf('castle')).toBe(1);

    await rerender({ move: { san: 'Bb5+' } });
    expect(playsOf('check')).toBe(1);

    await rerender({ move: { san: 'Qh5#' } });
    expect(playsOf('checkmate')).toBe(1);
    expect(playsOf('move')).toBe(1);
  });

  it('plays only once rewound - played before, it would start at its end', async () => {
    let rewound: () => void;
    jest
      .mocked(playerFor('move').seekTo)
      .mockReturnValueOnce(new Promise((resolve) => (rewound = resolve)));

    await renderHook(() => useMoveSounds({ san: 'e4' }));
    expect(playsOf('move')).toBe(0);

    await act(async () => rewound());
    expect(playsOf('move')).toBe(1);
  });

  it('plays again for a new move that sounds the same', async () => {
    const { rerender } = await renderHook(
      ({ move }: { move: { san: string } }) => useMoveSounds(move),
      { initialProps: { move: { san: 'e4' } } },
    );

    await rerender({ move: { san: 'e5' } });

    expect(playsOf('move')).toBe(2);
  });

  it('does not replay a move on a re-render', async () => {
    const move = { san: 'e4' };
    const { rerender } = await renderHook(() => useMoveSounds(move));

    await rerender({});

    expect(playsOf('move')).toBe(1);
  });
});

describe('useMoveNavigationSounds', () => {
  const moves = ['e4', 'd5', 'exd5', 'Qxd5'].map((san) => ({ san }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function renderNavigation(soundsNewMoves: boolean) {
    return renderHook(
      ({ shownMoves, ply }: { shownMoves: { san: string }[]; ply: number }) =>
        useMoveNavigationSounds(shownMoves, ply, soundsNewMoves),
      { initialProps: { shownMoves: moves, ply: 4 } },
    );
  }

  it('is quiet on opening a game', async () => {
    await renderNavigation(true);

    expect(playsOf('move')).toBe(0);
    expect(playsOf('capture')).toBe(0);
  });

  it('slides back with a move sound, and forward with the move landed on', async () => {
    const { rerender } = await renderNavigation(false);

    await rerender({ shownMoves: moves, ply: 2 });
    expect(playsOf('move')).toBe(1);

    await rerender({ shownMoves: moves, ply: 3 });
    expect(playsOf('capture')).toBe(1);
  });

  it('sounds a move just played only when asked to', async () => {
    const played = [...moves, { san: 'Nc3' }];
    const watched = await renderNavigation(true);
    await watched.rerender({ shownMoves: played, ply: 5 });
    expect(playsOf('move')).toBe(1);

    jest.clearAllMocks();
    const playing = await renderNavigation(false);
    await playing.rerender({ shownMoves: played, ply: 5 });
    expect(playsOf('move')).toBe(0);
  });

  it('is quiet when another game takes over, as a rematch starts', async () => {
    const { rerender } = await renderNavigation(true);

    await rerender({ shownMoves: [], ply: 0 });

    expect(playsOf('move')).toBe(0);
  });
});

describe('useGameStartSound', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sounds a new game starting, once', async () => {
    const { rerender } = await renderHook(() => useGameStartSound(true));
    await rerender({});

    expect(playsOf('game-start')).toBe(1);
  });

  it('is quiet reopening a game already under way', async () => {
    await renderHook(() => useGameStartSound(false));

    expect(playsOf('game-start')).toBe(0);
  });
});

describe('useGameOverSound', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function renderGame(isOver: boolean) {
    return renderHook(
      ({ over, reason }: { over: boolean; reason: string | null }) =>
        useGameOverSound(over, reason),
      { initialProps: { over: isOver, reason: null } },
    );
  }

  it.each(['resignation', 'timeout', 'stalemate', 'draw-agreement', 'abort'])(
    'sounds a game ending by %s',
    async (reason) => {
      const { rerender } = await renderGame(false);

      await rerender({ over: true, reason });
      await rerender({ over: true, reason });

      expect(playsOf('game-end')).toBe(1);
    },
  );

  it('leaves a mate to its move', async () => {
    const { rerender } = await renderGame(false);

    await rerender({ over: true, reason: 'checkmate' });

    expect(playsOf('game-end')).toBe(0);
  });

  it('is quiet opening a game already over', async () => {
    await renderGame(true);

    expect(playsOf('game-end')).toBe(0);
  });
});
