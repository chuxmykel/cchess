import { ScrollView, Text } from 'react-native';

import ActionList from '../../components/ActionList';
import { AnalysisStackScreenProps } from '../AnalysisStack/types';
import { makeStyles } from '../../theme';

type AnalysisHomeProps = {
  navigation: Pick<
    AnalysisStackScreenProps<'AnalysisHome'>['navigation'],
    'navigate'
  >;
};

// Where an analysis starts: an empty board, a position set up by hand, one
// of your games, or a game or position pasted in.
const AnalysisHome: React.FC<AnalysisHomeProps> = ({ navigation }) => {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="analysis-home"
    >
      <Text style={styles.intro}>
        Explore any position with the engine, try ideas in variations, and see
        which opening you’re in.
      </Text>
      <ActionList
        items={[
          {
            label: 'New analysis',
            icon: 'checkerboard',
            onPress: () =>
              navigation.navigate('AnalysisBoard', {
                source: { kind: 'new' },
              }),
            testID: 'analysis-new',
          },
          {
            label: 'Set up position',
            icon: 'chess-pawn',
            onPress: () =>
              navigation.navigate('AnalysisBoard', {
                source: { kind: 'setup' },
              }),
            testID: 'analysis-set-up',
          },
          {
            label: 'From your games',
            icon: 'history',
            onPress: () => navigation.navigate('PickGame'),
            testID: 'analysis-pick-game',
          },
          {
            label: 'Paste PGN or FEN',
            icon: 'clipboard-text-outline',
            onPress: () => navigation.navigate('PasteGame'),
            testID: 'analysis-paste',
          },
        ]}
      />
    </ScrollView>
  );
};

export default AnalysisHome;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    paddingVertical: t.spacing.lg,
    gap: t.spacing.lg,
  },
  intro: {
    fontSize: t.fontSize.lg,
    color: t.colors.textMuted,
    paddingHorizontal: t.spacing.lg,
  },
}));
