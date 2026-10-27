import { fireEvent, render } from '@testing-library/react-native';

import SegmentedTabs from '.';

describe('SegmentedTabs', () => {
  it('marks the selected tab and reports another being chosen', async () => {
    const onSelect = jest.fn();
    const screen = await render(
      <SegmentedTabs
        tabs={[
          { key: 'online', label: '1 online' },
          { key: 'all', label: '10 friends' },
        ]}
        selected="online"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByTestId('tab-online')).toBeSelected();
    await fireEvent.press(screen.getByTestId('tab-all'));
    expect(onSelect).toHaveBeenCalledWith('all');
  });
});
