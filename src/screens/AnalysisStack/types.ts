import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HomeStackParamList } from '../HomeStack/types';
import { HomeTabsParamList } from '../HomeTabs/types';

export type AnalysisStackParamList = {
  AnalysisHome: undefined;
  PasteGame: undefined;
  PickGame: undefined;
};

/** An Analysis-tab screen's props, able to switch tabs and open the
 * screens shown over them. */
export type AnalysisStackScreenProps<
  RouteName extends keyof AnalysisStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<AnalysisStackParamList, RouteName>,
  CompositeScreenProps<
    BottomTabScreenProps<HomeTabsParamList>,
    NativeStackScreenProps<HomeStackParamList>
  >
>;
