import { Text, View } from 'react-native';

import Button from '../Button';
import { ILLUSTRATIONS, IllustrationName } from './illustrations';
import { makeStyles } from '../../theme';

interface EmptyStateProps {
  illustration: IllustrationName;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void; testID?: string };
  /** A smaller illustration, for sheets, popups and cards. */
  compact?: boolean;
  testID?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  illustration,
  title,
  message,
  action,
  compact = false,
  testID,
}) => {
  const styles = useStyles();

  const Illustration = ILLUSTRATIONS[illustration];
  return (
    <View style={[styles.container, compact && styles.compact]} testID={testID}>
      <Illustration size={compact ? 84 : 120} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="text"
          testID={action.testID}
        />
      )}
    </View>
  );
};

export default EmptyState;

const useStyles = makeStyles((t) => ({
  container: {
    alignItems: 'center',
    paddingHorizontal: t.spacing.xxl,
    paddingVertical: t.spacing.xl,
    gap: t.spacing.sm,
  },
  compact: {
    paddingVertical: t.spacing.md,
  },
  title: {
    color: t.colors.text,
    marginTop: t.spacing.sm,
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.semibold,
    textAlign: 'center',
  },
  message: {
    fontSize: t.fontSize.base,
    lineHeight: 20,
    color: t.colors.textMuted,
    textAlign: 'center',
  },
}));
