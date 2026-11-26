import { Linking, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../Button';
import Icon from '../Icon';
import { STORE_URL } from '../../constants/stores';
import { makeStyles, useTheme } from '../../theme';

/** In place of the app, when it's older than the server still supports. */
const UpdateRequired: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.screen, { paddingTop: insets.top }]}
      testID="update-required"
    >
      <Icon name="cellphone-arrow-down" size={56} color={colors.accent} />
      <Text style={styles.title}>Time to update</Text>
      <Text style={styles.text}>
        This version of cchess no longer works with our server. Update it to
        keep playing.
      </Text>
      <Button
        label="Update cchess"
        onPress={() => Linking.openURL(STORE_URL)}
        testID="update-button"
      />
    </View>
  );
};

export default UpdateRequired;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.lg,
    padding: t.spacing.xl,
    backgroundColor: t.colors.background,
  },
  title: {
    ...t.typography.title,
    color: t.colors.text,
  },
  text: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    textAlign: 'center',
  },
}));
