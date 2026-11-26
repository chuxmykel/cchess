import { ActivityIndicator, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { useEmailVerification } from '../../hooks/useEmailVerification';
import { makeStyles, useTheme } from '../../theme';
import { HomeStackParamList } from '../HomeStack/types';

type VerifyEmailProps = NativeStackScreenProps<
  HomeStackParamList,
  'VerifyEmail'
>;

/** Opened by a verify link from an email: confirms the address at once. */
const VerifyEmail: React.FC<VerifyEmailProps> = ({ navigation, route }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const state = useEmailVerification(route.params.token);

  return (
    <View style={styles.screen} testID="verify-email-screen">
      {state.status === 'verifying' ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <>
          <Icon
            name={
              state.status === 'verified'
                ? 'check-circle-outline'
                : 'alert-circle-outline'
            }
            size={48}
            color={state.status === 'verified' ? colors.accent : colors.danger}
          />
          <Text style={styles.text} testID="verify-email-result">
            {state.status === 'verified'
              ? `${state.email} is confirmed.`
              : state.message}
          </Text>
          <Button
            label="Done"
            onPress={() => navigation.popToTop()}
            testID="verify-email-done"
          />
        </>
      )}
    </View>
  );
};

export default VerifyEmail;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.lg,
    padding: t.spacing.xl,
    backgroundColor: t.colors.background,
  },
  text: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    textAlign: 'center',
  },
}));
