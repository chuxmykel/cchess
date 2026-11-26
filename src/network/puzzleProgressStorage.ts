import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PoolPuzzle } from './restClient';

const UNFINISHED_KEY = 'cchess.unfinishedPuzzles';

// The pool puzzle each player was last given and hasn't finished, by the
// theme it was asked for ('' for any): Start, or the theme again, brings
// it back - after leaving the puzzle, or the app. Gone once it's solved or
// missed.
type Unfinished = Record<string, PoolPuzzle>;

const keyOf = (userId: string, theme: string | undefined) =>
  `${userId}:${theme ?? ''}`;

async function load(): Promise<Unfinished> {
  try {
    const saved = await AsyncStorage.getItem(UNFINISHED_KEY);
    return saved ? (JSON.parse(saved) as Unfinished) : {};
  } catch {
    return {};
  }
}

async function save(unfinished: Unfinished): Promise<void> {
  try {
    await AsyncStorage.setItem(UNFINISHED_KEY, JSON.stringify(unfinished));
  } catch {
    // Not kept: the next Start gets a new puzzle, as it would anyway.
  }
}

export async function loadUnfinishedPuzzle(
  userId: string,
  theme: string | undefined,
): Promise<PoolPuzzle | null> {
  return (await load())[keyOf(userId, theme)] ?? null;
}

export async function saveUnfinishedPuzzle(
  userId: string,
  theme: string | undefined,
  puzzle: PoolPuzzle,
): Promise<void> {
  await save({ ...(await load()), [keyOf(userId, theme)]: puzzle });
}

// A puzzle finished - under whichever theme it was kept.
export async function clearUnfinishedPuzzle(
  userId: string,
  puzzleId: string,
): Promise<void> {
  const unfinished = await load();
  const kept = Object.fromEntries(
    Object.entries(unfinished).filter(
      ([key, puzzle]) =>
        !(key.startsWith(`${userId}:`) && puzzle.id === puzzleId),
    ),
  );
  await save(kept);
}
