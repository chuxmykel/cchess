import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import GameOverOverlay from '.';

describe('GameOverOverlay', () => {
  it('puts the result away when its backdrop is tapped', async () => {
    const onDismiss = jest.fn();
    const screen = await render(
      <GameOverOverlay onDismiss={onDismiss}>
        <Text>You won</Text>
      </GameOverOverlay>,
    );

    await fireEvent.press(screen.getByTestId('game-over-overlay'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("leaves the card's own buttons to the card", async () => {
    const onDismiss = jest.fn();
    const onNewOpponent = jest.fn();
    const screen = await render(
      <GameOverOverlay onDismiss={onDismiss}>
        <Pressable onPress={onNewOpponent} testID="new-opponent">
          <Text>New opponent</Text>
        </Pressable>
      </GameOverOverlay>,
    );

    await fireEvent.press(screen.getByTestId('new-opponent'));

    expect(onNewOpponent).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
