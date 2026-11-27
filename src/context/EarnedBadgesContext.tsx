import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import EarnedBadgesCard from '../components/EarnedBadgesCard';
import type { Badge } from '../domain/badges';

type EarnedBadges = {
  // Holds the card back while a game's screen is open; returns the release.
  hold: () => () => void;
  // Badges a game earned, to show once nothing holds them back.
  add: (badges: Badge[]) => void;
};

const EarnedBadgesContext = createContext<EarnedBadges | null>(null);

// The badges your games earn, shown in a card of their own once you've left
// the game's screen - not over the result card, nor while you're busy
// playing the next. Mounted in HomeStack.
export function EarnedBadgesProvider({
  onSeeAll,
  children,
}: {
  onSeeAll: () => void;
  children: ReactNode;
}) {
  const [holds, setHolds] = useState(0);
  const [earned, setEarned] = useState<Badge[]>([]);
  const hold = useCallback(() => {
    setHolds((count) => count + 1);
    return () => setHolds((count) => count - 1);
  }, []);
  const add = useCallback((badges: Badge[]) => {
    setEarned((current) => {
      const added = badges.filter((b) => !current.some((c) => c.id === b.id));
      return added.length === 0 ? current : [...current, ...added];
    });
  }, []);
  const value = useMemo(() => ({ hold, add }), [hold, add]);
  const close = () => setEarned([]);

  return (
    <EarnedBadgesContext.Provider value={value}>
      {children}
      <EarnedBadgesCard
        badges={holds > 0 ? [] : earned}
        onSeeAll={() => {
          close();
          onSeeAll();
        }}
        onClose={close}
      />
    </EarnedBadgesContext.Provider>
  );
}

/** Holds the earned badges' card back while the screen - a game's - is
 * open. */
export function useHoldEarnedBadges(): void {
  const context = useContext(EarnedBadgesContext);
  useEffect(() => (context ? context.hold() : undefined), [context]);
}

/** Hands a game's badges over, to show once its screen is left. */
export function useReportEarnedBadges(badges: Badge[]): void {
  const context = useContext(EarnedBadgesContext);
  useEffect(() => {
    if (context && badges.length > 0) context.add(badges);
  }, [context, badges]);
}
