import { act, fireEvent, render } from '@testing-library/react-native';

import Account from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { setChatWithStrangers } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { isSwitchOn } from '../../testUtils/switch';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  setChatWithStrangers: jest.fn(),
}));

describe('Account', () => {
  function renderAs(chatWithStrangers: boolean) {
    const session = makeAuthSession({
      user: { isGuest: false, chatWithStrangers },
    });
    (useAuthSession as jest.Mock).mockReturnValue(session);
    const navigation = { navigate: jest.fn() };
    return {
      screenPromise: render(<Account navigation={navigation} />),
      navigation,
      session,
    };
  }

  afterEach(() => jest.clearAllMocks());

  it.each([
    ['blocked-players-row', 'BlockedPlayers'],
    ['delete-account-row', 'DeleteAccount'],
  ])('%s opens %s', async (testID, route) => {
    const { screenPromise, navigation } = renderAs(false);
    const screen = await screenPromise;
    await fireEvent.press(screen.getByTestId(testID));
    expect(navigation.navigate).toHaveBeenCalledWith(route);
  });

  it('turns chat with strangers on, saved on the server', async () => {
    (setChatWithStrangers as jest.Mock).mockResolvedValue({});
    const { screenPromise, session } = renderAs(false);
    const screen = await screenPromise;
    const toggle = screen.getByTestId('chat-with-strangers-switch');
    expect(isSwitchOn(toggle)).toBe(false);

    await fireEvent(toggle, 'valueChange', true);
    await act(async () => {});

    expect(setChatWithStrangers).toHaveBeenCalledWith(true, 'access-token');
    expect(session.reloadUser).toHaveBeenCalled();
    expect(isSwitchOn(screen.getByTestId('chat-with-strangers-switch'))).toBe(
      true,
    );
  });
});
