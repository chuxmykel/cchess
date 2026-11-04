import { View, Text } from 'react-native';

import Button from '../Button';
import { makeStyles } from '../../theme';

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
  const styles = useStyles();

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

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: t.spacing.lg,
    marginBottom: t.spacing.md,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.semibold,
  },
  count: {
    fontWeight: t.fontWeight.regular,
    color: t.colors.textMuted,
  },
}));
