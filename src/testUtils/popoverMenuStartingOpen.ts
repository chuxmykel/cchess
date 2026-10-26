import { useState } from 'react';

export const closePopoverMenuSpy = jest.fn();

export function usePopoverMenu() {
  const [visible, setVisible] = useState(true);
  return {
    triggerRef: { current: null },
    visible,
    position: { top: 0, left: 0 },
    open: () => setVisible(true),
    close: () => {
      closePopoverMenuSpy();
      setVisible(false);
    },
  };
}
