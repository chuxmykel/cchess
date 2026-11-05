import { ReactNode, useState } from 'react';
import { View } from 'react-native';

import ActionSheet, { ActionSheetAction } from '../ActionSheet';
import BottomBar from '../BottomBar';
import { BoardArrow, GameBoard } from '../Board';
import OpeningName from '../OpeningName';
import PromotionMenu from '../PromotionMenu';
import VariationMoveList from '../VariationMoveList';
import { ChessGameContext } from '../../context/ChessGameContext';
import { AnalysisWorkspace } from '../../hooks/useAnalysisWorkspace';
import { makeStyles } from '../../theme';

interface AnalysisViewProps {
  workspace: AnalysisWorkspace;
  boardWidth: number;
  arrows?: BoardArrow[];
  /** Above the board - an engine's lines, say. */
  above?: ReactNode;
  /** Beside the board, left and right - an eval bar. */
  left?: ReactNode;
  right?: ReactNode;
  /** Under the board, above the opening. */
  below?: ReactNode;
  /** What the bar at the bottom holds. */
  toolbar: ReactNode;
  /** Sheets and the like, drawn over it all. */
  children?: ReactNode;
  testID?: string;
}

// An analysis board's layout: the board either side can move on, the opening,
// every move tried with variations bracketed - a long press on one opening its
// menu - and a toolbar, with room around the board for an engine's view.
const AnalysisView: React.FC<AnalysisViewProps> = ({
  workspace,
  boardWidth,
  arrows,
  above,
  left,
  right,
  below,
  toolbar,
  children,
  testID,
}) => {
  const styles = useStyles();
  const { analysis, game, lastPlayedMove, steps, orientation, opening } =
    workspace;
  // The move a long press picked, for its variation's menu.
  const [variationMenuFor, setVariationMenuFor] = useState<string | null>(null);
  const variationActions: ActionSheetAction[] = variationMenuFor
    ? [
        {
          label: 'Promote variation',
          onPress: () => analysis.promote(variationMenuFor),
          immediate: true,
          testID: 'promote-variation-action',
        },
        {
          label: 'Delete from here',
          onPress: () => analysis.deleteFrom(variationMenuFor),
          destructive: true,
          immediate: true,
          testID: 'delete-variation-action',
        },
      ]
    : [];

  return (
    <View style={styles.screen} testID={testID}>
      {above}
      <View style={styles.boardRow}>
        {left}
        <View style={{ width: boardWidth, height: boardWidth }}>
          <ChessGameContext.Provider value={game}>
            <GameBoard
              width={boardWidth}
              orientation={orientation}
              lastPlayedMove={lastPlayedMove}
              slideOnReset
              arrows={arrows}
            />
          </ChessGameContext.Provider>
          {game.pendingPromotion && (
            <PromotionMenu
              promotingColor={game.turn}
              boardWidth={boardWidth}
              pieceWidth={boardWidth / 8}
              handlePromotion={game.promoteTo}
              onCancel={game.cancelPromotion}
            />
          )}
        </View>
        {right}
      </View>
      {below}

      <OpeningName opening={opening} />
      <VariationMoveList
        tokens={analysis.tokens}
        currentId={analysis.current.id}
        onSelect={steps.goTo}
        onLongPress={setVariationMenuFor}
      />

      <BottomBar>{toolbar}</BottomBar>

      <ActionSheet
        visible={variationMenuFor !== null}
        onClose={() => setVariationMenuFor(null)}
        actions={variationActions}
      />
      {children}
    </View>
  );
};

export default AnalysisView;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: t.colors.background,
  },
  boardRow: {
    flexDirection: 'row',
  },
}));
