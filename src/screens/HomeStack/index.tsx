import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import { AnalysisSettingsProvider } from '../../context/AnalysisSettingsContext';
import { DailyGameSettingsProvider } from '../../context/DailyGameSettingsContext';
import { DailyGamePositionsProvider } from '../../context/DailyGamePositionsContext';
import { SocialProvider } from '../../context/SocialContext';
import { useResumeActiveGame } from '../../hooks/useResumeActiveGame';
import HomeTabs from '../HomeTabs';
import LiveGame from '../LiveGame';
import DailyGame from '../DailyGame';
import DailyAnalysis from '../DailyAnalysis';
import GameViewer from '../GameViewer';
import AnalysisBoard from '../AnalysisBoard';
import AnalysisSettings from '../AnalysisSettings';
import DailyGameSettings from '../DailyGameSettings';
import GameNotes from '../GameNotes';
import ConditionalMoves from '../ConditionalMoves';
import OpeningExplorer from '../OpeningExplorer';
import UserProfile from '../UserProfile';
import Conversation from '../Conversation';
import GamesList from '../GamesList';
import DailyGamesList from '../DailyGamesList';
import UserFriends from '../UserFriends';
import Friends from '../Friends';
import RatingStats from '../RatingStats';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { GameType } from '../../domain/types';
import SignIn from '../SignIn';
import CreateAccount from '../CreateAccount';
import Licenses from '../Licenses';
import Appearance from '../Appearance';
import { plainHeaderOptions } from '../plainHeaderOptions';
import { HomeStackParamList, RootStackParamList } from './types';

const { Navigator, Screen } = createNativeStackNavigator<HomeStackParamList>();

const HomeStack: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // A game that's just started - or a live one still on, after a restart.
  const openGame = useCallback(
    (gameId: string, gameType?: GameType) =>
      navigation.navigate('HomeStack', {
        screen: gameType === 'daily' ? 'DailyGame' : 'LiveGame',
        params: { gameId },
      }),
    [navigation],
  );
  useResumeActiveGame(openGame);

  return (
    <SocialProvider onGameStarted={openGame}>
      <AnalysisSettingsProvider>
        <DailyGameSettingsProvider>
          <DailyGamePositionsProvider>
            <Navigator
              id="HomeStack"
              initialRouteName="HomeTabs"
              screenOptions={{
                headerShown: false,
              }}
            >
              <Screen name="HomeTabs" component={HomeTabs} />
              <Screen
                name="LiveGame"
                component={LiveGame}
                options={{ gestureEnabled: false }}
              />
              <Screen name="DailyGame" component={DailyGame} />
              <Screen
                name="DailyAnalysis"
                component={DailyAnalysis}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Analysis',
                })}
              />
              <Screen name="GameViewer" component={GameViewer} />
              <Screen
                name="AnalysisBoard"
                component={AnalysisBoard}
                // Over the tabs, so its own toolbar is the only one at the bottom,
                // and Back returns to wherever it was opened from - the Analysis
                // tab, or a game.
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Analysis',
                })}
              />
              <Screen
                name="UserProfile"
                component={UserProfile}
                // The profile shows the username in its title itself, once the
                // avatar block scrolls away.
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: '',
                })}
              />
              <Screen
                name="Conversation"
                component={Conversation}
                options={({ navigation }) => plainHeaderOptions(navigation)}
              />
              <Screen
                name="FindFriends"
                component={Friends}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Friends',
                })}
              />
              <Screen
                name="UserFriends"
                component={UserFriends}
                options={({ navigation }) => plainHeaderOptions(navigation)}
              />
              <Screen
                name="GamesList"
                component={GamesList}
                options={({ navigation }) => plainHeaderOptions(navigation)}
              />
              <Screen
                name="DailyGamesList"
                component={DailyGamesList}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Daily games',
                })}
              />
              <Screen
                name="RatingStats"
                component={RatingStats}
                options={({ navigation, route }) => ({
                  ...plainHeaderOptions(navigation),
                  title: `${GAME_TYPE_LABELS[route.params.category]} rating`,
                })}
              />
              <Screen
                name="SignIn"
                component={SignIn}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Sign in',
                })}
              />
              <Screen
                name="CreateAccount"
                component={CreateAccount}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Create account',
                })}
              />
              <Screen
                name="AnalysisSettings"
                component={AnalysisSettings}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Analysis Settings',
                })}
              />
              <Screen
                name="OpeningExplorer"
                component={OpeningExplorer}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Opening explorer',
                })}
              />
              <Screen
                name="ConditionalMoves"
                component={ConditionalMoves}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Conditional moves',
                })}
              />
              <Screen
                name="GameNotes"
                component={GameNotes}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Notes',
                })}
              />
              <Screen
                name="DailyGameSettings"
                component={DailyGameSettings}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Daily Game Settings',
                })}
              />
              <Screen
                name="Appearance"
                component={Appearance}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Appearance',
                })}
              />
              <Screen
                name="Licenses"
                component={Licenses}
                options={({ navigation }) => ({
                  ...plainHeaderOptions(navigation),
                  title: 'Licenses',
                })}
              />
            </Navigator>
          </DailyGamePositionsProvider>
        </DailyGameSettingsProvider>
      </AnalysisSettingsProvider>
    </SocialProvider>
  );
};

export default HomeStack;
