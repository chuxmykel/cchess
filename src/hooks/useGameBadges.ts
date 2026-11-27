import { useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import type { Badge } from '../domain/badges';
import { getBadges } from '../network/restClient';

const NO_BADGES: Badge[] = [];

// The badges a finished game earned you, for its result card: those
// already awarded when it's shown (a game opened after it ended), and those
// the server pushes as it awards them (`badge:awarded`), the moment the game
// ends. None until it's over.
export function useGameBadges(gameId: string | null, isOver: boolean): Badge[] {
  const session = useAuthSession();
  const { authorized } = session;
  const username = session.isReady ? session.user.username : null;
  const socket = session.isReady ? session.socket : null;
  const [earned, setEarned] = useState<{ gameId: string; badges: Badge[] }>({
    gameId: '',
    badges: [],
  });
  const forGame = (badges: Badge[]) =>
    badges.filter((badge) => badge.game?.gameId === gameId);

  useEffect(() => {
    if (!gameId || !socket) return;
    const onAwarded = ({ badges }: { badges: Badge[] }) => {
      const mine = badges.filter((badge) => badge.game?.gameId === gameId);
      if (mine.length === 0) return;
      setEarned((current) => ({
        gameId,
        badges: [
          ...(current.gameId === gameId ? current.badges : []),
          ...mine.filter((b) => !current.badges.some((c) => c.id === b.id)),
        ],
      }));
    };
    socket.on('badge:awarded', onAwarded);
    return () => {
      socket.off('badge:awarded', onAwarded);
    };
  }, [socket, gameId]);

  useEffect(() => {
    if (!gameId || !isOver || !username) return;
    let current = true;
    authorized((token) => getBadges(username, token))
      .then((badges) => {
        if (!current) return;
        const mine = badges.filter((badge) => badge.game?.gameId === gameId);
        setEarned((shown) => ({
          gameId,
          badges: [
            ...mine,
            ...(shown.gameId === gameId ? shown.badges : []).filter(
              (b) => !mine.some((m) => m.id === b.id),
            ),
          ],
        }));
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [authorized, username, gameId, isOver]);

  if (!isOver || earned.gameId !== gameId) return NO_BADGES;
  return forGame(earned.badges);
}
