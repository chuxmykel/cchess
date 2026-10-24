import { useState } from 'react';

import { fireEvent, render } from '@testing-library/react-native';

import ConnectionStrengthIndicator from '.';
import { useConnectionStrengthIndicator } from '../../hooks/useConnectionStrengthIndicator';

jest.mock('../../hooks/useConnectionStrengthIndicator');

function mockResult(overrides: {
  litBars?: number;
  label?: string;
  visible?: boolean;
  open?: jest.Mock;
  close?: jest.Mock;
}) {
  const open = overrides.open ?? jest.fn();
  const close = overrides.close ?? jest.fn();
  (useConnectionStrengthIndicator as jest.Mock).mockReturnValue({
    litBars: overrides.litBars ?? 4,
    label: overrides.label ?? '42ms',
    popover: {
      triggerRef: { current: null },
      visible: overrides.visible ?? false,
      position: { top: 0, left: 0 },
      open,
      close,
    },
  });
  return { open, close };
}

describe('ConnectionStrengthIndicator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not show the latency label while the popover is closed', async () => {
    mockResult({ label: '42ms', visible: false });

    const screen = await render(<ConnectionStrengthIndicator />);

    expect(screen.queryByText('42ms')).toBeNull();
  });

  it('shows the latency label once the popover is open', async () => {
    mockResult({ label: '42ms', visible: true });

    const screen = await render(<ConnectionStrengthIndicator />);

    expect(screen.getByText('42ms')).toBeTruthy();
  });

  it('opens the popover when the bars are tapped', async () => {
    const { open } = mockResult({ visible: false });

    const screen = await render(<ConnectionStrengthIndicator />);
    await fireEvent.press(screen.getByTestId('connection-strength-indicator'));

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('shows the popover with the latency label once the trigger is pressed', async () => {
    (useConnectionStrengthIndicator as jest.Mock).mockImplementation(() => {
      const [visible, setVisible] = useState(false);
      return {
        litBars: 4,
        label: '42ms',
        popover: {
          triggerRef: { current: null },
          visible,
          position: { top: 0, left: 0 },
          open: () => setVisible(true),
          close: () => setVisible(false),
        },
      };
    });

    const screen = await render(<ConnectionStrengthIndicator />);
    expect(screen.queryByText('42ms')).toBeNull();

    await fireEvent.press(screen.getByTestId('connection-strength-indicator'));

    expect(screen.getByText('42ms')).toBeTruthy();
  });

  it('closes the popover when the overlay is tapped', async () => {
    const label = '100ms';
    const close = jest.fn();
    (useConnectionStrengthIndicator as jest.Mock).mockImplementation(() => {
      const [visible, setVisible] = useState(true);
      return {
        litBars: 4,
        label,
        popover: {
          triggerRef: { current: null },
          visible,
          position: { top: 0, left: 0 },
          open: () => setVisible(true),
          close: () => {
            close();
            setVisible(false);
          },
        },
      };
    });

    const screen = await render(<ConnectionStrengthIndicator />);
    expect(screen.getByText(label)).toBeTruthy();

    await fireEvent.press(
      screen.getByTestId('connection-strength-popover-overlay'),
    );

    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(label)).toBeNull();
  });
});
