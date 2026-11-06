import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';

import DailyAnalysis from '.';
import { AnalysisSettingsProvider } from '../../context/AnalysisSettingsContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  DailyGamePositionsProvider,
  usePublishDailyGamePosition,
} from '../../context/DailyGamePositionsContext';
import { boardTester } from '../../components/Board/boardTester';
import { getGame } from '../../network/restClient';
import { GameMoveSummary } from '../../network/socketEvents';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';
import { settleAnimations } from '../../testUtils/pieceGestures';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => true,
}));
jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getGame: jest.fn(),
}));

const SNAPSHOT = makeGameSnapshot({ id: 'game-1', gameType: 'daily' });

function move(
  ply: number,
  from: string,
  to: string,
  san: string,
): GameMoveSummary {
  return {
    ply,
    from,
    to,
    san,
    color: ply % 2 === 1 ? 'w' : 'b',
    piece: 'p',
    captured: null,
    promotion: null,
    fenAfter: '',
    clockAfterMs: 0,
  } as GameMoveSummary;
}
const E4 = move(1, 'e2', 'e4', 'e4');
const E5 = move(2, 'e7', 'e5', 'e5');

// The daily game's screen, open under the analysis, as it has the game.
const GameScreen: React.FC<{ moves: GameMoveSummary[] }> = ({ moves }) => {
  usePublishDailyGamePosition('game-1', {
    white: SNAPSHOT.white,
    black: SNAPSHOT.black,
    myColor: 'w',
    fen: SNAPSHOT.fen,
    moves,
    status: 'active',
  });
  return null;
};

describe('DailyAnalysis', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({
        accessToken: 'token-a',
        socket: createFakeSocket().socket,
      }),
    );
    return AsyncStorage.clear();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  function tree(moves: GameMoveSummary[] | null, showsAnalysis = true) {
    return withSafeArea(
      <AnalysisSettingsProvider>
        <DailyGamePositionsProvider>
          {moves && <GameScreen moves={moves} />}
          {showsAnalysis && (
            <DailyAnalysis
              navigation={{ goBack: jest.fn() } as never}
              route={
                {
                  key: 'analysis',
                  name: 'DailyAnalysis',
                  params: { gameId: 'game-1' },
                } as never
              }
            />
          )}
        </DailyGamePositionsProvider>
      </AnalysisSettingsProvider>,
    );
  }

  // The game's screen is there first; the analysis opens over it.
  async function openOverGame(moves: GameMoveSummary[]) {
    const screen = await render(tree(moves, false));
    await screen.rerender(tree(moves));
    await act(async () => {});
    return screen;
  }

  it('starts from the game open under it, fetching nothing', async () => {
    const screen = await openOverGame([E4]);

    expect(getGame).not.toHaveBeenCalled();
    expect(boardTester(screen).pieceOn('e4')).toBe('wp');
  });

  it("resets to the game as it now stands, the opponent's new move and all, at once", async () => {
    const screen = await openOverGame([E4]);
    await boardTester(screen).taps('c7', 'c5');
    await settleAnimations();

    await screen.rerender(tree([E4, E5]));
    await fireEvent.press(screen.getByTestId('reset-analysis-button'));
    await settleAnimations();

    expect(screen.queryByTestId('analysis-loading')).toBeNull();
    expect(boardTester(screen).pieceOn('e5')).toBe('bp');
    expect(boardTester(screen).pieceOn('c5')).toBeNull();
  });

  it('fetches the game when its screen is not open', async () => {
    (getGame as jest.Mock).mockResolvedValue({
      ...SNAPSHOT,
      moves: [E4],
    });
    const screen = await render(tree(null));
    await act(async () => {});

    expect(getGame).toHaveBeenCalledWith('game-1', 'token-a');
    expect(boardTester(screen).pieceOn('e4')).toBe('wp');
  });
});
