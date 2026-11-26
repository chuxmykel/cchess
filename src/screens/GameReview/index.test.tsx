import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { DEFAULT_POSITION } from 'chess.js';
import { Text } from 'react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { captureRef } from 'react-native-view-shot';
import { shareAsync } from 'expo-sharing';

import GameReview from '.';
import { REVIEW_FACT_MS } from '../../constants/review';
import { EngineContext, EngineStatus } from '../../context/EngineContext';
import { ReviewSettingsProvider } from '../../context/ReviewSettingsContext';
import type { PositionEval } from '../../domain/review/types';
import type { ImportedReview } from '../../hooks/useGameReview';
import { boardTester } from '../../components/Board/boardTester';
import {
  getGame,
  getGameReview,
  saveGameReview,
} from '../../network/restClient';
import { makeFakeEngine } from '../../testUtils/fakeEngine';
import { makeFinishedGame } from '../../testUtils/gameSnapshot';
import { withSafeArea } from '../../testUtils/safeArea';
import { settleAnimations } from '../../testUtils/pieceGestures';

jest.mock('../../context/AuthSessionContext', () => {
  const session = jest
    .requireActual('../../testUtils/authSession')
    .makeAuthSession({ user: { id: 'white-user' } });
  return { useAuthSession: () => session };
});
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getGame: jest.fn(),
  getGameReview: jest.fn(),
  saveGameReview: jest.fn(() => Promise.resolve({})),
}));

// 1. e4 e5 2. Ba6?? bxa6 - white, me, blunders a bishop.
const GAME = makeFinishedGame(['e4', 'e5', 'Ba6', 'bxa6'], { id: 'game-1' });
const at = (cp: number, pv: string[]): PositionEval => ({
  score: { kind: 'cp', cp },
  pv,
  second: null,
  depth: 14,
});
const EVALS = [
  at(20, ['e2e4', 'e7e5']),
  at(30, ['e7e5', 'g1f3']),
  at(30, ['g1f3', 'b8c6']),
  at(-300, ['b7a6', 'g1f3']),
  at(-300, ['g1f3', 'd7d6']),
];
const STORED = {
  gameId: 'game-1',
  engine: 'stockfish',
  depth: 14,
  whiteAccuracy: 40,
  blackAccuracy: 95,
  evals: EVALS,
  createdAt: '2026-11-15T00:00:00.000Z',
};

async function renderReview({
  status,
  voice = false,
  params = { gameId: 'game-1' },
  style = 'classic',
}: {
  status?: EngineStatus;
  voice?: boolean;
  params?: { gameId: string } | { imported: ImportedReview };
  style?: 'classic' | 'cchess';
} = {}) {
  await AsyncStorage.setItem(
    'cchess.reviewSettings',
    JSON.stringify({ voice, style }),
  );
  const main = makeFakeEngine();
  const threat = makeFakeEngine();
  const engine = {
    status: status ?? { kind: 'ready' as const, engines: { main, threat } },
    acquire: jest.fn(() => () => {}),
    retry: jest.fn(),
  };
  // The review opened over a screen, as from a game or the analysis board,
  // with the screens it opens standing in, showing what they were given.
  const navigation = createNavigationContainerRef<Record<string, object>>();
  const screen = await render(
    withSafeArea(
      <ReviewSettingsProvider>
        <EngineContext.Provider value={engine}>
          <NavigationContainer ref={navigation}>
            <Stack.Navigator id={undefined}>
              <Stack.Screen name="Home" component={StandIn} />
              <Stack.Screen
                name="GameReview"
                component={GameReview as React.ComponentType<object>}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="AnalysisBoard" component={StandIn} />
              <Stack.Screen name="ReviewSettings" component={StandIn} />
            </Stack.Navigator>
          </NavigationContainer>
        </EngineContext.Provider>
      </ReviewSettingsProvider>,
    ),
  );
  await act(async () => navigation.navigate('GameReview', params));
  await act(async () => {});
  return { screen, navigation, main, threat, engine };
}

const Stack = createNativeStackNavigator();

// A screen the review opens, showing the params it was opened with.
function StandIn({ route }: { route: { name: string; params?: object } }) {
  return (
    <Text testID={`stand-in-${route.name}`}>
      {JSON.stringify(route.params ?? null)}
    </Text>
  );
}

type Screen = Awaited<ReturnType<typeof render>>;

