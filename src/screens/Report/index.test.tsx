import { fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import Report from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { blockUser, reportUser } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { withSafeArea } from '../../testUtils/safeArea';
import { ReportTarget } from '../HomeStack/types';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  reportUser: jest.fn(),
  blockUser: jest.fn(),
}));

describe('Report', () => {
  async function renderScreen(target: ReportTarget) {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    const navigation = { goBack: jest.fn() };
    const props = {
      navigation,
      route: { key: 'Report', name: 'Report', params: target },
    } as unknown as Parameters<typeof Report>[0];
    return {
      screen: await render(withSafeArea(<Report {...props} />)),
      navigation,
    };
  }

  beforeEach(() => {
    (reportUser as jest.Mock).mockResolvedValue(undefined);
    (blockUser as jest.Mock).mockResolvedValue(undefined);
  });
  afterEach(() => jest.clearAllMocks());

  it('reports a message with the reason chosen, then thanks you', async () => {
    const { screen } = await renderScreen({
      username: 'bob',
      displayName: 'Bob',
      gameId: 'g1',
      messageId: 'm1',
      messageText: 'rude words',
    });
    expect(screen.getByTestId('report-message')).toHaveTextContent(
      '"rude words"',
    );

    await fireEvent.press(screen.getByTestId('account-form-submit'));
    expect(reportUser).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('report-reason-abuse'));
    await fireEvent.changeText(screen.getByTestId('report-details'), ' again ');
    await fireEvent.press(screen.getByTestId('account-form-submit'));

    expect(reportUser).toHaveBeenCalledWith(
      {
        username: 'bob',
        reason: 'abuse',
        details: 'again',
        gameId: 'g1',
        messageId: 'm1',
      },
      'access-token',
    );
    expect(screen.getByTestId('report-sent')).toBeTruthy();
  });

  it('offers to block them afterwards, asking first', async () => {
    const alert = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) =>
        buttons?.find((button) => button.text === 'Block')?.onPress?.(),
      );
    const { screen, navigation } = await renderScreen({
      username: 'bob',
      displayName: 'Bob',
    });

    await fireEvent.press(screen.getByTestId('report-reason-spam'));
    await fireEvent.press(screen.getByTestId('account-form-submit'));
    await fireEvent.press(screen.getByTestId('report-block-button'));

    expect(alert).toHaveBeenCalledWith(
      'Block Bob?',
      expect.any(String),
      expect.any(Array),
      expect.any(Object),
    );
    expect(blockUser).toHaveBeenCalledWith('bob', 'access-token');
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
