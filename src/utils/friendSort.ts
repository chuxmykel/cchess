import { UserFriend } from '../network/restClient';
import { byPresence } from './presence';

export type FriendSort = 'online' | 'alphabetical' | 'recent';

export const FRIEND_SORTS: { key: FriendSort; label: string }[] = [
  { key: 'online', label: 'Online first' },
  { key: 'alphabetical', label: 'Name (A–Z)' },
  { key: 'recent', label: 'Recently added' },
];

/** Online, or playing - which needs them online. */
export function isAround(friend: UserFriend): boolean {
  return friend.online || friend.playingGameId !== null;
}

function byName(a: UserFriend, b: UserFriend): number {
  return a.displayName.localeCompare(b.displayName, undefined, {
    sensitivity: 'base',
  });
}

const COMPARATORS: Record<
  FriendSort,
  (a: UserFriend, b: UserFriend) => number
> = {
  // Playing, then online, then the most recently active; ties by name.
  online: (a, b) => byPresence(a, b) || byName(a, b),
  alphabetical: byName,
  recent: (a, b) => b.friendsSince.localeCompare(a.friendsSince),
};

/** A copy of the friends in the given order. */
export function sortFriends(
  friends: UserFriend[],
  sort: FriendSort,
): UserFriend[] {
  return [...friends].sort(COMPARATORS[sort]);
}
