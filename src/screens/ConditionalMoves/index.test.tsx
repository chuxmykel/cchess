import { act, fireEvent, render, within } from '@testing-library/react-native';
import { Square } from 'chess.js';

import ConditionalMoves from '.';
import { boardTester } from '../../components/Board/boardTester';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  DailyGamePositionsProvider,
  usePublishDailyGamePosition,
} from '../../context/DailyGamePositionsContext';
import {
  getConditionalMoves,
  saveConditionalMoves,
} from '../../network/restClient';
import { GameMoveSummary } from '../../network/socketEvents';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';
import { settleAnimations } from '../../testUtils/pieceGestures';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getConditionalMoves: jest.fn(),
  saveConditionalMoves: jest.fn(),
}));

const SNAPSHOT = makeGameSnapshot({ id: 'game-1', gameType: 'daily' });
const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const E4 = {
  ply: 1,
  from: 'e2',
  to: 'e4',
  san: 'e4',
  color: 'w',
  piece: 'p',
  captured: null,
  promotion: null,
  fenAfter: AFTER_E4,
  clockAfterMs: 0,
} as GameMoveSummary;

// The game's screen, under this one, as it has the game: you've played
// 1. e4, and it's their move.
const GameScreen: React.FC = () => {
  usePublishDailyGamePosition('game-1', {
    white: SNAPSHOT.white,
    black: SNAPSHOT.black,
    myColor: 'w',
    fen: AFTER_E4,
    moves: [E4],
    status: 'active',
  });
  return null;
};

describe('ConditionalMoves', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({
        accessToken: 'token-a',
        socket: createFakeSocket().socket,
      }),
    );
    (getConditionalMoves as jest.Mock).mockResolvedValue({
      basePly: null,
      lines: [],
    });
    (saveConditionalMoves as jest.Mock).mockImplementation(
      async (_gameId: string, basePly: number, lines: string[][]) => ({
        basePly,
        lines,
      }),
    );
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  async function renderScreen() {
    const navigation = { goBack: jest.fn() };
    const tree = (showsScreen: boolean) =>
      withSafeArea(
        <DailyGamePositionsProvider>
          <GameScreen />
          {showsScreen && (
            <ConditionalMoves
              navigation={navigation as never}
              route={
                {
                  key: 'conditional',
                  name: 'ConditionalMoves',
                  params: { gameId: 'game-1' },
                } as never
              }
            />
          )}
        </DailyGamePositionsProvider>,
      );
    const screen = await render(tree(false));
    await screen.rerender(tree(true));
    await act(async () => {});
    return { screen, navigation };
  }

  async function play(
    screen: Awaited<ReturnType<typeof render>>,
    from: Square,
    to: Square,
  ) {
    await boardTester(screen).taps(from, to);
    await settleAnimations();
  }

  it("starts empty, on the game's position", async () => {
    const { screen } = await renderScreen();

    expect(screen.getByTestId('conditional-moves-empty')).toBeTruthy();
    expect(boardTester(screen).pieceOn('e4')).toBe('wp');
    expect(
      screen.getByTestId('confirm-conditional-moves-button'),
    ).toBeDisabled();
  });

  it('writes lines from moves on the board, and saves them all', async () => {
    const { screen, navigation } = await renderScreen();

    await play(screen, 'e7', 'e5');
    await play(screen, 'g1', 'f3');
    const first = within(screen.getByTestId('conditional-line-0'));
    expect(first.getByText('1...')).toBeTruthy();
    expect(first.getByText('e5')).toBeTruthy();
    expect(first.getByText('Nf3')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('add-conditional-line-button'));
    await settleAnimations();
    expect(boardTester(screen).pieceOn('e5')).toBeNull();
    await play(screen, 'c7', 'c5');
    await play(screen, 'g1', 'f3');

    await fireEvent.press(
      screen.getByTestId('confirm-conditional-moves-button'),
    );
    await act(async () => {});

    expect(saveConditionalMoves).toHaveBeenCalledWith(
      'game-1',
      1,
      [
        ['e7e5', 'g1f3'],
        ['c7c5', 'g1f3'],
      ],
      'token-a',
    );
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it("takes back the line's last move, and deletes a line", async () => {
    (getConditionalMoves as jest.Mock).mockResolvedValue({
      basePly: 1,
      lines: [
        ['e7e5', 'g1f3'],
        ['c7c5', 'g1f3'],
      ],
    });
    const { screen } = await renderScreen();
    expect(boardTester(screen).pieceOn('c5')).toBe('bp');

    await fireEvent.press(screen.getByTestId('delete-conditional-move-button'));
    await settleAnimations();
    expect(boardTester(screen).pieceOn('f3')).toBeNull();

    await fireEvent.press(screen.getByTestId('delete-conditional-line-0'));
    await settleAnimations();
    expect(screen.queryByTestId('conditional-line-1')).toBeNull();
    expect(boardTester(screen).pieceOn('c5')).toBe('bp');
  });

  it("says why the lines couldn't be saved", async () => {
    (saveConditionalMoves as jest.Mock).mockRejectedValue(
      new Error('The game has moved on since'),
    );
    const { screen, navigation } = await renderScreen();
    await play(screen, 'e7', 'e5');
    await play(screen, 'g1', 'f3');

    await fireEvent.press(
      screen.getByTestId('confirm-conditional-moves-button'),
    );
    await act(async () => {});

    expect(screen.getByTestId('conditional-moves-error')).toHaveTextContent(
      'The game has moved on since',
    );
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
