import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import BottomSheet from '../BottomSheet';
import { ExplorerMove } from '../../network/restClient';
import { OpeningExplorerState } from '../../hooks/useOpeningExplorer';
import { makeStyles, useTheme } from '../../theme';

interface OpeningExplorerSheetProps {
  visible: boolean;
  explorer: OpeningExplorerState;
  onClose: () => void;
  /** A move tapped, as UCI - played on the board. */
  onPlayMove: (uci: string) => void;
}

function percent(count: number, games: number): number {
  return games === 0 ? 0 : Math.round((count / games) * 100);
}

// The opening explorer: every move played from the position shown, in games
// finished here, the most played first - each with how many games and a bar
// of how they ended, white's wins, draws and black's. A tap plays it.
const OpeningExplorerSheet: React.FC<OpeningExplorerSheetProps> = ({
  visible,
  explorer,
  onClose,
  onPlayMove,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  function content() {
    if (explorer.status === 'error') {
      return (
        <Text style={styles.note}>{"The explorer couldn't be loaded."}</Text>
      );
    }
    if (explorer.status !== 'ready') {
      return <ActivityIndicator color={colors.textMuted} />;
    }
    const { moves, totalGames } = explorer.position;
    if (moves.length === 0) {
      return (
        <Text style={styles.note} testID="explorer-empty">
          No games here have reached this position yet.
        </Text>
      );
    }
    return (
      <>
        <Text style={styles.total}>
          {totalGames} {totalGames === 1 ? 'game' : 'games'}
        </Text>
        {moves.map((move) => (
          <MoveRow key={move.uci} move={move} onPress={onPlayMove} />
        ))}
      </>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View testID="opening-explorer">
        <Text style={styles.title}>Opening explorer</Text>
        {content()}
      </View>
    </BottomSheet>
  );
};

const MoveRow: React.FC<{
  move: ExplorerMove;
  onPress: (uci: string) => void;
}> = ({ move, onPress }) => {
  const styles = useStyles();
  const white = percent(move.whiteWins, move.games);
  const draw = percent(move.draws, move.games);
  const black = 100 - white - draw;
  return (
    <Pressable
      style={styles.row}
      onPress={() => onPress(move.uci)}
      accessibilityRole="button"
      accessibilityLabel={`${move.san}, ${move.games} games: white won ${white}%, drawn ${draw}%, black won ${black}%`}
      testID={`explorer-move-${move.uci}`}
    >
      <Text style={styles.san}>{move.san}</Text>
      <Text style={styles.games}>{move.games}</Text>
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
    </Pressable>
  );
};

export default OpeningExplorerSheet;

const useStyles = makeStyles((t) => ({
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    marginBottom: t.spacing.md,
  },
  total: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
    marginBottom: t.spacing.sm,
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
    width: 56,
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
  games: {
    width: 44,
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    height: 20,
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
