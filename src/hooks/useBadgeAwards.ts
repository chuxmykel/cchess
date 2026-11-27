import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import type { Badge, BadgeTile } from '../domain/badges';
import { claimBadge, getBadges } from '../network/restClient';

export type BadgeAwards = {
  // The badge to announce now, with every time it was earned - null when
  // there's none, or while held.
  shown: BadgeTile | null;
  claim: () => void;
  // Put it away unclaimed: it's shown again the next time the app starts.
  later: () => void;
};

const isMilestone = (badge: Badge) => badge.value !== null;

// The card for the next badge waiting: a milestone on its own; a game
// badge with every time it was earned, the newest first - all those waiting
// announced, and claimed, together.
function tileOf(next: Badge, queue: Badge[], all: Badge[]): BadgeTile {
  if (isMilestone(next)) {
    return {
      key: next.id,
      kind: next.kind,
      category: next.category,
      value: next.value,
      awards: [next],
    };
  }
  const waiting = queue.filter((b) => b.kind === next.kind);
  const before = all.filter(
    (b) => b.kind === next.kind && !waiting.some((w) => w.id === b.id),
  );
  return {
    key: next.id,
    kind: next.kind,
    category: null,
    value: null,
    awards: [...waiting].reverse().concat(before),
  };
}

// Those a card announces: a milestone, or every one of a game badge's
// waiting.
const announcedBy = (next: Badge, queue: Badge[]) =>
  isMilestone(next) ? [next] : queue.filter((b) => b.kind === next.kind);

// Badges announced as they're earned: those the server tells of at once
// (`badge:awarded`), and those not claimed yet when the app starts - one at
// a time, oldest first, while not held (in a game).
export function useBadgeAwards(held: boolean): BadgeAwards {
  const session = useAuthSession();
  const { authorized } = session;
  const username = session.isReady ? session.user.username : null;
  const socket = session.isReady ? session.socket : null;
  const [all, setAll] = useState<Badge[]>([]);
  const [queue, setQueue] = useState<Badge[]>([]);

  useEffect(() => {
    if (!username) return;
    let current = true;
    authorized((token) => getBadges(username, token))
      .then((badges) => {
        if (!current) return;
        setAll(badges);
        setQueue(badges.filter((b) => !b.claimedAt).reverse());
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [authorized, username]);

  useEffect(() => {
    if (!socket) return;
    const onAwarded = ({ badges }: { badges: Badge[] }) => {
      setAll((current) => [...badges, ...current]);
      setQueue((current) => [
        ...current,
        ...badges.filter((b) => !current.some((q) => q.id === b.id)),
      ]);
    };
    socket.on('badge:awarded', onAwarded);
    return () => {
      socket.off('badge:awarded', onAwarded);
    };
  }, [socket]);

  const next = queue[0] ?? null;
  const done = useCallback(() => {
    setQueue((current) => {
      if (current.length === 0) return current;
      const announced = announcedBy(current[0], current);
      return current.filter((b) => !announced.includes(b));
    });
  }, []);
  const claim = useCallback(() => {
    if (!next) return;
    const ids = announcedBy(next, queue).map((b) => b.id);
    done();
    for (const id of ids) {
      authorized((token) => claimBadge(id, token)).catch(() => {});
    }
  }, [next, queue, done, authorized]);

  return {
    shown: next && !held ? tileOf(next, queue, all) : null,
    claim,
    later: done,
  };
}
