import { NavigatorScreenParams } from '@react-navigation/native';

import { AnalysisStackParamList } from '../AnalysisStack/types';

export type HomeTabsParamList = {
  HomeTabStack: undefined;
  AnalysisStack: NavigatorScreenParams<AnalysisStackParamList> | undefined;
  Profile: undefined;
};
