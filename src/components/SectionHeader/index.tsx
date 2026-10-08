import { View, Text, StyleSheet } from 'react-native';

import Button from '../Button';

interface SectionHeaderProps {
  title: string;
  actionLabel: string;
  onActionPress: () => void;
  testID?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
  testID,
}) => {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <Button
        label={actionLabel}
        onPress={onActionPress}
        variant="text"
        testID={testID}
      />
    </View>
  );
};

export default SectionHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
