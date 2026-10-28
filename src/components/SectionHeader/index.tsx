import { View, Text, StyleSheet } from 'react-native';

import Button from '../Button';
import { MUTED_COLOR } from '../../constants/colors';

interface SectionHeaderProps {
  title: string;
  /** How many there are, shown beside the title. */
  count?: number;
  actionLabel?: string;
  onActionPress?: () => void;
  testID?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  actionLabel,
  onActionPress,
  testID,
}) => {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>
        {title}
        {count !== undefined && (
          <Text style={styles.count} testID={testID && `${testID}-count`}>
            {'  '}
            {count}
          </Text>
        )}
      </Text>
      {actionLabel && onActionPress && (
        <Button
          label={actionLabel}
          onPress={onActionPress}
          variant="text"
          testID={testID}
        />
      )}
    </View>
  );
};

export default SectionHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  count: {
    fontWeight: '400',
    color: MUTED_COLOR,
  },
});
