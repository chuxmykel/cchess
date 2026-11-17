import { ReactElement } from 'react';
import { Platform } from 'react-native';
import {
  NativeStackHeaderItemCustom,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

import HeaderBackButton from '../components/HeaderBackButton';

type BackNavigation = { canGoBack: () => boolean; goBack: () => void };

/**
 * A header item without the glass circle iOS 26 and later put behind
 * header buttons. iOS's alone, as header items are: `plainHeaderRight`
 * gives Android its own.
 */
export function plainHeaderItem(
  element: ReactElement,
): NativeStackHeaderItemCustom {
  return { type: 'custom', element, hidesSharedBackground: true };
}

/**
 * A header's right-hand button, or none: a plain item on iOS (header items
 * are iOS's alone), and the header's right on Android.
 */
export function plainHeaderRight(
  element: ReactElement | null,
): NativeStackNavigationOptions {
  return Platform.OS === 'ios'
    ? {
        unstable_headerRightItems: () =>
          element ? [plainHeaderItem(element)] : [],
      }
    : { headerRight: element ? () => element : undefined };
}

/**
 * A shown header with no line under it, and on iOS a plain chevron back
 * button in place of the native one and its glass circle - Android keeps
 * its own back arrow, header items being iOS's alone.
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

/** A tab's first screen: a back button there would only switch to the
 * first tab, which the tab bar already does. */
export const tabRootHeaderOptions: NativeStackNavigationOptions = {
  unstable_headerLeftItems: () => [],
};
