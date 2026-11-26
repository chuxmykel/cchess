import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { HomeStackParamList } from '../HomeStack/types';
import type { HomeTabsParamList } from '../HomeTabs/types';

export type PuzzlesStackParamList = {
  Puzzles: undefined;
};

/** A Puzzles-tab screen's props, able to open the screens over the tabs -
 * a run of puzzles among them. */
export type PuzzlesStackScreenProps<T extends keyof PuzzlesStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<PuzzlesStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<HomeTabsParamList>,
      NativeStackScreenProps<HomeStackParamList>
    >
  >;
