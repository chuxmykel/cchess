import { Pressable, ScrollView, Text, View } from 'react-native';

import { BookExplorerMove } from '../../hooks/useBookExplorer';
import { ExplorerMove } from '../../network/restClient';
import { makeStyles } from '../../theme';

interface ExplorerMoveListProps {
  moves: BookExplorerMove[];
  /** A move tapped, as UCI. */
  onPlayMove: (uci: string) => void;
}

function percent(count: number, games: number): number {
  return games === 0 ? 0 : Math.round((count / games) * 100);
}

// The book moves from a position, each with the opening it reaches - and,
// once games finished here have played it, how many and a bar of how they
// ended: white's wins, draws and black's. A tap plays it.
const ExplorerMoveList: React.FC<ExplorerMoveListProps> = ({
  moves,
  onPlayMove,
}) => {
  const styles = useStyles();
  if (moves.length === 0) {
    return (
      <Text style={styles.note} testID="explorer-empty">
        No book moves from here.
      </Text>
    );
  }
  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.content}
      testID="explorer-moves"
    >
      {moves.map((move) => (
        <MoveRow key={move.uci} move={move} onPress={onPlayMove} />
      ))}
    </ScrollView>
  );
};

const MoveRow: React.FC<{
  move: BookExplorerMove;
  onPress: (uci: string) => void;
}> = ({ move, onPress }) => {
  const styles = useStyles();
  const { results } = move;
  return (
    <Pressable
      style={styles.row}
      onPress={() => onPress(move.uci)}
      accessibilityRole="button"
      accessibilityLabel={`${move.san}, ${move.opening.name}`}
      testID={`explorer-move-${move.uci}`}
    >
      <Text style={styles.san}>{move.san}</Text>
      <View style={styles.details}>
        <Text style={styles.opening} numberOfLines={1}>
          {move.opening.name}
        </Text>
        {results && <Results results={results} />}
      </View>
    </Pressable>
  );
};

const Results: React.FC<{ results: ExplorerMove }> = ({ results }) => {
  const styles = useStyles();
  const white = percent(results.whiteWins, results.games);
  const draw = percent(results.draws, results.games);
  const black = 100 - white - draw;
  return (
    <View
      style={styles.results}
      accessible
      accessibilityLabel={`${results.games} games: white won ${white}%, drawn ${draw}%, black won ${black}%`}
      testID={`explorer-results-${results.uci}`}
    >
      <Text style={styles.games}>
        {results.games} {results.games === 1 ? 'game' : 'games'}
      </Text>
      <View style={styles.bar}>
        {white > 0 && (
          <View style={[styles.segment, styles.white, { flex: white }]}>
            {white >= 15 && <Text style={styles.onWhite}>{white}%</Text>}
          </View>
        )}
        {draw > 0 && (
          <View style={[styles.segment, styles.draw, { flex: draw }]}>
            {draw >= 15 && <Text style={styles.onDraw}>{draw}%</Text>}
          </View>
        )}
        {black > 0 && (
          <View style={[styles.segment, styles.black, { flex: black }]}>
            {black >= 15 && <Text style={styles.onBlack}>{black}%</Text>}
          </View>
        )}
      </View>
    </View>
  );
};

export default ExplorerMoveList;

const useStyles = makeStyles((t) => ({
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.md,
  },
  note: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.base,
    paddingVertical: t.spacing.lg,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.divider,
  },
  san: {
    width: 56,
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
  details: {
    flex: 1,
    gap: t.spacing.xxs,
  },
  opening: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
  },
  results: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  games: {
    width: 64,
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
    fontVariant: ['tabular-nums'],
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    height: 16,
    borderRadius: t.radius.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: t.colors.divider,
  },
  segment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  white: { backgroundColor: t.colors.explorer.white },
  draw: { backgroundColor: t.colors.explorer.draw },
  black: { backgroundColor: t.colors.explorer.black },
  onWhite: { color: t.colors.explorer.black, fontSize: t.fontSize.xxs },
  onDraw: { color: t.colors.explorer.white, fontSize: t.fontSize.xxs },
  onBlack: { color: t.colors.explorer.white, fontSize: t.fontSize.xxs },
}));
