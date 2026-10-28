import { isAround, sortFriends } from '../friendSort';
import { makeUserFriend } from '../../testUtils/social';

describe('sortFriends', () => {
  const zoe = makeUserFriend({
    id: 'zoe',
    displayName: 'Zoe',
    online: true,
    friendsSince: '2026-01-01T00:00:00.000Z',
  });
  const adam = makeUserFriend({
    id: 'adam',
    displayName: 'adam',
    lastSeenAt: '2026-10-01T00:00:00.000Z',
    friendsSince: '2026-10-01T00:00:00.000Z',
  });
  const mia = makeUserFriend({
    id: 'mia',
    displayName: 'Mia',
    playingGameId: 'game-1',
    friendsSince: '2026-05-01T00:00:00.000Z',
  });
  const ids = (friends: { id: string }[]) => friends.map((f) => f.id);

  it('puts players and online friends first', () => {
    expect(ids(sortFriends([adam, zoe, mia], 'online'))).toEqual([
      'mia',
      'zoe',
      'adam',
    ]);
  });

  it('sorts by name, ignoring case', () => {
    expect(ids(sortFriends([zoe, mia, adam], 'alphabetical'))).toEqual([
      'adam',
      'mia',
      'zoe',
    ]);
  });

  it('puts the most recently added first', () => {
    expect(ids(sortFriends([zoe, mia, adam], 'recent'))).toEqual([
      'adam',
      'mia',
      'zoe',
    ]);
  });

  it('leaves the list it was given alone', () => {
    const friends = [zoe, adam];
    sortFriends(friends, 'alphabetical');
    expect(ids(friends)).toEqual(['zoe', 'adam']);
  });
});

describe('isAround', () => {
  it('counts friends who are online or playing', () => {
    expect(isAround(makeUserFriend({ online: true }))).toBe(true);
    expect(isAround(makeUserFriend({ playingGameId: 'game-1' }))).toBe(true);
    expect(isAround(makeUserFriend())).toBe(false);
  });
});
