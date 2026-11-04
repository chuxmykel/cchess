import { act, fireEvent, render } from '@testing-library/react-native';

import AnalysisBoard from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { AnalysisSettingsProvider } from '../../context/AnalysisSettingsContext';
import { EngineContext } from '../../context/EngineContext';
import { AnalysisSource } from '../../hooks/useAnalysisSource';
import { makeAuthSession } from '../../testUtils/authSession';
import { waitForSheetToClose } from '../../testUtils/modal';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => true,
}));

describe('AnalysisBoard', () => {
  beforeEach(() => {
    jest.mocked(useAuthSession).mockReturnValue(makeAuthSession());
  });

  async function renderBoard(source: AnalysisSource) {
    const navigation = {
      setOptions: jest.fn(),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };
    const engine = {
      status: { kind: 'starting' as const },
      acquire: () => () => {},
      retry: jest.fn(),
    };
    const screen = await render(
      withSafeArea(
        <AnalysisSettingsProvider>
          <EngineContext.Provider value={engine}>
            <AnalysisBoard
              navigation={navigation}
              route={{ params: { source } }}
            />
          </EngineContext.Provider>
        </AnalysisSettingsProvider>,
      ),
    );
    await act(async () => {});
    return { screen, navigation };
  }

  it('sets up a position, then analyses it', async () => {
    const { screen, navigation } = await renderBoard({ kind: 'setup' });
    expect(navigation.setOptions).toHaveBeenLastCalledWith({
      title: 'Set Up Position',
    });

    await fireEvent.press(screen.getByTestId('set-up-menu'));
    await fireEvent.press(screen.getByTestId('editor-clear'));
    expect(screen.getByTestId('set-up-analyse')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('editor-tool-wk'));
    await fireEvent.press(screen.getByTestId('square-e1'));
    await fireEvent.press(screen.getByTestId('editor-tool-bk'));
    await fireEvent.press(screen.getByTestId('square-e8'));
    await fireEvent.press(screen.getByTestId('set-up-analyse'));

    expect(screen.getByTestId('analysis-board')).toBeTruthy();
    expect(screen.getAllByTestId(/^piece-/)).toHaveLength(2);
    expect(navigation.setOptions).toHaveBeenLastCalledWith({
      title: 'Analysis',
    });
  });

  it('edits the position shown over the analysis, which stays on cancel', async () => {
    const { screen } = await renderBoard({
      kind: 'import',
      startFen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      uciMoves: ['e1d2'],
    });

    await fireEvent.press(screen.getByTestId('game-menu-button'));
    await fireEvent.press(screen.getByTestId('edit-position-action'));
    await waitForSheetToClose();
    expect(screen.getByTestId('editor-piece-d2')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('set-up-menu'));
    await fireEvent.press(screen.getByTestId('set-up-cancel'));
    await waitForSheetToClose();

    expect(screen.queryByTestId('set-up-position')).toBeNull();
    expect(screen.getByText('1. Kd2')).toBeTruthy();
  });

  it('starts a new analysis in place', async () => {
    const { screen } = await renderBoard({
      kind: 'import',
      startFen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      uciMoves: ['e1d2'],
    });

    await fireEvent.press(screen.getByTestId('game-menu-button'));
    await fireEvent.press(screen.getByTestId('new-analysis-action'));

    expect(screen.queryByText('1. Kd2')).toBeNull();
    expect(screen.getAllByTestId(/^piece-/)).toHaveLength(32);
  });

  it("sets whose move it is and castling in the position's settings, and flips the board", async () => {
    const { screen } = await renderBoard({ kind: 'setup' });

    await fireEvent.press(screen.getByTestId('set-up-options'));
    await fireEvent.press(screen.getByTestId('editor-turn-b'));
    await fireEvent.press(screen.getByTestId('editor-castling-K'));
    await fireEvent.press(screen.getByTestId('position-setup-done'));
    expect(screen.getByTestId('editor-turn-b')).toBeChecked();
    expect(screen.getByTestId('editor-castling-K')).not.toBeChecked();

    await fireEvent.press(screen.getByTestId('set-up-flip'));
    // Black at the bottom: a8 drawn bottom right.
    expect(screen.getByTestId('editor-piece-a8')).toHaveStyle({
      left: 7 * (screen.getByTestId('editor-board').props.style.width / 8),
    });

    await fireEvent.press(screen.getByTestId('set-up-analyse'));
    expect(screen.getByTestId('analysis-board')).toBeTruthy();
  });
});
