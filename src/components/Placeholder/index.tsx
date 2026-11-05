import { View, DimensionValue } from 'react-native';
import { makeStyles } from '../../theme';

interface PlaceholderProps {
  width: DimensionValue;
  height: number;
  testID?: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ width, height, testID }) => {
  const styles = useStyles();
  return (
    <View style={[styles.placeholder, { width, height }]} testID={testID} />
  );
};

export default Placeholder;

const useStyles = makeStyles((t) => ({
  placeholder: {
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.skeleton,
  },
}));
