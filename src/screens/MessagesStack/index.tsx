import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Messages from '../Messages';
import {
  plainHeaderOptions,
  tabRootHeaderOptions,
} from '../plainHeaderOptions';
import { MessagesStackParamList } from './types';

const { Navigator, Screen } =
  createNativeStackNavigator<MessagesStackParamList>();

// The Messages tab: your conversations. Each opens HomeStack's
// Conversation, over the tabs.
const MessagesStack: React.FC = () => (
  <Navigator
    id="MessagesStack"
    screenOptions={({ navigation }) => plainHeaderOptions(navigation)}
  >
    <Screen
      name="Messages"
      component={Messages}
      options={{ ...tabRootHeaderOptions, title: 'Messages' }}
    />
  </Navigator>
);

export default MessagesStack;
