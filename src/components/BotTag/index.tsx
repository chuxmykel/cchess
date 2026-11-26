import { Text, View } from 'react-native';

import { makeStyles } from '../../theme';

// "BOT", in a small pill beside a computer opponent's name - a house bot -
// so nobody takes it for a person.
const BotTag: React.FC<{ testID?: string }> = ({ testID }) => {
  const styles = useStyles();
  return (
    <View
      style={styles.pill}
      accessibilityLabel="Computer opponent"
      testID={testID}
    >
      <Text style={styles.text}>BOT</Text>
    </View>
  );
};

export default BotTag;

const useStyles = makeStyles((t) => ({
  pill: {
    paddingHorizontal: t.spacing.xs,
    paddingVertical: t.spacing.xxs,
    borderRadius: t.radius.xs,
    backgroundColor: t.colors.accentSubtle,
  },
  text: {
    color: t.colors.accentText,
    fontSize: t.fontSize.xxs,
    fontWeight: t.fontWeight.bold,
    letterSpacing: 0.5,
  },
}));
