import { View, DimensionValue } from 'react-native';
import { makeStyles } from '../../theme';

interface PlaceholderProps {
  width: DimensionValue;
  height: number;
  /** Its corners - half its size for a round one, an avatar's. */
  borderRadius?: number;
  testID?: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({
  width,
  height,
  borderRadius,
  testID,
}) => {
  const styles = useStyles();
  return (
    <View
      style={[
        styles.placeholder,
        { width, height },
        borderRadius !== undefined && { borderRadius },
      ]}
      testID={testID}
    />
  );
};

export default Placeholder;

const useStyles = makeStyles((t) => ({
  placeholder: {
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.skeleton,
  },
}));
