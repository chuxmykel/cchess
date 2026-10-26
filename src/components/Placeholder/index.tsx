import { View, StyleSheet, DimensionValue } from 'react-native';

interface PlaceholderProps {
  width: DimensionValue;
  height: number;
  testID?: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ width, height, testID }) => (
  <View style={[styles.placeholder, { width, height }]} testID={testID} />
);

export default Placeholder;

const styles = StyleSheet.create({
  placeholder: {
    borderRadius: 6,
    backgroundColor: '#e6e6e6',
  },
});
