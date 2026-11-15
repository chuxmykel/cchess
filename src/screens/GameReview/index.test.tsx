import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';
import * as Speech from 'expo-speech';

import GameReview from '.';
import { REVIEW_FACT_MS } from '../../constants/review';
import { EngineContext, EngineStatus } from '../../context/EngineContext';
import { ReviewSettingsProvider } from '../../context/ReviewSettingsContext';
import type { PositionEval } from '../../domain/review/types';
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
}: { status?: EngineStatus; voice?: boolean } = {}) {
  await AsyncStorage.setItem(
    'cchess.reviewSettings',
    JSON.stringify({ voice }),
  );
  const main = makeFakeEngine();
  const threat = makeFakeEngine();
  const engine = {
    status: status ?? { kind: 'ready' as const, engines: { main, threat } },
    acquire: jest.fn(() => () => {}),
    retry: jest.fn(),
  };
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };
  const props = {
    navigation,
    route: { key: 'review', name: 'GameReview', params: { gameId: 'game-1' } },
  } as unknown as React.ComponentProps<typeof GameReview>;
  const screen = await render(
    withSafeArea(
      <ReviewSettingsProvider>
        <EngineContext.Provider value={engine}>
          <GameReview {...props} />
        </EngineContext.Provider>
      </ReviewSettingsProvider>,
    ),
  );
  await act(async () => {});
  return { screen, navigation, main, threat, engine };
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
  beforeEach(async () => {
    await AsyncStorage.clear();
    (getGame as jest.Mock).mockResolvedValue(GAME);
    (getGameReview as jest.Mock).mockResolvedValue(STORED);
  });
  afterEach(() => jest.clearAllMocks());

  it('opens on the summary: the graph, each side’s accuracy and moves', async () => {
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
    const { screen, navigation } = await renderReview();

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
    // At the move the card's about: 2. Ba6.
    expect(navigation.navigate).toHaveBeenCalledWith('AnalysisBoard', {
      source: { kind: 'game', gameId: 'game-1', ply: 3 },
    });
  });

  it('shows each closing card with its move, picked from the tabs', async () => {
    const { screen } = await renderReview();
    await toBlunder(screen);
    await nextMoment(screen);

    await fireEvent.press(screen.getByTestId('tab-tactics'));
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'Tactics',
    );
    // The board on the blunder it's about.
    expect(screen.getByTestId('square-badge-a6')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('tab-opening'));
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'Opening',
    );
  });

  it('goes back to reviewing from the close, a move picked', async () => {
    const { screen } = await renderReview();
    await toBlunder(screen);
    await nextMoment(screen);

    await fireEvent.press(screen.getByTestId('move-1'));
    await settleAnimations();
    expect(screen.getByTestId('review-toolbar')).toBeTruthy();
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'e4 is a book move',
    );
    expect(screen.getByTestId('review-next')).toHaveTextContent('Resume');

    await fireEvent.press(screen.getByTestId('review-next'));
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'Opening',
    );
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

  it('returns to where it was after stepping away', async () => {
    const { screen } = await renderReview();
    await fireEvent.press(screen.getByTestId('review-start'));
    await fireEvent.press(screen.getByTestId('review-next'));

    await fireEvent(screen.getByTestId('review-forward'), 'pressIn');
    await settleAnimations();
    expect(screen.getByTestId('review-next')).toHaveTextContent('Resume');

    await fireEvent.press(screen.getByTestId('review-next'));
    await settleAnimations();
    expect(screen.getByTestId('review-bubble-title')).toHaveTextContent(
      'e5 is a book move',
    );
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

  it('tells chess facts while it analyses, a new one every few seconds', async () => {
    jest.useFakeTimers();
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
    jest.useRealTimers();
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

  it('opens its settings from the header', async () => {
    const { navigation } = await renderReview();
    const [options] = navigation.setOptions.mock.calls[0];
    const [item] = options.unstable_headerRightItems();
    const settings = await render(item.element);

    await fireEvent.press(settings.getByTestId('review-settings-button'));
    expect(navigation.navigate).toHaveBeenCalledWith('ReviewSettings');
  });
});
