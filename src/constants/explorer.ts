// The opening explorer's databases and filters, mirroring the server's
// (cchess-be's src/explorer): lichess's Masters and Lichess, and one
// player's games here.
export type ExplorerDb = 'masters' | 'lichess' | 'player';

export const EXPLORER_DBS: ExplorerDb[] = ['masters', 'lichess', 'player'];

export const EXPLORER_DB_LABELS: Record<ExplorerDb, string> = {
  masters: 'Masters',
  lichess: 'Lichess',
  player: 'Player',
};

export const LICHESS_SPEEDS = [
  'ultraBullet',
  'bullet',
  'blitz',
  'rapid',
  'classical',
  'correspondence',
] as const;
export type LichessSpeed = (typeof LICHESS_SPEEDS)[number];

export const LICHESS_SPEED_LABELS: Record<LichessSpeed, string> = {
  ultraBullet: 'UltraBullet',
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  classical: 'Classical',
  correspondence: 'Correspondence',
};

/** Each band is the ratings from it up to the next. */
export const LICHESS_RATINGS = [
  400, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500,
] as const;
export type LichessRating = (typeof LICHESS_RATINGS)[number];

/** The player whose games the Player database is - null for you. */
export type ExplorerPlayer = { id: string; username: string };

export type ExplorerSettings = {
  db: ExplorerDb;
  /** The Lichess database's filters, as lichess's own explorer has them. */
  speeds: LichessSpeed[];
  ratings: LichessRating[];
  player: ExplorerPlayer | null;
  /** The side the player played. */
  color: 'white' | 'black';
};

/** Lichess's own explorer's defaults - the only filters the server keeps
 * answers for, so the quickest. */
export const DEFAULT_EXPLORER_SETTINGS: ExplorerSettings = {
  db: 'lichess',
  speeds: ['blitz', 'rapid', 'classical'],
  ratings: [1600, 1800, 2000, 2200, 2500],
  player: null,
  color: 'white',
};

/** How long a position's held before it's asked about - stepping quickly
 * through a line asks only where it stops. */
export const EXPLORER_FETCH_DELAY_MS = 300;
