import { View, Text } from 'react-native';

import Button from '../Button';
import CountPill from '../CountPill';
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
          <CountPill count={count} testID={testID && `${testID}-count`} />
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
}));
