import { fireEvent, render } from '@testing-library/react-native';

import PopoverMenu from '.';
import { closePopoverMenuSpy } from '../../testUtils/popoverMenuStartingOpen';

jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
);

describe('PopoverMenu', () => {
  beforeEach(() => {
    closePopoverMenuSpy.mockClear();
  });

  it('shows the given trigger glyph, a vertical ellipsis by default', async () => {
    const defaultTrigger = await render(<PopoverMenu items={[]} />);
    expect(defaultTrigger.getByText('⋮')).toBeTruthy();

    const customTrigger = await render(
      <PopoverMenu items={[]} triggerLabel="⋯" />,
    );
    expect(customTrigger.getByText('⋯')).toBeTruthy();
  });

  it('renders each item with its label and optional icon', async () => {
    const screen = await render(
      <PopoverMenu
        items={[
          { label: 'Share & export', icon: '⇪', onPress: jest.fn() },
          { label: 'Plain item', onPress: jest.fn() },
        ]}
      />,
    );

    expect(screen.getByText('Share & export')).toBeTruthy();
    expect(screen.getByText('⇪')).toBeTruthy();
    expect(screen.getByText('Plain item')).toBeTruthy();
  });

  it("closes the menu and runs the item's action when it's pressed", async () => {
    const onShare = jest.fn();
    const screen = await render(
      <PopoverMenu
        items={[{ label: 'Share', onPress: onShare, testID: 'share-item' }]}
      />,
    );

    await fireEvent.press(screen.getByTestId('share-item'));

    expect(closePopoverMenuSpy).toHaveBeenCalledTimes(1);
    expect(onShare).toHaveBeenCalledTimes(1);
  });
});
