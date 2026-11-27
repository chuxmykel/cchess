import type { GameType } from './types';

// Badges, as the server awards them: what a game earned a player - from the
// game itself when it ends, or from its review when that's saved - and the
// milestones of their whole history (games played, a rating line first
// crossed going up). Each award comes with the game that earned it. Here,
// what the app calls them, and how it groups them.
export const GAME_BADGE_KINDS = [
  // How it went.
  'swindle',
  'comeback',
  'heldDraw',
  'neverInDoubt',
  'rollercoaster',
  'endgameGrind',
  'fortress',
  'miniature',
  'marathon',
  // Brilliance and tactics.
  'brilliancy',
  'sacrifice',
  'queenSacrifice',
  'forkFrenzy',
  'underpromotion',
  // Checkmates.
  'smotheredMate',
  'backRankMate',
  'pawnMate',
  'kingsMarch',
  // Accuracy and preparation.
  'clean',
  'flawless',
  'bookWorm',
  // The clock.
  'photoFinish',
  'deepThinker',
  'lightningPrecision',
  // The opponent.
  'giantKiller',
] as const;

export type GameBadgeKind = (typeof GAME_BADGE_KINDS)[number];

export const BADGE_LABELS: Record<GameBadgeKind, string> = {
  swindle: 'Swindle',
  comeback: 'Comeback',
  heldDraw: 'Held the draw',
  neverInDoubt: 'Never in doubt',
  rollercoaster: 'Rollercoaster',
  endgameGrind: 'Endgame grind',
  fortress: 'Fortress',
  miniature: 'Miniature',
  marathon: 'Marathon',
  brilliancy: 'Brilliancy',
  sacrifice: 'Sacrifice that worked',
  queenSacrifice: 'Queen sacrifice',
  forkFrenzy: 'Fork frenzy',
  underpromotion: 'Underpromotion',
  smotheredMate: 'Smothered mate',
  backRankMate: 'Back-rank mate',
  pawnMate: 'Pawn mate',
  kingsMarch: "King's march",
  clean: 'Clean game',
  flawless: 'Flawless',
  bookWorm: 'Book worm',
  photoFinish: 'Photo finish',
  deepThinker: 'Deep thinker',
  lightningPrecision: 'Lightning precision',
  giantKiller: 'Giant killer',
};

export const BADGE_DESCRIPTIONS: Record<GameBadgeKind, string> = {
  swindle: 'All but lost, and you got out of it.',
  comeback: 'Won from a losing position.',
  heldDraw: 'Drew from a losing position.',
  neverInDoubt: 'Never worse after the opening, and won.',
  rollercoaster: 'The lead changed hands three times or more.',
  endgameGrind: 'Won an endgame that began level.',
  fortress: 'Drew a piece or more down.',
  miniature: 'Won in 20 moves or fewer.',
  marathon: 'Won after 60 moves or more.',
  brilliancy: 'Played a brilliant move.',
  sacrifice: 'Gave up material, and won.',
  queenSacrifice: 'Gave up your queen, and won.',
  forkFrenzy: 'Three forks or more in one game.',
  underpromotion: 'Promoted to something other than a queen, and won.',
  smotheredMate: 'Mated with a knight, the king hemmed in by its own pieces.',
  backRankMate: 'Mated on the back rank, the king walled in.',
  pawnMate: 'Mated with a pawn.',
  kingsMarch: "Your king marched into the opponent's half, and you won.",
  clean: 'No mistakes, and played accurately throughout.',
  flawless: 'Not even an inaccuracy, over 25 moves or more.',
  bookWorm: 'Twelve moves or more straight from opening theory.',
  photoFinish: 'Won with under five seconds on the clock.',
  deepThinker: 'Thought a minute or more, and found the best move.',
  lightningPrecision: 'Played accurately in a bullet game.',
  giantKiller: 'Beat a player rated 200 or more above you.',
};

// The badges by what they're for, for a screen of them all.
export const BADGE_GROUPS: { title: string; kinds: GameBadgeKind[] }[] = [
  {
    title: 'How the game went',
    kinds: [
      'swindle',
      'comeback',
      'heldDraw',
      'neverInDoubt',
      'rollercoaster',
      'endgameGrind',
      'fortress',
      'miniature',
      'marathon',
    ],
  },
  {
    title: 'Brilliance and tactics',
    kinds: [
      'brilliancy',
      'sacrifice',
      'queenSacrifice',
      'forkFrenzy',
      'underpromotion',
    ],
  },
  {
    title: 'Checkmates',
    kinds: ['smotheredMate', 'backRankMate', 'pawnMate', 'kingsMarch'],
  },
  { title: 'Accuracy', kinds: ['clean', 'flawless', 'bookWorm'] },
  {
    title: 'The clock',
    kinds: ['photoFinish', 'deepThinker', 'lightningPrecision'],
  },
  { title: 'The opponent', kinds: ['giantKiller'] },
];

export const MILESTONE_KINDS = ['gamesPlayed', 'ratingReached'] as const;
export type MilestoneKind = (typeof MILESTONE_KINDS)[number];
export type BadgeKind = GameBadgeKind | MilestoneKind;

