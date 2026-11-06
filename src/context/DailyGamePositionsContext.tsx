import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react';

import {
  DailyGamePosition,
  DailyGamePositions,
  useDailyGamePositions,
} from '../hooks/useDailyGamePositions';

const DailyGamePositionsContext = createContext<DailyGamePositions | null>(
  null,
);

// The daily games open on screen, as their game screens have them: the
// analysis board over one reads its game from here.
export const DailyGamePositionsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const positions = useDailyGamePositions();
  return (
    <DailyGamePositionsContext.Provider value={positions}>
      {children}
    </DailyGamePositionsContext.Provider>
  );
};

const NO_POSITIONS: DailyGamePositions = {
  get: () => null,
  set: () => {},
  remove: () => {},
  subscribe: () => () => {},
};

function usePositions(): DailyGamePositions {
  return useContext(DailyGamePositionsContext) ?? NO_POSITIONS;
}

/** Keeps a daily game's position here while its screen is open. */
export function usePublishDailyGamePosition(
  gameId: string,
  position: DailyGamePosition,
): void {
  const positions = usePositions();
  const { white, black, myColor, fen, moves, status } = position;
  useEffect(() => {
    positions.set(gameId, { white, black, myColor, fen, moves, status });
  }, [positions, gameId, white, black, myColor, fen, moves, status]);
  useEffect(() => () => positions.remove(gameId), [positions, gameId]);
}

/** A daily game as its open screen has it - null with none open. */
export function useDailyGamePosition(gameId: string): DailyGamePosition | null {
  const positions = usePositions();
  return useSyncExternalStore(positions.subscribe, () => positions.get(gameId));
}