// What a screen the review opened was given.
function openedWith(screen: Screen, name: string): unknown {
  return JSON.parse(
    screen.getByTestId(`stand-in-${name}`).props.children as string,
  );
}

// A header button of the screen on top - the summary's header stays drawn
// under the moves'.
function headerButton(screen: Screen, testID: string) {
  return screen.getAllByTestId(testID).at(-1)!;
}

// On to the next key moment: Next plays the moves there, and tapped again
// as they play, goes straight there.
async function nextMoment(screen: Awaited<ReturnType<typeof render>>) {
  await fireEvent.press(screen.getByTestId('review-next'));
  await fireEvent.press(screen.getByTestId('review-next'));
  await settleAnimations();
}

// From the summary to my blunder, the second key moment.
async function toBlunder(screen: Awaited<ReturnType<typeof render>>) {
  await fireEvent.press(screen.getByTestId('review-start'));
  await fireEvent.press(screen.getByTestId('review-next'));
  await nextMoment(screen);
}

describe('GameReview', () => {
  // The board's pieces move by timed animations, and Next plays a move
  // every few hundred ms: settleAnimations runs them on.
  beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    (getGame as jest.Mock).mockResolvedValue(GAME);
    (getGameReview as jest.Mock).mockResolvedValue(STORED);
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('keeps Start review out of the summary scrolling under it, always in view', async () => {
    const { screen } = await renderReview();

    const summary = screen.getByTestId('game-review-summary');
    expect(within(summary).queryByTestId('review-start')).toBeNull();
    expect(screen.getByTestId('review-start')).toBeTruthy();
  });

  it("opens on the summary: the graph, each side's accuracy and moves", async () => {
    const { screen } = await renderReview();

    expect(screen.getByTestId('game-review-summary')).toBeTruthy();
    expect(screen.getByTestId('eval-graph')).toBeTruthy();
    expect(screen.getByTestId('review-opening')).toHaveTextContent(
      /King's Pawn/,
    );
    expect(screen.getByTestId('review-count-w-blunder')).toHaveTextContent('1');
    expect(screen.getByTestId('review-count-b-best')).toHaveTextContent('1');
    expect(
      Number(screen.getByTestId('review-accuracy-w').props.children),
    ).toBeLessThan(
      Number(screen.getByTestId('review-accuracy-b').props.children),
    );
  });

  it('plays through to my key moments, then closes on what to take away', async () => {
    const { screen } = await renderReview();

    // Every move's played on the way - tapped while they play, Skip goes
    // straight to where they stop.
    await fireEvent.press(screen.getByTestId('review-start'));
    expect(screen.getByTestId('review-next')).toHaveTextContent('Skip');
    await fireEvent.press(screen.getByTestId('review-next'));
    // The book's last move first.
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'e5 is a book move',
    );

    await nextMoment(screen);
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'Ba6 is a blunder',
    );
    expect(screen.getByTestId('review-bubble-text')).toHaveTextContent(
      /bishop/,
    );
    expect(screen.getByTestId('square-badge-a6')).toBeTruthy();
    // In the bubble, and beside the move in the list.
    expect(screen.getAllByTestId('move-class-blunder')).toHaveLength(2);

    // The rest of the moves, then the close.
    await nextMoment(screen);
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'Opening',
    );

    await fireEvent.press(screen.getByTestId('review-next'));
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'Tactics',
    );
    await fireEvent.press(screen.getByTestId('review-next'));
    // From the game's last position.
    expect(openedWith(screen, 'AnalysisBoard')).toEqual({
      source: { kind: 'game', gameId: 'game-1', ply: 4 },
    });
  });

  it('lists the closing cards after the last move, each picked there', async () => {
    const { screen } = await renderReview();
    await toBlunder(screen);
    await nextMoment(screen);

    expect(screen.getByTestId('move-list-end-opening')).toBeSelected();
    await fireEvent.press(screen.getByTestId('move-list-end-tactics'));
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'Tactics',
    );
    expect(screen.getByTestId('move-list-end-tactics')).toBeSelected();
    // On the game's last position.
    expect(screen.getByTestId('piece-a6')).toBeTruthy();
  });

  it('goes back to reviewing from the close, playing on from there', async () => {
    const { screen } = await renderReview();
    await toBlunder(screen);
    await nextMoment(screen);

    await fireEvent.press(screen.getByTestId('move-1'));
    await settleAnimations();
    expect(screen.getByTestId('review-toolbar')).toBeTruthy();
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'e4 is a book move',
    );

    // Next plays on from e4, as if the review had come that way.
    expect(screen.getByTestId('review-next')).toHaveTextContent('Next');
    await nextMoment(screen);
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'e5 is a book move',
    );
  });

  it('goes through the moves as the move list is scrolled by hand', async () => {
    const { screen } = await renderReview();
    await toBlunder(screen);
    for (const [ply, x] of [
      [1, 60],
      [2, 160],
      [3, 260],
    ]) {
      await fireEvent(screen.getByTestId(`move-${ply}`), 'layout', {
        nativeEvent: { layout: { x, y: 0, width: 80, height: 32 } },
      });
    }
    const list = screen.getByTestId('move-list');

    await fireEvent(list, 'scrollBeginDrag');
    await fireEvent.scroll(list, {
      nativeEvent: { contentOffset: { x: 120, y: 0 } },
    });
    await settleAnimations();
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'e5 is a book move',
    );
  });

  it('offers Best and Show only where they say something', async () => {
    const { screen } = await renderReview();
    await toBlunder(screen);
    expect(screen.getByTestId('review-best')).toBeEnabled();
    expect(screen.getByTestId('review-show')).toBeEnabled();

    // 2... bxa6, the best move, and a plain recapture.
    await fireEvent(screen.getByTestId('review-forward'), 'pressIn');
    await settleAnimations();
    expect(screen.getByTestId('review-best')).toBeDisabled();
  });

  it('shows the best move, and the line answering the one played', async () => {
    const { screen } = await renderReview();
    await toBlunder(screen);

    await fireEvent.press(screen.getByTestId('review-show'));
    await settleAnimations();
    expect(screen.getByTestId('review-bubble-line')).toHaveTextContent(/bxa6/);
    // Played out on the board: the pawn has taken on a6.
    expect(screen.getByTestId('piece-a6')).toBeTruthy();
    expect(screen.queryByTestId('piece-b7')).toBeNull();

    // Hidden, the board's back on the move played.
    await fireEvent.press(screen.getByTestId('review-show'));
    await settleAnimations();
    expect(screen.getByTestId('piece-b7')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('review-best'));
    await settleAnimations();
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'Nf3 is best',
    );
  });

  it('reviews a move stepped to as if it had come that way', async () => {
    const { screen } = await renderReview();
    await toBlunder(screen);

    // Past the blunder, then back to it: Retry's there as before.
    await fireEvent(screen.getByTestId('review-forward'), 'pressIn');
    await fireEvent(screen.getByTestId('review-back'), 'pressIn');
    await settleAnimations();
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'Ba6 is a blunder',
    );
    expect(screen.getByTestId('review-retry')).toBeEnabled();
    expect(screen.getByTestId('review-next')).toHaveTextContent('Next');
  });

  it('offers to retry a slip, the board set for my move', async () => {
    const { screen } = await renderReview();
    await toBlunder(screen);

    await fireEvent.press(screen.getByTestId('review-retry'));
    await settleAnimations();
    expect(screen.getByTestId('review-bubble-text')).toHaveTextContent(
      'Find a better move for White.',
    );
  });

  it('reads each comment aloud, with the voice on', async () => {
    const { screen } = await renderReview({ voice: true });
    await act(async () => {});
    // An intro fitting the game: a short one, my loss, its opening.
    const [intro] = (Speech.speak as jest.Mock).mock.calls.at(-1);
    expect(intro).toBe(
      screen
        .getByTestId('review-intro-text')
        .props.children.map(
          (part: { props: { children: string } }) => part.props.children,
        )
        .join(''),
    );

    // Quiet while the moves play, then the moment.
    await fireEvent.press(screen.getByTestId('review-start'));
    expect(Speech.speak).toHaveBeenLastCalledWith(intro, expect.anything());
    await fireEvent.press(screen.getByTestId('review-next'));
    expect(Speech.speak).toHaveBeenLastCalledWith(
      expect.stringMatching(/^e5 is a book move\./),
      expect.anything(),
    );
    await nextMoment(screen);
    expect(Speech.speak).toHaveBeenLastCalledWith(
      expect.stringMatching(/^bishop a6 is a blunder\./),
      expect.anything(),
    );
  });

  it('analyses a game nobody has reviewed, then shows it', async () => {
    (getGameReview as jest.Mock).mockResolvedValue(null);
    const { screen, main, threat } = await renderReview();

    expect(screen.getByTestId('game-review-analysing')).toBeTruthy();
    expect(screen.getByTestId('review-progress-label')).toHaveTextContent(
      'Analysing the game...',
    );
    // From the start, played through as it's analysed.
    expect(screen.getByTestId('piece-e2')).toBeTruthy();

    for (let i = 0; i < EVALS.length; i++) {
      const engine = i % 2 === 0 ? main : threat;
      const { score, pv } = EVALS[i];
      await act(async () =>
        engine.report({
          depth: 14,
          done: true,
          lines: [{ multipv: 1, score, pv }],
        }),
      );
      await act(async () => {});
    }

    expect(screen.getByTestId('game-review-summary')).toBeTruthy();
    expect(saveGameReview).toHaveBeenCalled();
  });

  it('plays the game through as it analyses, as far as the progress bar', async () => {
    (getGameReview as jest.Mock).mockResolvedValue(null);
    const { screen, main, threat } = await renderReview();

    // Three of the five positions analysed: two moves to play.
    for (let i = 0; i < 3; i++) {
      const engine = i % 2 === 0 ? main : threat;
      const { score, pv } = EVALS[i];
      await act(async () =>
        engine.report({
          depth: 14,
          done: true,
          lines: [{ multipv: 1, score, pv }],
        }),
      );
      await act(async () => {});
    }
    // 60% analysed: 60% of the game's four moves, 1. e4 e5, and no further.
    expect(screen.getByTestId('review-progress-label')).toBeTruthy();
    expect(screen.getByTestId('piece-e4')).toBeTruthy();
    expect(screen.getByTestId('piece-e5')).toBeTruthy();
    expect(screen.getByTestId('piece-f1')).toBeTruthy();
  });

  it('tells chess facts while it analyses, a new one every few seconds', async () => {
    (getGameReview as jest.Mock).mockResolvedValue(null);
    const { screen } = await renderReview();
    const fact = () =>
      screen
        .getByTestId('review-analysing-fact-text')
        .props.children.map(
          (part: { props: { children: string } }) => part.props.children,
        )
        .join('');
    const first = fact();
    expect(first).toMatch(/\w/);

    await act(async () => jest.advanceTimersByTime(REVIEW_FACT_MS));

    expect(fact()).not.toBe(first);
  });

  it('says so while the engine downloads', async () => {
    (getGameReview as jest.Mock).mockResolvedValue(null);
    const { screen } = await renderReview({
      status: { kind: 'downloading', progress: 0.25 },
    });

    expect(screen.getByTestId('review-progress-label')).toHaveTextContent(
      'Downloading the engine... 25%',
    );
  });

  it('explains why a game still being played has no review', async () => {
    (getGame as jest.Mock).mockResolvedValue({ ...GAME, status: 'active' });
    const { screen } = await renderReview();

    expect(screen.getByTestId('game-review-unavailable')).toHaveTextContent(
      /still being played/,
    );
  });

  it('goes back from the moves to the summary, and from there out of the review', async () => {
    const { screen, navigation } = await renderReview();
    await toBlunder(screen);
    expect(navigation.getCurrentRoute()?.name).toBe('ReviewMoves');

    await act(async () => navigation.goBack());
    expect(navigation.getCurrentRoute()?.name).toBe('ReviewSummary');
    expect(screen.queryByTestId('game-review-stepping')).toBeNull();
    // Back at the start, as the summary is.
    await fireEvent.press(screen.getByTestId('review-start'));
    await fireEvent.press(screen.getByTestId('review-next'));
    await settleAnimations();
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'e5 is a book move',
    );

    await act(async () => navigation.goBack());
    await act(async () => navigation.goBack());
    expect(navigation.getCurrentRoute()?.name).toBe('Home');
  });

  it('goes back to the summary from its close', async () => {
    const { screen, navigation } = await renderReview();
    await toBlunder(screen);
    // On through the last moves to the close.
    await nextMoment(screen);

    await fireEvent.press(screen.getByTestId('review-summary-button'));
    expect(navigation.getCurrentRoute()?.name).toBe('ReviewSummary');
  });

  it('opens its settings from the header', async () => {
    const { screen } = await renderReview();

    await fireEvent.press(screen.getByTestId('review-settings-button'));
    expect(screen.getByTestId('stand-in-ReviewSettings')).toBeTruthy();
  });

  it('opens the analysis board at the move shown, from the header', async () => {
    const { screen } = await renderReview();
    await toBlunder(screen);

    await fireEvent.press(headerButton(screen, 'review-analyse-button'));
    // 2. Ba6, the third move.
    expect(openedWith(screen, 'AnalysisBoard')).toEqual({
      source: { kind: 'game', gameId: 'game-1', ply: 3 },
    });
  });

  describe('of a game brought in', () => {
    // The same game, pasted: 1. e4 e5 2. Ba6?? bxa6 0-1.
    const IMPORTED: ImportedReview = {
      startFen: DEFAULT_POSITION,
      uciMoves: ['e2e4', 'e7e5', 'f1a6', 'b7a6'],
      game: {
        white: { name: 'Ann Smith', rating: 1500 },
        black: { name: null, rating: null },
        result: 'black',
      },
    };

    async function analyseImported(
      imported = IMPORTED,
      style: 'classic' | 'cchess' = 'classic',
    ) {
      const rendered = await renderReview({ params: { imported }, style });
      for (let i = 0; i < EVALS.length; i++) {
        const engine = i % 2 === 0 ? rendered.main : rendered.threat;
        const { score, pv } = EVALS[i];
        await act(async () =>
          engine.report({
            depth: 14,
            done: true,
            lines: [{ multipv: 1, score, pv }],
          }),
        );
        await act(async () => {});
      }
      return rendered;
    }

    it("analyses it on the device, naming the players from the PGN's tags", async () => {
      const { screen } = await analyseImported();

      expect(screen.getByTestId('game-review-summary')).toBeTruthy();
      expect(screen.getByTestId('review-summary')).toHaveTextContent(
        /Ann Smith.*Black/,
      );
      expect(getGame).not.toHaveBeenCalled();
      expect(getGameReview).not.toHaveBeenCalled();
      expect(saveGameReview).not.toHaveBeenCalled();
    });

    it('tips over the king of the side its result says lost', async () => {
      const { screen } = await analyseImported();
      await fireEvent.press(screen.getByTestId('review-start'));
      for (let i = 0; i < 4; i++) {
        await fireEvent(screen.getByTestId('review-forward'), 'pressIn');
      }
      await settleAnimations();

      expect(boardTester(screen, 'review').kingInDanger()).toEqual({
        square: 'e1',
        fallen: true,
      });
    });

    it('opens the analysis board on the pasted game, at the move shown', async () => {
      const { screen } = await analyseImported();
      await toBlunder(screen);

      await fireEvent.press(headerButton(screen, 'review-analyse-button'));
      expect(openedWith(screen, 'AnalysisBoard')).toEqual({
        source: { kind: 'import', ...IMPORTED, ply: 3 },
      });
    });

    it('has no clock to show in the cchess style', async () => {
      const { screen } = await analyseImported(IMPORTED, 'cchess');

      expect(screen.getByTestId('cchess-summary')).toBeTruthy();
      expect(screen.queryByTestId('review-time')).toBeNull();
    });
  });

  describe('in the cchess style', () => {
    // White's clock: Ba6 in 4s, from 300s to 296s.
    const CLOCKED = {
      ...GAME,
      moves: GAME.moves.map((move, i) => ({
        ...move,
        clockAfterMs: [300_000, 300_000, 296_000, 290_000][i],
      })),
    };
    beforeEach(() => (getGame as jest.Mock).mockResolvedValue(CLOCKED));

    const renderCchess = () => renderReview({ style: 'cchess' });

    it('opens on the decisive move, the chapters and the marks - no rating', async () => {
      const { screen } = await renderCchess();

      expect(screen.getByTestId('review-decisive-text')).toHaveTextContent(
        'Ba6?? took White from level to losing.',
      );
      expect(screen.getByTestId('review-chapter-0')).toHaveTextContent(
        /The opening/,
      );
      expect(screen.getByTestId('review-chapter-1')).toHaveTextContent(
        /Move 2.*White played Ba6\?\?/,
      );
      expect(screen.getByTestId('review-marks-w-??')).toHaveTextContent('1');
      expect(screen.queryByTestId('review-summary')).toBeNull();
      expect(screen.queryByTestId('review-rating-w')).toBeNull();
    });

    it('shows where the time went', async () => {
      const { screen } = await renderCchess();

      expect(screen.getByTestId('time-graph')).toBeTruthy();
      expect(screen.getByTestId('review-time')).toHaveTextContent(
        /Ba6\?\? came in 4s/,
      );
    });

    it('has no clock where no move took any time', async () => {
      (getGame as jest.Mock).mockResolvedValue(GAME);
      const { screen } = await renderCchess();

      expect(screen.getByTestId('cchess-summary')).toBeTruthy();
      expect(screen.queryByTestId('review-time')).toBeNull();
    });

    it('has no clock for a daily game', async () => {
      (getGame as jest.Mock).mockResolvedValue({ ...CLOCKED, daysPerMove: 3 });
      const { screen } = await renderCchess();

      expect(screen.getByTestId('cchess-summary')).toBeTruthy();
      expect(screen.queryByTestId('review-time')).toBeNull();
    });

    it('goes to the decisive move when it is tapped', async () => {
      const { screen } = await renderCchess();

      await fireEvent.press(screen.getByTestId('review-decisive'));

      expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
        'Ba6?? · Blunder',
      );
      expect(screen.getByTestId('review-bubble-score')).toHaveTextContent(
        /· 4s$/,
      );
    });

    it('asks for the move at a turning point, then reveals it', async () => {
      const { screen } = await renderCchess();
      await fireEvent.press(screen.getByTestId('review-start'));
      // Straight to the opening's end, 1... e5 - book, unmarked.
      await fireEvent.press(screen.getByTestId('review-next'));
      await settleAnimations();
      expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
        'e5 · Book move',
      );
      expect(screen.getByTestId('review-chapter-strip')).toHaveTextContent(
        'Chapter 1 of 3 · The opening',
      );
      // Nor does the list show the turning point coming, or what follows.
      expect(screen.queryByTestId('move-3')).toBeNull();
      // Black's first move, which starts no clock: no time beside it.
      expect(screen.getByTestId('review-bubble-score')).not.toHaveTextContent(
        /·/,
      );

      await nextMoment(screen);
      expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
        'Your move',
      );
      expect(screen.getByTestId('review-bubble-text')).toHaveTextContent(
        'Move 2 for White: what would you play?',
      );
      expect(screen.getByTestId('review-next')).toHaveTextContent('Reveal');
      // The list stops before the move asked for, giving nothing away.
      expect(screen.getByTestId('move-2')).toBeTruthy();
      expect(screen.queryByTestId('move-3')).toBeNull();
      expect(screen.queryByTestId('move-4')).toBeNull();

      await fireEvent.press(screen.getByTestId('review-next'));
      await settleAnimations();
      expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
        'Ba6?? · Blunder',
      );
      expect(screen.getByTestId('review-chapter-strip')).toHaveTextContent(
        'Chapter 2 of 3 · Move 2',
      );
      expect(screen.getByTestId('move-4')).toBeTruthy();
    });

    it('shares a picture of the decisive moment', async () => {
      const { screen } = await renderCchess();
      expect(screen.getByTestId('review-share-card')).toHaveTextContent(
        /Decided at move 2.*White · \d+\.\d% accuracy/,
      );

      // The sheet open until it's closed: Share says so meanwhile.
      let closeSheet: () => void = () => {};
      (shareAsync as jest.Mock).mockImplementationOnce(
        () => new Promise<void>((resolve) => (closeSheet = resolve)),
      );
      await fireEvent.press(screen.getByTestId('review-share'));
      await act(async () => {});

      expect(captureRef).toHaveBeenCalled();
      expect(shareAsync).toHaveBeenCalledWith(
        'file:///tmp/card.png',
        expect.objectContaining({ mimeType: 'image/png' }),
      );
      expect(screen.getByTestId('review-share')).toHaveTextContent('Sharing…');
      expect(screen.getByTestId('review-share')).toBeDisabled();

      await act(async () => closeSheet());
      expect(screen.getByTestId('review-share')).toHaveTextContent('Share');
    });

    it('starts the review at a chapter tapped', async () => {
      const { screen } = await renderCchess();

      await fireEvent.press(screen.getByTestId('review-chapter-2'));

      expect(screen.getByTestId('game-review-stepping')).toBeTruthy();
      expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
        'bxa6 · Best move',
      );
    });
  });
});
