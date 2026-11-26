import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Icon from '../../components/Icon';
import { useGameReviewLoad } from '../../context/GameReview/GameReviewContext';
import { makeStyles } from '../../theme';
import type { ReviewStackScreenProps } from './types';

// The review's header buttons, on both its screens: the analysis board at
// the move shown, and the review's settings - one item, so the two sit
// close together rather than spaced as separate header buttons are.
const ReviewHeaderButtons: React.FC = () => {
  const styles = useStyles();
  const navigation =
    useNavigation<ReviewStackScreenProps<'ReviewSummary'>['navigation']>();
  const { analysisAt, shownPly } = useGameReviewLoad();
  return (
    <View style={styles.buttons}>
      <Pressable
        onPress={() =>
          navigation.navigate('AnalysisBoard', {
            source: analysisAt(shownPly.current ?? undefined),
          })
        }
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Analyse"
        testID="review-analyse-button"
      >
        <Icon name="head-cog-outline" size={24} />
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate('ReviewSettings')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Review settings"
        testID="review-settings-button"
      >
        <Icon name="cog-outline" size={24} />
      </Pressable>
    </View>
  );
};

export default ReviewHeaderButtons;

const useStyles = makeStyles((t) => ({
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.lg,
  },
}));
