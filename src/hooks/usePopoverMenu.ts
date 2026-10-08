import { useRef, useState, RefObject } from "react";
import { View, useWindowDimensions } from "react-native";

const SCREEN_EDGE_MARGIN = 8;

export type MenuPosition = {
  top: number;
  left: number;
};

export type PopoverMenu = {
  triggerRef: RefObject<View>;
  visible: boolean;
  position: MenuPosition | null;
  open: () => void;
  close: () => void;
};

// Owns a popover's anchored position and open/closed state: measures the
// trigger's on-screen rect, clamps the menu horizontally so it stays within
// the window, and keeps the last position around after close so a fade-out
// animation plays from its anchored spot instead of snapping to (0, 0).
export function usePopoverMenu(menuWidth: number): PopoverMenu {
  const triggerRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const { width: windowWidth } = useWindowDimensions();

  function open() {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      const left = Math.min(
        Math.max(x + width - menuWidth, SCREEN_EDGE_MARGIN),
        windowWidth - menuWidth - SCREEN_EDGE_MARGIN
      );
      setPosition({ top: y + height + 4, left });
      setVisible(true);
    });
  }

  function close() {
    setVisible(false);
  }

  return { triggerRef, visible, position, open, close };
}
