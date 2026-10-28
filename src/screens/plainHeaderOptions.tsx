import { ReactElement } from 'react';
import {
  NativeStackHeaderItemCustom,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

import HeaderBackButton from '../components/HeaderBackButton';

type BackNavigation = { canGoBack: () => boolean; goBack: () => void };

/**
 * A header item without the glass circle iOS 26 and later put behind
 * header buttons.
 */
export function plainHeaderItem(
  element: ReactElement,
): NativeStackHeaderItemCustom {
  return { type: 'custom', element, hidesSharedBackground: true };
}

/**
 * A shown header with no line under it, and a plain chevron back button
 * in place of the native one and its glass circle.
 */
export function plainHeaderOptions(
  navigation: BackNavigation,
): NativeStackNavigationOptions {
  return {
    headerShown: true,
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    unstable_headerLeftItems: () =>
      navigation.canGoBack()
        ? [plainHeaderItem(<HeaderBackButton onPress={navigation.goBack} />)]
        : [],
  };
}
