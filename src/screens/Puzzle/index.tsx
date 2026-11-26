import { useLayoutEffect, useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoardArrow, ReviewBoard } from '../../components/Board';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import PuzzleToolbar from '../../components/PuzzleToolbar';
import RatingDiff from '../../components/RatingDiff';
import { solverName } from '../../domain/puzzles/puzzle';
import {
  PUZZLE_THEME_LABELS,
  type PuzzleTheme,
} from '../../domain/puzzles/themes';
import { usePuzzleRun } from '../../hooks/usePuzzles';
import { usePuzzleSolver } from '../../hooks/usePuzzleSolver';
import { makeStyles, useTheme } from '../../theme';
import type { HomeStackScreenProps } from '../HomeStack/types';

const HINT_WEIGHT = 0.15;

const themeLabel = (theme: string | undefined): string | null =>
  theme && theme in PUZZLE_THEME_LABELS
    ? PUZZLE_THEME_LABELS[theme as PuzzleTheme]
    : null;

// A run of puzzles, over the tabs with a toolbar of its own: the board
// turned to the side solving, the opponent's move played, then yours to
// find - right, and the line plays on; wrong, and it's missed, to try again
// or see the solution. Hint shows the next move (the puzzle then counts as
// missed); ‹ › step through the moves played. A pool puzzle moves your
// puzzle rating; your own goes back on its schedule.
const Puzzle: React.FC<HomeStackScreenProps<'Puzzle'>> = ({
  navigation,
  route,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { deck } = route.params;
  const run = usePuzzleRun(deck);
  const { puzzle, record, next, ratingChange } = run;
  const solver = usePuzzleSolver(puzzle, record);
  const {
    status,
    fen,
    lastMove,
    isLive,
    wrongMove,
    showingSolution,
    hint,
    hinted,
  } = solver;

  const title =
    deck.deck === 'mine'
      ? 'From your games'
      : (themeLabel(deck.theme) ?? 'Practice');
  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  const arrows = useMemo<BoardArrow[]>(
    () =>
      hint
        ? [
            {
              ...hint,
              color: colors.board.arrows[0],
              weight: HINT_WEIGHT,
            },
          ]
        : [],
    [hint, colors],
  );

  if (run.status === 'loading') {
    return <View style={styles.screen} testID="puzzle-loading" />;
  }
  if (run.status === 'error' || run.status === 'done' || !puzzle) {
    const failed = run.status === 'error';
    return (
      <View style={[styles.screen, styles.centred]}>
        <EmptyState
          illustration="puzzles"
          title={
            failed
              ? "Couldn't load a puzzle"
              : deck.deck === 'mine'
                ? 'All caught up'
                : 'No puzzles left here'
          }
          message={
            failed
              ? 'Check your connection and try again.'
              : deck.deck === 'mine'
                ? 'Every puzzle due is done. The ones you missed come back tomorrow.'
                : 'Try another theme, or come back later.'
          }
          action={{
            label: 'Back to puzzles',
            onPress: () => navigation.goBack(),
          }}
          testID={failed ? 'puzzle-error' : 'puzzle-done'}
        />
      </View>
    );
  }

  const done = status === 'solved' || status === 'failed';
  const prompt =
    status === 'solved'
      ? hinted
        ? 'Solved, with a hint.'
        : 'Solved!'
      : status === 'failed'
        ? showingSolution
          ? 'The solution'
          : `${wrongMove ?? 'That'} isn't it.`
        : hint
          ? 'The arrow shows the next move.'
          : `${solverName(puzzle)} to move: find the best line.`;

  return (
    <View style={styles.screen} testID="puzzle-screen">
      <View style={styles.promptRow}>
        {status === 'solved' && (
          <Icon
            name="check-circle"
            size={22}
            color={hinted ? colors.textMuted : colors.success}
          />
        )}
        {status === 'failed' && !showingSolution && (
          <Icon name="close-circle" size={22} color={colors.danger} />
        )}
        <Text style={styles.prompt} testID="puzzle-prompt">
          {prompt}
        </Text>
        {puzzle.kind === 'pool' && ratingChange && (
          <View style={styles.rating} testID="puzzle-rating-change">
            <Text style={styles.ratingValue}>
              {Math.round(ratingChange.after)}
            </Text>
            <RatingDiff
              diff={
                Math.round(ratingChange.after) - Math.round(ratingChange.before)
              }
            />
          </View>
        )}
      </View>

      <ReviewBoard
        fen={fen}
        width={width}
        orientation={solver.solver}
        lastMove={lastMove}
        arrows={arrows}
        movableColor={
          status === 'playing' && !showingSolution && isLive
            ? solver.solver
            : null
        }
        onMove={solver.tryMove}
      />

      <View style={styles.middle}>
        {done && (
          <Button
            label="Next puzzle"
            icon="skip-next"
            onPress={next}
            testID="puzzle-next"
          />
        )}
      </View>

      <View style={{ paddingBottom: insets.bottom }}>
        <PuzzleToolbar
          onHint={solver.showHint}
          canHint={solver.canHint}
          onSolution={solver.showSolution}
          canShowSolution={
            (status === 'playing' || status === 'failed') && !showingSolution
          }
          onRetry={solver.retry}
          canRetry={status === 'failed' || (status === 'solved' && hinted)}
          steps={solver.steps}
        />
      </View>
    </View>
  );
};

export default Puzzle;

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  centred: { justifyContent: 'center' },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    minHeight: 56,
    paddingHorizontal: t.spacing.lg,
  },
  prompt: { ...t.typography.bodyStrong, flex: 1, color: t.colors.text },
  rating: { flexDirection: 'row', alignItems: 'baseline', gap: t.spacing.xs },
  ratingValue: { ...t.typography.bodyStrong, color: t.colors.text },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: t.spacing.lg,
  },
}));
