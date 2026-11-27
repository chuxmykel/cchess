import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import BadgeCard from '../components/BadgeCard';
import { useBadgeAwards } from '../hooks/useBadgeAwards';

type BadgeAwardsHold = { hold: () => () => void };

const BadgeAwardsContext = createContext<BadgeAwardsHold | null>(null);

// Announces badges as they're earned, with a card to claim each (see
// useBadgeAwards) - mounted in HomeStack, so it's heard anywhere in the
// app. A screen holds the cards back while it's open (a game being
// played): useHoldBadgeCards.
export function BadgeAwardsProvider({
  onOpenGame,
  children,
}: {
  onOpenGame: (gameId: string) => void;
  children: ReactNode;
}) {
  const [holds, setHolds] = useState(0);
  const { shown, claim, later } = useBadgeAwards(holds > 0);
  const hold = useCallback(() => {
    setHolds((count) => count + 1);
    return () => setHolds((count) => count - 1);
  }, []);
  const value = useMemo(() => ({ hold }), [hold]);

  return (
    <BadgeAwardsContext.Provider value={value}>
      {children}
      <BadgeCard
        tile={shown}
        isNew
        onClaim={claim}
        onOpenGame={(gameId) => {
          later();
          onOpenGame(gameId);
        }}
        onClose={later}
      />
    </BadgeAwardsContext.Provider>
  );
}

/** Holds the badge cards back while the screen is open - a game, left
 * when it's done. */
export function useHoldBadgeCards(): void {
  const context = useContext(BadgeAwardsContext);
  useEffect(() => (context ? context.hold() : undefined), [context]);
}
