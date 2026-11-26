import { createURL } from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';

import { SERVER_URL } from '../network/env';
import { RootStackParamList } from './HomeStack/types';

/** The links that open the app: account emails' verify and reset links on
 * the server's own domain (universal links / app links, in app.json), and
 * the same paths under the cchess:// scheme - or, in Expo Go, its own
 * (exp://<metro>/--/app/...), which createURL gives. Home stays beneath
 * them, so Back leads there. */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [createURL('/'), 'cchess://', 'https://api.chux.dev', SERVER_URL],
  config: {
    screens: {
      HomeStack: {
        initialRouteName: 'HomeTabs',
        screens: {
          VerifyEmail: 'app/verify-email',
          ResetPassword: 'app/reset-password',
        },
      },
    },
  },
};
