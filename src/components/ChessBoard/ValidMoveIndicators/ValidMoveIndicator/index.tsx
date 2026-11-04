import { Animated } from 'react-native';
import { Position } from '../../../../domain/types';
import { makeStyles } from '../../../../theme';

interface ValidMoveIndicatorProps {
  position: Position;
  squareWidth: number;
  opacity: Animated.Value;
  testID?: string;
}

const ValidMoveIndicator: React.FC<ValidMoveIndicatorProps> = ({
  position,
  squareWidth,
  opacity,
  testID,
}) => {
  const styles = useStyles();

  const indicatorDiameter = squareWidth / 3;
  const offsetToCenter = indicatorDiameter;
  return (
    <Animated.View
      pointerEvents="none"
      testID={testID}
      style={{
        ...styles.container,
        borderRadius: indicatorDiameter / 2,
        top: offsetToCenter,
        left: offsetToCenter,
        height: indicatorDiameter,
        width: indicatorDiameter,
        opacity,
        transform: [{ translateX: position.x }, { translateY: position.y }],
      }}
    />
  );
};

export default ValidMoveIndicator;

const useStyles = makeStyles((t) => ({
  container: {
    position: 'absolute',
    backgroundColor: t.colors.board.moveHint,
  },
}));
