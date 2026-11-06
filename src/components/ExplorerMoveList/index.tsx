import { Pressable, ScrollView, Text, View } from 'react-native';

import { EXPLORER_DB_LABELS, ExplorerDb } from '../../constants/explorer';
import { Opening } from '../../domain/openings';
import {
  ExplorerMoveRow,
  ExplorerMoves,
  ExplorerTotals,
} from '../../hooks/useExplorerMoves';
import { ExplorerSource } from '../../network/restClient';
import { makeStyles } from '../../theme';
import { formatGameCount, percentOf } from '../../utils/explorerCounts';

interface ExplorerMoveListProps {
  /** The position the moves are from - for their numbers. */
  fen: string;
  /** The opening the position's in, heading the list. */
  opening: Opening | null;
  moves: ExplorerMoveRow[];
  status: ExplorerMoves['status'];
  /** The position's own games, for the Σ row and each move's share. */
  totals: ExplorerTotals | null;
  /** The database asked, and where the answer came from - when lichess was
   * out of reach, the games played here, which a note says. */
  db: ExplorerDb | null;
  source: ExplorerSource | null;
  /** A move tapped, as UCI. */
  onPlayMove: (uci: string) => void;
}

// A move's number as a list of moves reads it: "4." for white's, "4..."
// for black's.
function moveNumberAt(fen: string): string {
  const [, turn, , , , fullMove] = fen.split(' ');
  return turn === 'w' ? `${fullMove}.` : `${fullMove}...`;
}

// The moves from a position, under the opening it's in - the database's,
// then the book's no one has played: each numbered, with how many games
// played it, its share of the position's, and a bar of how they ended -
// white's wins, draws and black's - and under them, Σ, the position's
// own. A tap plays a move. It fills the room it's given, moves or not, so
// what's under it stays put.
const ExplorerMoveList: React.FC<ExplorerMoveListProps> = ({
  fen,
  opening,
  moves,
  status,
  totals,
  db,
  source,
  onPlayMove,
}) => {
  const styles = useStyles();
  const number = moveNumberAt(fen);
  const fellBack =
    (db === 'masters' || db === 'lichess') && source === 'cchess';
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
      {fellBack && (
        <Text style={styles.notice} testID="explorer-fallback">
          {EXPLORER_DB_LABELS[db]} is out of reach right now - showing games
          played here
        </Text>
      )}
      {status === 'error' && (
        <Text style={styles.notice} testID="explorer-error">
          Couldn&apos;t reach the explorer
        </Text>
      )}
      {moves.length === 0 ? (
        status !== 'loading' && (
          <Text style={styles.note} testID="explorer-empty">
            No results
          </Text>
        )
      ) : (
        <ScrollView style={styles.list} testID="explorer-moves">
          {moves.map((move) => (
            <MoveRow
              key={move.uci}
              number={number}
              move={move}
              totalGames={totals?.games ?? null}
              onPress={onPlayMove}
            />
          ))}
          {totals && totals.games > 0 && <TotalsRow totals={totals} />}
        </ScrollView>
      )}
    </View>
  );
};

const MoveRow: React.FC<{
  number: string;
  move: ExplorerMoveRow;
  totalGames: number | null;
  onPress: (uci: string) => void;
}> = ({ number, move, totalGames, onPress }) => {
  const styles = useStyles();
  const games = move.results?.games ?? 0;
  const share =
    totalGames !== null && totalGames > 0 ? percentOf(games, totalGames) : null;
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
      <Results
        testID={move.uci}
        results={
          move.results && {
            games,
            whiteWins: move.results.whiteWins,
            draws: move.results.draws,
            blackWins: move.results.blackWins,
          }
        }
        share={share}
      />
    </Pressable>
  );
};

// Σ: every game that reached the position and went on, and how they ended.
const TotalsRow: React.FC<{ totals: ExplorerTotals }> = ({ totals }) => {
  const styles = useStyles();
  return (
    <View style={[styles.row, styles.totals]} testID="explorer-totals">
      <Text style={styles.san} accessibilityLabel="All games">
        Σ
      </Text>
      <Results testID="totals" results={totals} share={null} />
    </View>
  );
};

// How many games played it, its share of the position's, and how they
// ended - none yet, an empty bar.
const Results: React.FC<{
  testID: string;
  results: ExplorerTotals | null;
  share: number | null;
}> = ({ testID, results, share }) => {
  const styles = useStyles();
  const games = results?.games ?? 0;
  const white = results ? percentOf(results.whiteWins, games) : 0;
  const draw = results ? percentOf(results.draws, games) : 0;
  const black = results && games > 0 ? 100 - white - draw : 0;
  return (
    <View
      style={styles.results}
      accessible
      accessibilityLabel={
        results && games > 0
          ? `${games} games${share !== null ? `, ${share}% of all` : ''}: white won ${white}%, drawn ${draw}%, black won ${black}%`
          : 'No games'
      }
      testID={`explorer-results-${testID}`}
    >
      <Text style={styles.games} testID={`explorer-games-${testID}`}>
        {formatGameCount(games)}
      </Text>
      <Text style={styles.share} testID={`explorer-share-${testID}`}>
        {share !== null ? `${share}%` : ''}
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
  notice: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
    paddingBottom: t.spacing.sm,
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
  totals: {
    borderTopWidth: 1,
    borderTopColor: t.colors.divider,
  },
  games: {
    width: 64,
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  share: {
    width: 36,
    color: t.colors.textMuted,
    fontSize: t.fontSize.xs,
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
