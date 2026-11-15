import { Text, View } from 'react-native';

import Icon, { IconName } from '../Icon';
import MoveClassIcon from '../MoveClassIcon';
import type { NumberedMove } from '../../domain/evalScore';
import type { MoveClass } from '../../domain/review/types';
import { makeStyles, useTheme } from '../../theme';

interface ReviewBubbleProps {
  // What the bubble's about: a move's class, or a theme's icon - or neither,
  // for the review's opening and closing words.
  moveClass?: MoveClass | null;
  icon?: IconName;
  title?: string;
  // The position's score, as the eval bar shows it.
  score?: string | null;
  // The words - an idea worth knowing marked *like this*, underlined.
  text: string;
  // A line of moves to show under them - the one played out on the board -
  // and the move of it on the board, set off.
  line?: NumberedMove[] | null;
  lineAt?: number | null;
  testID?: string;
}

// Text with *marked* words underlined.
function marked(text: string, plain: object, underlined: object) {
  return text.split(/(\*[^*]+\*)/).map((part, index) =>
    part.startsWith('*') && part.endsWith('*') ? (
      <Text key={index} style={underlined}>
        {part.slice(1, -1)}
      </Text>
    ) : (
      <Text key={index} style={plain}>
        {part}
      </Text>
    ),
  );
}

// The review talking: a coach's mark - a lightbulb, not a face - and its
// speech bubble, saying what a move was and why.
const ReviewBubble: React.FC<ReviewBubbleProps> = ({
  moveClass,
  icon,
  title,
  score,
  text,
  line,
  lineAt = null,
  testID = 'review-bubble',
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.coach}>
        <Icon
          name="lightbulb-on-outline"
          size={22}
          color={colors.textOnAccent}
        />
      </View>
      <View style={styles.bubble} testID={testID}>
        {(title || moveClass || icon) && (
          <View style={styles.header}>
            {moveClass ? (
              <MoveClassIcon moveClass={moveClass} size={20} />
            ) : icon ? (
              <Icon name={icon} size={20} color={colors.accent} />
            ) : null}
            {title && (
              <Text
                style={styles.title}
                numberOfLines={1}
                testID={`${testID}-title`}
              >
                {title}
              </Text>
            )}
            {score && (
              <View style={styles.score}>
                <Text style={styles.scoreText} testID={`${testID}-score`}>
                  {score}
                </Text>
              </View>
            )}
          </View>
        )}
        <Text style={styles.text} testID={`${testID}-text`}>
          {marked(text, styles.text, styles.concept)}
        </Text>
        {line && line.length > 0 && (
          <Text style={styles.line} testID={`${testID}-line`}>
            {line.map((move, index) => (
              <Text key={index}>
                {move.label && (
                  <Text style={styles.moveNumber}>{move.label} </Text>
                )}
                <Text
                  style={
                    index === lineAt
                      ? styles.lineMoveCurrent
                      : lineAt !== null && index > lineAt
                        ? styles.lineMoveAhead
                        : undefined
                  }
                  testID={
                    index === lineAt ? `${testID}-line-current` : undefined
                  }
                >
                  {move.san}
                </Text>{' '}
              </Text>
            ))}
          </Text>
        )}
      </View>
    </View>
  );
};

export default ReviewBubble;

const COACH_SIZE = 40;

const useStyles = makeStyles((t) => ({
  // The coach at the top, beside the heading: a long comment grows down
  // over the board, and the coach stays clear of it.
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.spacing.sm,
    width: '100%',
  },
  coach: {
    width: COACH_SIZE,
    height: COACH_SIZE,
    borderRadius: COACH_SIZE / 2,
    backgroundColor: t.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flex: 1,
    gap: t.spacing.xs,
    padding: t.spacing.md,
    borderRadius: t.radius.lg,
    borderTopLeftRadius: t.radius.xs,
    backgroundColor: t.colors.reviewBubble,
    ...t.elevation.sm,
    shadowColor: t.colors.shadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.bold,
    color: t.colors.text,
  },
  score: {
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xxs,
    borderRadius: t.radius.xs,
    backgroundColor: t.colors.surfaceStrong,
  },
  scoreText: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.text,
    fontVariant: ['tabular-nums'],
  },
  text: {
    fontSize: t.fontSize.lg,
    lineHeight: 21,
    color: t.colors.text,
  },
  concept: {
    fontSize: t.fontSize.lg,
    color: t.colors.text,
    textDecorationLine: 'underline',
  },
  line: {
    fontSize: t.fontSize.md,
    lineHeight: 20,
    color: t.colors.text,
  },
  moveNumber: {
    color: t.colors.textMuted,
  },
  lineMoveCurrent: {
    fontWeight: t.fontWeight.bold,
    color: t.colors.text,
  },
  // Still to come.
  lineMoveAhead: {
    color: t.colors.textMuted,
  },
}));
