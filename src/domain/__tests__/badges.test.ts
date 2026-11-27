import {
  allTiles,
  badgeDescription,
  badgeLabel,
  earnedCount,
  earnedTiles,
  nextGamesMilestone,
} from '../badges';
import { makeBadge } from '../../testUtils/badges';

const games = (value: number, id = `g${value}`) =>
  makeBadge({ id, kind: 'gamesPlayed', value, game: null });

describe('badges', () => {
  it('names game badges and milestones', () => {
    expect(badgeLabel(makeBadge())).toBe('Comeback');
    expect(badgeLabel(games(1000))).toBe('1,000 games');
    expect(
      badgeLabel(
        makeBadge({ kind: 'ratingReached', category: 'blitz', value: 1600 }),
      ),
    ).toBe('Blitz 1600');
    expect(
      badgeDescription(
        makeBadge({ kind: 'ratingReached', category: 'rapid', value: 1700 }),
      ),
    ).toBe('Rated 1700 in rapid for the first time.');
  });

  it('shows the earned: game badges by how often, then milestones newest first', () => {
    const badges = [
      makeBadge({ id: 'a', kind: 'clean' }),
      makeBadge({ id: 'b', awardedAt: '2026-11-06T00:00:00.000Z' }),
      makeBadge({ id: 'c' }),
      games(10),
      { ...games(100), awardedAt: '2026-11-07T00:00:00.000Z' },
    ];

    const tiles = earnedTiles(badges);
    expect(tiles.map((t) => [t.kind, t.awards.length])).toEqual([
      ['comeback', 2],
      ['clean', 1],
      ['gamesPlayed', 1],
      ['gamesPlayed', 1],
    ]);
    expect(tiles[0].awards.map((b) => b.id)).toEqual(['b', 'c']);
    expect(tiles[2].value).toBe(100);
    expect(earnedCount(badges)).toBe(4);
  });

  it('lays out every badge in its group, with the next games milestone', () => {
    const groups = allTiles([games(10), makeBadge()]);

    expect(groups[0].title).toBe('Milestones');
    expect(groups[0].tiles.map((t) => [t.value, t.awards.length])).toEqual([
      [10, 1],
      [100, 0],
    ]);
    const all = groups.slice(1).flatMap((g) => g.tiles);
    expect(all).toHaveLength(25);
    expect(all.find((t) => t.kind === 'comeback')?.awards).toHaveLength(1);
    expect(all.find((t) => t.kind === 'swindle')?.awards).toEqual([]);
    expect(nextGamesMilestone([])).toBe(10);
  });
});
