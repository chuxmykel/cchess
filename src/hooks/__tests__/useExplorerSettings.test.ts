import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { explorerQuery, useExplorerSettings } from '../useExplorerSettings';
import { DEFAULT_EXPLORER_SETTINGS } from '../../constants/explorer';

describe('useExplorerSettings', () => {
  beforeEach(() => AsyncStorage.clear());

  it('starts with the Lichess database and its defaults when nothing is saved', async () => {
    const { result } = await renderHook(() => useExplorerSettings());
    await act(async () => {});

    expect(result.current.loaded).toBe(true);
    expect(result.current.settings).toEqual(DEFAULT_EXPLORER_SETTINGS);
    expect(result.current.settings.db).toBe('lichess');
  });

  it('saves each change, and loads it next time', async () => {
    const first = await renderHook(() => useExplorerSettings());
    await act(async () => {});
    await act(async () =>
      first.result.current.update({
        db: 'player',
        player: { id: 'user-2', username: 'judy' },
        color: 'black',
      }),
    );
    await act(async () => first.result.current.update({ speeds: ['bullet'] }));

    const again = await renderHook(() => useExplorerSettings());
    await act(async () => {});

    expect(again.result.current.settings).toEqual({
      ...DEFAULT_EXPLORER_SETTINGS,
      db: 'player',
      speeds: ['bullet'],
      player: { id: 'user-2', username: 'judy' },
      color: 'black',
    });
  });

  it('falls back to the default for a value no longer offered', async () => {
    await AsyncStorage.setItem(
      'cchess.explorerSettings',
      JSON.stringify({
        db: 'chessbase',
        speeds: ['warp'],
        ratings: [1500, 2000],
        player: { id: 7 },
        color: 'red',
      }),
    );
    const { result } = await renderHook(() => useExplorerSettings());
    await act(async () => {});

    expect(result.current.settings).toEqual({
      ...DEFAULT_EXPLORER_SETTINGS,
      ratings: [2000],
    });
  });
});

describe('explorerQuery', () => {
  it('asks Masters, or Lichess with its filters', () => {
    expect(
      explorerQuery({ ...DEFAULT_EXPLORER_SETTINGS, db: 'masters' }, 'me'),
    ).toEqual({ db: 'masters' });
    expect(explorerQuery(DEFAULT_EXPLORER_SETTINGS, 'me')).toEqual({
      db: 'lichess',
      speeds: DEFAULT_EXPLORER_SETTINGS.speeds,
      ratings: DEFAULT_EXPLORER_SETTINGS.ratings,
    });
  });

  it('asks about your games, or the player picked, from their side', () => {
    const player = { ...DEFAULT_EXPLORER_SETTINGS, db: 'player' as const };
    expect(explorerQuery(player, 'me')).toEqual({
      db: 'player',
      user: 'me',
      color: 'white',
    });
    expect(
      explorerQuery(
        {
          ...player,
          player: { id: 'judy-id', username: 'judy' },
          color: 'black',
        },
        'me',
      ),
    ).toEqual({ db: 'player', user: 'judy-id', color: 'black' });
    expect(explorerQuery(player, null)).toBeNull();
  });
});
