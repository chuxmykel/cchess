import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { DEFAULT_POSITION, Square } from 'chess.js';

import AnalysisBoardContent from './AnalysisBoardContent';
import { boardTester } from '../../components/Board/boardTester';
import { AnalysisSettingsProvider } from '../../context/AnalysisSettingsContext';
import { EngineContext, EngineStatus } from '../../context/EngineContext';
import { AnalysisSettings } from '../../constants/analysis';
import { SETTLE_MS } from '../../hooks/useEngineAnalysis';
import { makeFakeEngine } from '../../testUtils/fakeEngine';
import { settleAnimations } from '../../testUtils/pieceGestures';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => true,
}));

const width = 400;

describe('AnalysisBoardContent', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    return AsyncStorage.clear();
  });
  afterEach(() => jest.useRealTimers());

  async function renderAnalysis({
    uciMoves = [] as string[],
    status,
    settings,
  }: {
    uciMoves?: string[];
    status?: EngineStatus;
    // Saved before the board opens.
    settings?: Partial<AnalysisSettings>;
  } = {}) {
    if (settings) {
      await AsyncStorage.setItem(
        'cchess.analysisSettings',
        JSON.stringify(settings),
      );
    }
    const main = makeFakeEngine();
    const threat = makeFakeEngine();
    const value = {
      status: status ?? { kind: 'ready' as const, engines: { main, threat } },
      acquire: () => () => {},
      retry: jest.fn(),
    };
    const onEditPosition = jest.fn();
    const onOpenSettings = jest.fn();
    const screen = await render(
      withSafeArea(
        <AnalysisSettingsProvider>
          <EngineContext.Provider value={value}>
            <AnalysisBoardContent
              start={{ startFen: DEFAULT_POSITION, uciMoves }}
              initialOrientation="w"
              width={width}
              onNewAnalysis={jest.fn()}
              onEditPosition={onEditPosition}
              onOpenSettings={onOpenSettings}
            />
          </EngineContext.Provider>
        </AnalysisSettingsProvider>,
      ),
    );
    await act(async () => {});
    return { screen, main, threat, onEditPosition, onOpenSettings };
  }

  async function play(
    screen: Awaited<ReturnType<typeof render>>,
    from: Square,
    to: Square,
  ) {
    await boardTester(screen).taps(from, to);
    await settleAnimations();
  }

  it('moves either side, and lists the moves', async () => {
    const { screen } = await renderAnalysis();

    await play(screen, 'e2', 'e4');
    await play(screen, 'e7', 'e5');

    const board = boardTester(screen);
    expect(board.pieceOn('e4')).toBe('wp');
    expect(board.pieceOn('e5')).toBe('bp');
    expect(screen.getByText('1. e4')).toBeTruthy();
    expect(screen.getByText('e5')).toBeTruthy();
  });

  it('keeps a different move from an earlier position as a variation', async () => {
    const { screen } = await renderAnalysis({ uciMoves: ['e2e4', 'e7e5'] });

    await fireEvent(screen.getByTestId('previous-move-button'), 'pressIn');
    await settleAnimations();
    expect(boardTester(screen).pieceOn('e7')).toBe('bp');
    await play(screen, 'c7', 'c5');

    expect(screen.getByText('1... c5')).toBeTruthy();
    expect(screen.getByText('(')).toBeTruthy();
    expect(boardTester(screen).pieceOn('c5')).toBe('bp');
  });

  it('names the opening', async () => {
    const { screen } = await renderAnalysis({ uciMoves: ['e2e4', 'c7c5'] });

    expect(screen.getByTestId('opening-name')).toHaveTextContent(
      'B20 · Sicilian Defense',
    );
  });

  it("shows the engine's lines, eval and best move for the position shown", async () => {
    const { screen, main } = await renderAnalysis();
    await act(async () => jest.advanceTimersByTime(SETTLE_MS));
    expect(main.requests[0]).toMatchObject({ fen: DEFAULT_POSITION });

    await act(async () =>
      main.report({
        depth: 20,
        done: true,
        lines: [
          { multipv: 1, score: { kind: 'cp', cp: 25 }, pv: ['e2e4', 'e7e5'] },
          { multipv: 2, score: { kind: 'cp', cp: 18 }, pv: ['d2d4'] },
        ],
      }),
    );

    expect(screen.getByTestId('engine-line-0-score')).toHaveTextContent('+0.3');
    expect(screen.getByTestId('eval-bar-score')).toHaveTextContent('+0.3');
    expect(boardTester(screen).arrows()).toEqual(
      expect.arrayContaining(['e2e4', 'd2d4']),
    );
  });

  it('analyses the new position once a move is played', async () => {
    const { screen, main } = await renderAnalysis();

    await play(screen, 'e2', 'e4');
    await act(async () => jest.advanceTimersByTime(SETTLE_MS));

    expect(main.requests.at(-1)?.fen).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    );
  });

  it('shows the result, not a search, once the game is over', async () => {
    // Fool's mate.
    const { screen, main } = await renderAnalysis({
      uciMoves: ['f2f3', 'e7e5', 'g2g4', 'd8h4'],
    });
    await act(async () => jest.advanceTimersByTime(SETTLE_MS));

    expect(main.analyse).not.toHaveBeenCalled();
    expect(screen.getByTestId('eval-bar-score')).toHaveTextContent('0-1');
    // The lines' room stays, so the board doesn't move.
    expect(screen.getByTestId('engine-lines-area')).toHaveStyle({
      height: 2 * 26 + 14,
    });
    expect(screen.queryByTestId('engine-lines')).toBeNull();
  });

  it("plays a line's first move when it's tapped", async () => {
    const { screen, main } = await renderAnalysis();
    await act(async () => jest.advanceTimersByTime(SETTLE_MS));
    await act(async () =>
      main.report({
        depth: 20,
        done: true,
        lines: [
          { multipv: 1, score: { kind: 'cp', cp: 25 }, pv: ['e2e4', 'e7e5'] },
          { multipv: 2, score: { kind: 'cp', cp: 18 }, pv: ['d2d4'] },
        ],
      }),
    );

    await fireEvent.press(screen.getByTestId('engine-line-1'));
    await settleAnimations();

    expect(boardTester(screen).pieceOn('d4')).toBe('wp');
    expect(
      within(screen.getByTestId('variation-move-list')).getByText('1. d4'),
    ).toBeTruthy();
    // The last position's lines stay, greyed, and its arrows go.
    expect(screen.getByTestId('engine-line-0')).toBeDisabled();
    expect(boardTester(screen).arrows()).not.toContain('e2e4');
  });

  it('opens the settings from its menu', async () => {
    const { screen, onOpenSettings } = await renderAnalysis();

    await fireEvent.press(screen.getByTestId('game-menu-button'));
    await fireEvent.press(screen.getByTestId('analysis-settings-action'));
    // The menu closes first (fake timers here).
    await settleAnimations();

    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('searches for as long, and shows as many lines, as the settings say', async () => {
    const { main } = await renderAnalysis({
      settings: { engineLineCount: 3, searchSeconds: 7 },
    });
    await act(async () => jest.advanceTimersByTime(SETTLE_MS));

    expect(main.requests.at(-1)).toMatchObject({
      multiPv: 3,
      limit: { movetimeMs: 7000 },
    });
  });

  it('searches on until the position changes when the time is unlimited', async () => {
    const { main } = await renderAnalysis({
      settings: { searchSeconds: null },
    });
    await act(async () => jest.advanceTimersByTime(SETTLE_MS));

    expect(main.requests.at(-1)).toMatchObject({ limit: { infinite: true } });
  });

  it('hides the lines with none asked for, still searching for the best move', async () => {
    const { screen, main } = await renderAnalysis({
      settings: { engineLineCount: 0 },
    });
    await act(async () => jest.advanceTimersByTime(SETTLE_MS));

    expect(main.requests.at(-1)).toMatchObject({ multiPv: 1 });
    expect(screen.queryByTestId('engine-lines')).toBeNull();
  });

  it('puts the eval bar beside the board, taking its width from it', async () => {
    const { screen } = await renderAnalysis({
      settings: { evalBarPosition: 'left' },
    });

    expect(screen.getByTestId('eval-bar')).toHaveStyle({ width: 18 });
    expect(boardTester(screen).size()).toBe(width - 18);
  });

  it('shows the download while the engine is on its way', async () => {
    const { screen } = await renderAnalysis({
      status: { kind: 'downloading', progress: 0.25 },
    });

    expect(screen.getByText('Downloading engine… 25%')).toBeTruthy();
  });
});
