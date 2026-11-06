import { View, Text } from 'react-native';

import Button from '../Button';
import { makeStyles } from '../../theme';

interface SectionHeaderProps {
  title: string;
  /** How many there are, in a small pill beside the title. */
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
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        {count !== undefined && (
          <View style={styles.pill}>
            <Text style={styles.count} testID={testID && `${testID}-count`}>
              {count}
            </Text>
          </View>
        )}
      </View>
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
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.semibold,
  },
  pill: {
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xxs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceSubtle,
  },
  count: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
}));
