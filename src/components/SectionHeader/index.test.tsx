import { fireEvent, render } from '@testing-library/react-native';

import SectionHeader from '.';

const mockTitle = 'Test title';
const mockActionLabel = 'Test label';

describe('SectionHeader', () => {
  it('renders the title and action label', async () => {
    const screen = await render(
      <SectionHeader
        title={mockTitle}
        actionLabel={mockActionLabel}
        onActionPress={jest.fn()}
      />,
    );

    expect(screen.getByText(mockTitle)).toBeTruthy();
    expect(screen.getByText(mockActionLabel)).toBeTruthy();
  });

  it('calls onActionPress when the action is pressed', async () => {
    const onActionPress = jest.fn();
    const screen = await render(
      <SectionHeader
        title={mockTitle}
        actionLabel={mockActionLabel}
        onActionPress={onActionPress}
        testID="friends-see-all"
      />,
    );

    await fireEvent.press(screen.getByTestId('friends-see-all'));

    expect(onActionPress).toHaveBeenCalledTimes(1);
  });

  it('shows a count beside the title', async () => {
    const screen = await render(
      <SectionHeader title="Friends" count={12} testID="friends" />,
    );

    expect(screen.getByTestId('friends-count')).toHaveTextContent('12', {
      exact: false,
    });
  });
});
