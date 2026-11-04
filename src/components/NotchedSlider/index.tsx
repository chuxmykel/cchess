import { useRef } from 'react';
import { View } from 'react-native';
import Slider, { SliderProps } from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { makeStyles } from '../../theme';

// A slider that stops at its steps, and shows and feels it: a notch on the
// track at each one, and a tick under the finger as the thumb reaches the
// next - so it's plain where it can stop without watching the value.
const NotchedSlider: React.FC<SliderProps> = ({
  onValueChange,
  value,
  ...props
}) => {
  // The step the thumb is on - the native slider reports the same value
  // again as the finger moves within a step.
  const step = useRef(value);
  return (
    <Slider
      {...props}
      value={value}
      StepMarker={Notch}
      onValueChange={(next) => {
        if (next !== step.current) {
          step.current = next;
          Haptics.selectionAsync().catch(() => {});
        }
        onValueChange?.(next);
      }}
    />
  );
};

export default NotchedSlider;

// Drawn under the track and thumb, standing out above and below the track.
const Notch: React.FC = () => {
  const styles = useStyles();
  return <View style={styles.notch} />;
};

const useStyles = makeStyles((t) => ({
  notch: {
    width: 2,
    height: 12,
    borderRadius: 1,
    backgroundColor: t.colors.disabled,
  },
}));