/** The game a badge was earned in, from its player's side. */
export type BadgeGame = {
  gameId: string;
  opponentUsername: string;
  opponentDisplayName: string;
  result: 'win' | 'loss' | 'draw' | null;
  endedAt: string | null;
};

/** One award: a badge earned, once - in a game, or a milestone. */
export type Badge = {
  id: string;
  kind: BadgeKind;
  game: BadgeGame | null;
  /** A rating milestone's category. */
  category: GameType | null;
  /** A milestone's number: games played, or the rating crossed. */
  value: number | null;
  awardedAt: string;
};

export const isMilestone = (badge: Badge): boolean =>
  badge.kind === 'gamesPlayed' || badge.kind === 'ratingReached';

const CATEGORY_LABELS: Record<GameType, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  classical: 'Classical',
  daily: 'Daily',
};

/** What a badge is called: a game badge's name, or a milestone's - "100
 * games", "Blitz 1600". */
export function badgeLabel(
  badge: Pick<Badge, 'kind' | 'category' | 'value'>,
): string {
  if (badge.kind === 'gamesPlayed') {
    return `${(badge.value ?? 0).toLocaleString('en')} games`;
  }
  if (badge.kind === 'ratingReached') {
    return `${badge.category ? CATEGORY_LABELS[badge.category] : ''} ${badge.value}`.trim();
  }
  return BADGE_LABELS[badge.kind];
}

export function badgeDescription(
  badge: Pick<Badge, 'kind' | 'category' | 'value'>,
): string {
  if (badge.kind === 'gamesPlayed') {
    return `Finished ${(badge.value ?? 0).toLocaleString('en')} games.`;
  }
  if (badge.kind === 'ratingReached') {
    const category = badge.category
      ? CATEGORY_LABELS[badge.category].toLowerCase()
      : '';
    return `Rated ${badge.value} in ${category} for the first time.`;
  }
  return BADGE_DESCRIPTIONS[badge.kind];
}

/** Each game badge's awards, the newest first. */
export function awardsByKind(
  badges: Badge[],
): Partial<Record<GameBadgeKind, Badge[]>> {
  const byKind: Partial<Record<GameBadgeKind, Badge[]>> = {};
  for (const badge of badges) {
    if (isMilestone(badge)) continue;
    const kind = badge.kind as GameBadgeKind;
    (byKind[kind] ??= []).push(badge);
  }
  for (const awards of Object.values(byKind)) {
    awards?.sort((a, b) => b.awardedAt.localeCompare(a.awardedAt));
  }
  return byKind;
}

/** The milestones, the newest first. */
export function milestonesOf(badges: Badge[]): Badge[] {
  return badges
    .filter(isMilestone)
    .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt));
}

/** The next games-played milestone to reach. */
export function nextGamesMilestone(badges: Badge[]): number {
  const reached = badges.filter((b) => b.kind === 'gamesPlayed').length;
  return 10 ** (reached + 1);
}

/** How many badges were earned: each game badge once, each milestone. */
export function earnedCount(badges: Badge[]): number {
  return Object.keys(awardsByKind(badges)).length + milestonesOf(badges).length;
}

/** A badge as shown: one game badge with every time it was earned, or one
 * milestone - or one not earned yet, its awards none. */
export type BadgeTile = {
  key: string;
  kind: BadgeKind;
  category: GameType | null;
  value: number | null;
  // The newest first.
  awards: Badge[];
};

const milestoneTile = (badge: Badge): BadgeTile => ({
  key: `${badge.kind}:${badge.category ?? ''}:${badge.value}`,
  kind: badge.kind,
  category: badge.category,
  value: badge.value,
  awards: [badge],
});

/** The badges earned: the game badges earned most first, then the
 * milestones, newest first. */
export function earnedTiles(badges: Badge[]): BadgeTile[] {
  const byKind = awardsByKind(badges);
  const games = (Object.keys(byKind) as GameBadgeKind[])
    .map((kind) => ({
      key: kind,
      kind,
      category: null,
      value: null,
      awards: byKind[kind] ?? [],
    }))
    .sort((a, b) => b.awards.length - a.awards.length);
  return [...games, ...milestonesOf(badges).map(milestoneTile)];
}

/** Every badge there is, in its group: the milestones reached and the next
 * games one to reach, then each group's game badges, earned or not. */
export function allTiles(
  badges: Badge[],
): { title: string; tiles: BadgeTile[] }[] {
  const byKind = awardsByKind(badges);
  const milestones = milestonesOf(badges)
    .sort((a, b) =>
      a.kind !== b.kind
        ? a.kind === 'gamesPlayed'
          ? -1
          : 1
        : (a.category ?? '').localeCompare(b.category ?? '') ||
          (a.value ?? 0) - (b.value ?? 0),
    )
    .map(milestoneTile);
  const next = nextGamesMilestone(badges);
  return [
    {
      title: 'Milestones',
      tiles: [
        ...milestones,
        {
          key: `gamesPlayed::${next}`,
          kind: 'gamesPlayed',
          category: null,
          value: next,
          awards: [],
        },
      ],
    },
    ...BADGE_GROUPS.map((group) => ({
      title: group.title,
      tiles: group.kinds.map((kind) => ({
        key: kind,
        kind,
        category: null,
        value: null,
        awards: byKind[kind] ?? [],
      })),
    })),
  ];
}
