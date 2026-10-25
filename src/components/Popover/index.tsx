import {
  View,
  Pressable,
  Modal,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { MenuPosition } from '../../hooks/usePopoverMenu';

export type CaretSide = 'top' | 'bottom' | 'left' | 'right';

// Shared tap-target padding for the Pressable that opens a Popover - not
// applied by Popover itself, since the trigger always belongs to the
// consumer (PopoverMenu, ConnectionStrengthIndicator, ...), but kept here so
// every trigger across the app enlarges its tap target by the same amount.
export const POPOVER_TRIGGER_HIT_SLOP = 8;

interface PopoverProps {
  visible: boolean;
  position: MenuPosition | null;
  onClose: () => void;
  width?: number;
  // Attaches a caret to the given edge, centered on it. Omitted entirely by
  // default (e.g. PopoverMenu's dropdown doesn't want one) - opt in per use.
  caretSide?: CaretSide;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
  overlayTestID?: string;
  children: React.ReactNode;
}

// How far the tip pokes out from the content box, and the span of its base.
const CARET_DEPTH = 8;
const CARET_SPAN = 12;
// The caret overlaps *into* the content box by this much (rather than
// stopping exactly at its edge) so content's own opaque fill - painted
// after the caret, so on top - comfortably covers the join with no sliver
// gap from sub-pixel rounding.
const OVERLAP = 2;
const CARET_COLOR = 'white';

// The Modal/overlay/anchored-box plumbing shared by every popover in the
// app (PopoverMenu's dropdown, ConnectionStrengthIndicator's info bubble,
// ...). The optional caret is the classic zero-size CSS border-triangle
// (transparent borders on two sides, a solid color on the third) rather
// than a rotated bordered square: it has no border or shadow decoration of
// its own at all, just a flat fill matching the content box exactly, so
// there's no second outline/shadow geometry to misalign with content's own
// at the join. The content box itself also has no border or shadow, for
// the same reason: either one traces content's *entire* rect, including
// the segment directly behind the caret, drawing a line straight across
// exactly where the triangle's base meets it. Three earlier attempts (a
// shared blurred shadow, a bordered rotated square, then a hairline border
// on content alone) each left a visible seam for one of these reasons.
// With nothing decorative on any edge anywhere, there's nothing left to
// misalign - the content box, painted after the caret, simply covers the
// small overlap and the triangle continues as its plain edge from there.
const Popover: React.FC<PopoverProps> = ({
  visible,
  position,
  onClose,
  width,
  caretSide,
  contentStyle,
  testID,
  overlayTestID,
  children,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        testID={overlayTestID}
      >
        <View
          style={[
            styles.wrapper,
            position && { top: position.top, left: position.left },
            width !== undefined && { width },
          ]}
        >
          {caretSide && (
            <View
              style={CARET_PLACEMENT[caretSide]}
              testID={testID && `${testID}-caret`}
            />
          )}
          <View style={[styles.content, contentStyle]} testID={testID}>
            {children}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default Popover;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  wrapper: {
    position: 'absolute',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 8,
    // No border (and no shadow - see the file-level note) - a border here
    // would trace content's full rect including the segment right behind
    // the caret, drawing a line straight across exactly where the
    // triangle's base meets it. Nothing decorative on any edge anywhere is
    // what actually makes the two pieces read as one shape.
  },
});

const AXIS_OFFSET = OVERLAP - CARET_DEPTH;
const HALF_SPAN = CARET_SPAN / 2;

const CARET_PLACEMENT: Record<CaretSide, ViewStyle> = {
  left: {
    position: 'absolute',
    left: AXIS_OFFSET,
    top: '50%',
    marginTop: -HALF_SPAN,
    width: 0,
    height: 0,
    borderTopWidth: HALF_SPAN,
    borderBottomWidth: HALF_SPAN,
    borderRightWidth: CARET_DEPTH,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: CARET_COLOR,
  },
  right: {
    position: 'absolute',
    right: AXIS_OFFSET,
    top: '50%',
    marginTop: -HALF_SPAN,
    width: 0,
    height: 0,
    borderTopWidth: HALF_SPAN,
    borderBottomWidth: HALF_SPAN,
    borderLeftWidth: CARET_DEPTH,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: CARET_COLOR,
  },
  top: {
    position: 'absolute',
    top: AXIS_OFFSET,
    left: '50%',
    marginLeft: -HALF_SPAN,
    width: 0,
    height: 0,
    borderLeftWidth: HALF_SPAN,
    borderRightWidth: HALF_SPAN,
    borderBottomWidth: CARET_DEPTH,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: CARET_COLOR,
  },
  bottom: {
    position: 'absolute',
    bottom: AXIS_OFFSET,
    left: '50%',
    marginLeft: -HALF_SPAN,
    width: 0,
    height: 0,
    borderLeftWidth: HALF_SPAN,
    borderRightWidth: HALF_SPAN,
    borderTopWidth: CARET_DEPTH,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: CARET_COLOR,
  },
};
