import { fireEvent, render } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { DEFAULT_POSITION } from 'chess.js';

import PasteGame from '.';

describe('PasteGame', () => {
  async function renderPaste() {
    const navigation = { navigate: jest.fn() };
    const screen = await render(<PasteGame navigation={navigation} />);
    return { screen, navigation };
  }

  it('analyses a pasted PGN', async () => {
    const { screen, navigation } = await renderPaste();

    await fireEvent.changeText(
      screen.getByTestId('paste-game-input'),
      '1. e4 e5 2. Nf3',
    );
    await fireEvent.press(screen.getByTestId('paste-game-analyse'));

    expect(navigation.navigate).toHaveBeenCalledWith('AnalysisBoard', {
      source: {
        kind: 'import',
        startFen: DEFAULT_POSITION,
        uciMoves: ['e2e4', 'e7e5', 'g1f3'],
      },
    });
  });

  it("says what's wrong with text it can't read, until it's changed", async () => {
    const { screen, navigation } = await renderPaste();
    const input = screen.getByTestId('paste-game-input');

    await fireEvent.changeText(input, 'not chess');
    await fireEvent.press(screen.getByTestId('paste-game-analyse'));
    expect(screen.getByTestId('paste-game-error')).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalled();

    await fireEvent.changeText(input, 'not chess at all');
    expect(screen.queryByTestId('paste-game-error')).toBeNull();
  });

  it('puts the keyboard away after a paste, but not while typing', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const { screen } = await renderPaste();
    const input = screen.getByTestId('paste-game-input');

    await fireEvent.changeText(input, '1');
    await fireEvent.changeText(input, '1.');
    expect(dismiss).not.toHaveBeenCalled();

    await fireEvent.changeText(input, '1. e4 e5 2. Nf3 Nc6 3. Bb5');
    expect(dismiss).toHaveBeenCalledTimes(1);
    dismiss.mockRestore();
  });
});
