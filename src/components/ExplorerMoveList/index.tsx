import { Pressable, ScrollView, Text, View } from 'react-native';

import { Opening } from '../../domain/openings';
import { ExplorerMoveRow } from '../../hooks/useExplorerMoves';
import { ExplorerMove } from '../../network/restClient';
import { makeStyles } from '../../theme';

interface ExplorerMoveListProps {
  /** The position the moves are from - for their numbers. */
  fen: string;
  /** The opening the position's in, heading the list. */
  opening: Opening | null;
  moves: ExplorerMoveRow[];
  /** A move tapped, as UCI. */
  onPlayMove: (uci: string) => void;
}

function percent(count: number, games: number): number {
  return games === 0 ? 0 : Math.round((count / games) * 100);
}

// A move's number as a list of moves reads it: "4." for white's, "4..."
// for black's.
function moveNumberAt(fen: string): string {
  const [, turn, , , , fullMove] = fen.split(' ');
  return turn === 'w' ? `${fullMove}.` : `${fullMove}...`;
}

// The moves from a position, under the opening it's in - the database's,
// then the book's no one has played: each numbered, with how many games
// played it and a bar of how they ended - white's wins, draws and
// black's. A tap plays it. It fills
// the room it's given, moves or not, so what's under it stays put.
const ExplorerMoveList: React.FC<ExplorerMoveListProps> = ({
  fen,
  opening,
  moves,
  onPlayMove,
}) => {
  const styles = useStyles();
  const number = moveNumberAt(fen);
  return (
    <View style={styles.area}>
      {opening && (
        <Text
          style={styles.opening}
          numberOfLines={1}
          testID="explorer-opening"
        >
          {opening.name}
        </Text>
      )}
      {moves.length === 0 ? (
        <Text style={styles.note} testID="explorer-empty">
          No results
        </Text>
      ) : (
        <ScrollView style={styles.list} testID="explorer-moves">
          {moves.map((move) => (
            <MoveRow
              key={move.uci}
              number={number}
              move={move}
              onPress={onPlayMove}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const MoveRow: React.FC<{
  number: string;
  move: ExplorerMoveRow;
  onPress: (uci: string) => void;
}> = ({ number, move, onPress }) => {
  const styles = useStyles();
  return (
    <Pressable
      style={styles.row}
      onPress={() => onPress(move.uci)}
      accessibilityRole="button"
      accessibilityLabel={
        move.opening
          ? `${number} ${move.san}, ${move.opening.name}`
          : `${number} ${move.san}`
      }
      testID={`explorer-move-${move.uci}`}
    >
      <Text style={styles.san} numberOfLines={1}>
        {number} {move.san}
      </Text>
      <Results uci={move.uci} results={move.results} />
    </Pressable>
  );
};

// How many games here played it, and how they ended - none yet, an empty
// bar.
const Results: React.FC<{ uci: string; results: ExplorerMove | null }> = ({
  uci,
  results,
}) => {
  const styles = useStyles();
  const games = results?.games ?? 0;
  const white = results ? percent(results.whiteWins, games) : 0;
  const draw = results ? percent(results.draws, games) : 0;
  const black = results ? 100 - white - draw : 0;
  return (
    <View
      style={styles.results}
      accessible
      accessibilityLabel={
        results
          ? `${games} games: white won ${white}%, drawn ${draw}%, black won ${black}%`
          : 'No games'
      }
      testID={`explorer-results-${uci}`}
    >
      <Text style={styles.games} testID={`explorer-games-${uci}`}>
        {games}
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
  area: {
    flex: 1,
    paddingHorizontal: t.spacing.lg,
  },
  list: {
    flex: 1,
  },
  opening: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.base,
    paddingVertical: t.spacing.sm,
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
  },
  san: {
    width: 80,
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
  results: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  games: {
    width: 56,
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
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
