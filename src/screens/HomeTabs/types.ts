import { NavigatorScreenParams } from '@react-navigation/native';

import { MenuStackParamList } from '../MenuStack/types';
import { MessagesStackParamList } from '../MessagesStack/types';

export type HomeTabsParamList = {
  HomeTabStack: undefined;
  PuzzlesStack: undefined;
  MessagesStack: NavigatorScreenParams<MessagesStackParamList> | undefined;
  MenuStack: NavigatorScreenParams<MenuStackParamList> | undefined;
};
