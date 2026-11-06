import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomBar from '../../components/BottomBar';
import { GameBoard } from '../../components/Board';
import ExplorerMoveList from '../../components/ExplorerMoveList';
import { ToolbarButton } from '../../components/GameToolbar';
import OpeningName from '../../components/OpeningName';
import PromotionMenu from '../../components/PromotionMenu';
import { ChessGameContext } from '../../context/ChessGameContext';
import { uciToMoveSpec } from '../../domain/analysisTree';
import { useAnalysisWorkspace } from '../../hooks/useAnalysisWorkspace';
import { useBookExplorer } from '../../hooks/useBookExplorer';
import { ExplorerLine, lineTo } from '../../hooks/useExplorerLine';
import { HomeStackParamList } from '../HomeStack/types';
import { makeStyles, spacing } from '../../theme';

type OpeningExplorerProps = NativeStackScreenProps<
  HomeStackParamList,
  'OpeningExplorer'
>;

// The opening explorer, on a board of its own: the opening the position's
// in, and the book's moves from it - a tap playing one there, and listing
// the moves from the next. Back hands the line explored to the analysis
// it was opened from, which goes there.
const OpeningExplorer: React.FC<OpeningExplorerProps> = ({
  navigation,
  route,
}) => {
  const themed = useStyles();
  const { width } = useWindowDimensions();
  const { startFen, uciMoves, orientation, returnKey } = route.params;
  // Where it started from, fixed: a change of params is the line it hands
  // back, not a new start.
  const [start] = useState(() => ({ startFen, uciMoves }));
  const workspace = useAnalysisWorkspace(start, orientation, {
    singleLine: true,
  });
  const { analysis, game, lastPlayedMove, steps, flip, opening } = workspace;
  const moves = useBookExplorer(analysis.current.fen);

  // The line to the position shown, for the analysis behind - read as the
  // screen's left.
  const lineShown = useRef<ExplorerLine | null>(null);
  useLayoutEffect(() => {
    lineShown.current = lineTo(analysis.tree, analysis.current.id);
  });
  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        if (!lineShown.current) return;
        navigation.dispatch({
          ...CommonActions.setParams({ explorerLine: lineShown.current }),
          source: returnKey,
        });
      }),
    [navigation, returnKey],
  );

  function playMove(uci: string) {
    const { from, to, promotion } = uciToMoveSpec(uci);
    game.attemptMove(from, to, promotion);
  }

  return (
    <View style={themed.screen} testID="opening-explorer">
      <OpeningName opening={opening} />
      <View style={{ width, height: width }}>
        <ChessGameContext.Provider value={game}>
          <GameBoard
            width={width}
            orientation={workspace.orientation}
            lastPlayedMove={lastPlayedMove}
            slideOnReset
          />
        </ChessGameContext.Provider>
        {game.pendingPromotion && (
          <PromotionMenu
            promotingColor={game.turn}
            boardWidth={width}
            pieceWidth={width / 8}
            handlePromotion={game.promoteTo}
            onCancel={game.cancelPromotion}
          />
        )}
      </View>
      <ExplorerMoveList moves={moves} onPlayMove={playMove} />
      <BottomBar>
        <View style={styles.toolbar} testID="opening-explorer-toolbar">
          <ToolbarButton
            icon="rotate-3d-variant"
            label="Flip board"
            onPress={flip}
            testID="flip-board-button"
          />
          <ToolbarButton
            icon="chevron-left"
            label="Previous move"
            onPress={steps.back}
            disabled={!steps.canGoBack}
            repeatsWhileHeld
            testID="previous-move-button"
          />
          <ToolbarButton
            icon="chevron-right"
            label="Next move"
            onPress={steps.forward}
            disabled={!steps.canGoForward}
            repeatsWhileHeld
            testID="next-move-button"
          />
        </View>
      </BottomBar>
    </View>
  );
};

export default OpeningExplorer;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
}));

const styles = StyleSheet.create({
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
