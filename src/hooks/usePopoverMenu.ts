import { useRef, useState, RefObject } from 'react';
import { useWindowDimensions, type ViewInstance } from 'react-native';

export const SCREEN_EDGE_MARGIN = 8;
export const RIGHT_PLACEMENT_GAP = 8;
export const BELOW_PLACEMENT_GAP = 4;

export type MenuPosition = {
  top: number;
  left: number;
};

export type PopoverPlacement = 'below' | 'right';

export type UsePopoverMenuOptions = {
  // 'below' (the default) anchors under the trigger's right edge, like a
  // dropdown menu. 'right' anchors to the right of the trigger, vertically
  // centered on it, like a tooltip - menuHeight is needed to center it since
  // there's no dropdown edge to hang off of.
  placement?: PopoverPlacement;
  menuHeight?: number;
};

export type PopoverMenu = {
  triggerRef: RefObject<ViewInstance>;
  visible: boolean;
  position: MenuPosition | null;
  open: () => void;
  close: () => void;
};

// Owns a popover's anchored position and open/closed state: measures the
// trigger's on-screen rect, clamps the menu horizontally so it stays within
// the window, and keeps the last position around after close so a fade-out
// animation plays from its anchored spot instead of snapping to (0, 0).
export function usePopoverMenu(
  menuWidth: number,
  { placement = 'below', menuHeight = 0 }: UsePopoverMenuOptions = {},
): PopoverMenu {
  const triggerRef = useRef<ViewInstance>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const { width: windowWidth } = useWindowDimensions();

  function open() {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      if (placement === 'right') {
        const left = Math.min(
          x + width + RIGHT_PLACEMENT_GAP,
          windowWidth - menuWidth - SCREEN_EDGE_MARGIN,
        );
        setPosition({ top: y + height / 2 - menuHeight / 2, left });
        setVisible(true);
        return;
      }

      const left = Math.min(
        Math.max(x + width - menuWidth, SCREEN_EDGE_MARGIN),
        windowWidth - menuWidth - SCREEN_EDGE_MARGIN,
      );
      setPosition({ top: y + height + BELOW_PLACEMENT_GAP, left });
      setVisible(true);
    });
  }

  function close() {
    setVisible(false);
  }

  return { triggerRef, visible, position, open, close };
}
