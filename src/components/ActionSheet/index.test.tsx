import { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ActionSheet, { ActionSheetAction } from '.';
import { withSafeArea } from '../../testUtils/safeArea';
import { waitForSheetToClose } from '../../testUtils/modal';

function ActionSheetWithParentState({
  onClose,
  actions,
}: {
  onClose: () => void;
  actions: ActionSheetAction[];
}) {
  const [visible, setVisible] = useState(true);
  return (
    <ActionSheet
      visible={visible}
      onClose={() => {
        onClose();
        setVisible(false);
      }}
      actions={actions}
    />
  );
}

describe('ActionSheet', () => {
  function renderSheet(onClose = jest.fn(), onFlip = jest.fn()) {
    return render(
      withSafeArea(
        <ActionSheetWithParentState
          onClose={onClose}
          actions={[
            { label: 'Flip board', onPress: onFlip, testID: 'flip-action' },
            { label: 'Resign', onPress: jest.fn(), destructive: true },
          ]}
        />,
      ),
    );
  }

  it('lists every action plus Cancel', async () => {
    const screen = await renderSheet();

    expect(screen.getByText('Flip board')).toBeTruthy();
    expect(screen.getByText('Resign')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('closes the sheet, then runs the chosen action once it is gone', async () => {
    const onClose = jest.fn();
    const onFlip = jest.fn();
    const screen = await renderSheet(onClose, onFlip);

    await fireEvent.press(screen.getByTestId('flip-action'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFlip).not.toHaveBeenCalled();

    await waitForSheetToClose();

    expect(onFlip).toHaveBeenCalledTimes(1);
  });

  it('runs an immediate action as soon as it is chosen, as the sheet closes', async () => {
    const onClose = jest.fn();
    const onFlip = jest.fn();
    const screen = await render(
      withSafeArea(
        <ActionSheetWithParentState
          onClose={onClose}
          actions={[
            {
              label: 'Flip board',
              onPress: onFlip,
              immediate: true,
              testID: 'flip-action',
            },
          ]}
        />,
      ),
    );

    await fireEvent.press(screen.getByTestId('flip-action'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFlip).toHaveBeenCalledTimes(1);

    await waitForSheetToClose();

    expect(onFlip).toHaveBeenCalledTimes(1);
  });

  it('only closes the sheet on Cancel', async () => {
    const onClose = jest.fn();
    const onFlip = jest.fn();
    const screen = await renderSheet(onClose, onFlip);

    await fireEvent.press(screen.getByTestId('action-sheet-cancel'));
    await waitForSheetToClose();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFlip).not.toHaveBeenCalled();
  });

  it('shows destructive actions in red', async () => {
    const screen = await renderSheet();

    expect(screen.getByText('Resign')).toHaveStyle({ color: '#e53935' });
    expect(screen.getByText('Flip board')).not.toHaveStyle({
      color: '#e53935',
    });
  });
});
