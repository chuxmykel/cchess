import { act, fireEvent, render } from '@testing-library/react-native';

import GameNotes from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { NOTES_SAVE_DELAY_MS } from '../../hooks/useGameNotes';
import { getGameNotes, saveGameNotes } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getGameNotes: jest.fn(),
  saveGameNotes: jest.fn(),
}));

describe('GameNotes', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'token-a' }),
    );
    (getGameNotes as jest.Mock).mockResolvedValue({
      body: 'Push the h-pawn',
      updatedAt: null,
    });
    (saveGameNotes as jest.Mock).mockResolvedValue({
      body: '',
      updatedAt: null,
    });
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  async function renderNotes() {
    const screen = await render(
      withSafeArea(
        <GameNotes
          navigation={{} as never}
          route={
            {
              key: 'notes',
              name: 'GameNotes',
              params: { gameId: 'game-1' },
            } as never
          }
        />,
      ),
    );
    await act(async () => {});
    return screen;
  }

  it('keeps your notes, saving them once you stop typing', async () => {
    const screen = await renderNotes();

    expect(screen.getByTestId('notes-input').props.value).toBe(
      'Push the h-pawn',
    );
    await fireEvent.changeText(
      screen.getByTestId('notes-input'),
      'Push the h-pawn, then castle long',
    );
    expect(saveGameNotes).not.toHaveBeenCalled();

    await act(async () => jest.advanceTimersByTime(NOTES_SAVE_DELAY_MS));

    expect(saveGameNotes).toHaveBeenCalledWith(
      'game-1',
      'Push the h-pawn, then castle long',
      'token-a',
    );
  });

  it('saves what was typed on leaving', async () => {
    const screen = await renderNotes();

    await fireEvent.changeText(
      screen.getByTestId('notes-input'),
      'Trade queens',
    );
    await screen.unmount();

    expect(saveGameNotes).toHaveBeenCalledWith(
      'game-1',
      'Trade queens',
      'token-a',
    );
  });
});
