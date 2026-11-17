import { ReactElement } from 'react';
import { Platform } from 'react-native';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/** A header button, pressed through its props. */
type HeaderButton = ReactElement<{ onPress?: () => void }>;

/**
 * The header's right-hand button a screen set (`plainHeaderRight`), or
 * null: an iOS header item - which must show no glass circle - or
 * Android's `headerRight`.
 */
export function headerRightOf(
  options: NativeStackNavigationOptions,
): HeaderButton | null {
  if (Platform.OS === 'ios') {
    const [item] = options.unstable_headerRightItems?.({} as never) ?? [];
    if (!item) return null;
    expect(item).toEqual(
      expect.objectContaining({ type: 'custom', hidesSharedBackground: true }),
    );
    return (item as { element: HeaderButton }).element;
  }
  return (options.headerRight?.({} as never) as HeaderButton) ?? null;
}
