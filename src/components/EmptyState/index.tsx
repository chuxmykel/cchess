import { StyleSheet, Text, View } from 'react-native';

import Button from '../Button';
import { ILLUSTRATIONS, IllustrationName } from './illustrations';
import { MUTED_COLOR } from '../../constants/colors';

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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 6,
  },
  compact: {
    paddingVertical: 12,
  },
  title: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED_COLOR,
    textAlign: 'center',
  },
});
