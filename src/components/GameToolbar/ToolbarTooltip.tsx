import { StyleSheet, Text, View } from 'react-native';

interface ToolbarTooltipProps {
  text: string;
  // How far to move the bubble sideways to keep it on screen - null until
  // it's been measured, and it's kept hidden till then.
  shift: number | null;
  onMeasured: (width: number) => void;
}

// How close a tooltip may come to the screen's edges.
export const TOOLTIP_SCREEN_MARGIN = 8;
const MAX_WIDTH = 240;

/**
 * How far a tooltip centred over a button has to move sideways to stay on
 * screen: none when it fits, else just enough to come in from the edge.
 */
export function tooltipShift(
  anchorX: number,
  anchorWidth: number,
  tooltipWidth: number,
  screenWidth: number,
): number {
  const left = anchorX + anchorWidth / 2 - tooltipWidth / 2;
  const maxLeft = screenWidth - TOOLTIP_SCREEN_MARGIN - tooltipWidth;
  const clamped = Math.max(TOOLTIP_SCREEN_MARGIN, Math.min(left, maxLeft));
  return clamped - left;
}

// What a toolbar button does, in a bubble above it while it's held. Its
// arrow stays over the button when the bubble moves in from an edge.
const ToolbarTooltip: React.FC<ToolbarTooltipProps> = ({
  text,
  shift,
  onMeasured,
}) => (
  <View
    style={[styles.container, shift === null && styles.measuring]}
    pointerEvents="none"
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    testID="toolbar-tooltip"
  >
    <View
      style={[styles.bubble, { transform: [{ translateX: shift ?? 0 }] }]}
      onLayout={(event) => onMeasured(event.nativeEvent.layout.width)}
    >
      <Text style={styles.text}>{text}</Text>
    </View>
    <View style={styles.arrow} />
  </View>
);

export default ToolbarTooltip;

const styles = StyleSheet.create({
  // As wide as the longest tooltip and centred on the button, so the
  // bubble can be wider than the button without its text wrapping.
  container: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    width: MAX_WIDTH,
    marginLeft: -MAX_WIDTH / 2,
    marginBottom: 4,
    alignItems: 'center',
  },
  measuring: {
    opacity: 0,
  },
  bubble: {
    maxWidth: MAX_WIDTH,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  text: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  arrow: {
    width: 10,
    height: 10,
    marginTop: -6,
    backgroundColor: '#333',
    transform: [{ rotate: '45deg' }],
  },
});
