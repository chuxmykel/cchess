import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_EXPLORER_SETTINGS,
  EXPLORER_DBS,
  ExplorerPlayer,
  ExplorerSettings,
  LICHESS_RATINGS,
  LICHESS_SPEEDS,
} from '../constants/explorer';

const EXPLORER_SETTINGS_KEY = 'cchess.explorerSettings';

// Those of `saved` still offered, or - none left - the default.
function offered<T>(saved: unknown, choices: readonly T[], fallback: T[]): T[] {
  const kept = Array.isArray(saved)
    ? choices.filter((choice) => saved.includes(choice))
    : [];
  return kept.length > 0 ? kept : fallback;
}

function isPlayer(saved: unknown): saved is ExplorerPlayer {
  const player = saved as ExplorerPlayer | null;
  return typeof player?.id === 'string' && typeof player?.username === 'string';
}

// The explorer's settings as last saved, over the defaults - so one no
// longer offered falls back to its default. The defaults alone if
// nothing's saved, or it can't be read.
export async function loadExplorerSettings(): Promise<ExplorerSettings> {
  try {
    const saved = await AsyncStorage.getItem(EXPLORER_SETTINGS_KEY);
    if (!saved) return DEFAULT_EXPLORER_SETTINGS;
    const { db, speeds, ratings, player, color } = JSON.parse(saved);
    return {
      db: EXPLORER_DBS.includes(db) ? db : DEFAULT_EXPLORER_SETTINGS.db,
      speeds: offered(speeds, LICHESS_SPEEDS, DEFAULT_EXPLORER_SETTINGS.speeds),
      ratings: offered(
        ratings,
        LICHESS_RATINGS,
        DEFAULT_EXPLORER_SETTINGS.ratings,
      ),
      player: isPlayer(player)
        ? { id: player.id, username: player.username }
        : null,
      color: color === 'black' ? 'black' : 'white',
    };
  } catch {
    return DEFAULT_EXPLORER_SETTINGS;
  }
}

export async function saveExplorerSettings(
  settings: ExplorerSettings,
): Promise<void> {
  await AsyncStorage.setItem(EXPLORER_SETTINGS_KEY, JSON.stringify(settings));
}
