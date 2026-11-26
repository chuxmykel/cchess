import { Linking, Pressable, Text, View } from 'react-native';

import Icon from '../Icon';
import { PRIVACY_URL, TERMS_URL } from '../../constants/legal';
import { makeStyles, useTheme } from '../../theme';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** "I accept the terms of use and privacy policy", each a link. */
const TermsCheckbox: React.FC<TermsCheckboxProps> = ({ checked, onChange }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(!checked)}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel="Accept the terms of use and privacy policy"
        testID="accept-terms-checkbox"
      >
        <Icon
          name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={checked ? colors.accent : colors.textMuted}
        />
      </Pressable>
      <Text style={styles.text}>
        I accept the{' '}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL(TERMS_URL)}
          testID="terms-link"
        >
          terms of use
        </Text>{' '}
        and the{' '}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL(PRIVACY_URL)}
          testID="privacy-link"
        >
          privacy policy
        </Text>
        , and I&apos;m 13 or older.
      </Text>
    </View>
  );
};

export default TermsCheckbox;

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.spacing.sm,
  },
  text: {
    flex: 1,
    color: t.colors.textSecondary,
    fontSize: t.fontSize.base,
    lineHeight: t.fontSize.base * 1.5,
  },
  link: {
    color: t.colors.accent,
    textDecorationLine: 'underline',
  },
}));
