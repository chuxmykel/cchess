import { formatDistanceToNowStrict, min } from 'date-fns';

type Presence = {
  online: boolean;
  playingGameId: string | null;
  lastSeenAt: string | null;
};

const JUST_NOW_MS = 60_000;

/** "Playing right now", "Online", "Active 5 minutes ago" or "Offline". */
export function presenceLabel(presence: Presence): string {
  if (presence.playingGameId) return 'Playing right now';
  if (presence.online) return 'Online';
  if (!presence.lastSeenAt) return 'Offline';
  const lastSeen = min([presence.lastSeenAt, Date.now()]);
  if (Date.now() - lastSeen.getTime() < JUST_NOW_MS) return 'Active just now';
  return `Active ${formatDistanceToNowStrict(lastSeen, { addSuffix: true })}`;
}

function presenceRank(presence: Presence): number {
  if (presence.playingGameId) return 0;
  return presence.online ? 1 : 2;
}

/** Playing first, then online, then the most recently active. */
export function byPresence<T extends Presence>(a: T, b: T): number {
  return (
    presenceRank(a) - presenceRank(b) ||
    (b.lastSeenAt ?? '').localeCompare(a.lastSeenAt ?? '')
  );
}
