import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Color } from 'chess.js';

import ActionSheet, { ActionSheetAction } from '../../components/ActionSheet';
import BottomBar from '../../components/BottomBar';
import Chessboard from '../../components/ChessBoard';
import BoardArrows from '../../components/ChessBoard/BoardArrows';
import EngineLines, {
  DEPTH_HEIGHT,
  LINE_HEIGHT,
} from '../../components/EngineLines';
import EvalBar, { EVAL_BAR_THICKNESS } from '../../components/EvalBar';
import GameToolbar from '../../components/GameToolbar';
import OpeningName from '../../components/OpeningName';
import PromotionMenu from '../../components/PromotionMenu';
import VariationMoveList from '../../components/VariationMoveList';
import { THREAT_DEPTH } from '../../constants/analysis';
import { BOARD_THEMES } from '../../theme/boardThemes';
import { ChessGameContext } from '../../context/ChessGameContext';
import { useAnalysisSettingsContext } from '../../context/AnalysisSettingsContext';
import { useEngine } from '../../context/EngineContext';
import { uciToMoveSpec } from '../../domain/analysisTree';
import { finalScore } from '../../domain/evalScore';
import { openingAt } from '../../domain/openings';
import { nullMoveFen } from '../../domain/threat';
import { useAnalysisBoard } from '../../hooks/useAnalysisBoard';
import { AnalysisStart, useAnalysisTree } from '../../hooks/useAnalysisTree';
import { useAppIsActive } from '../../hooks/useAppIsActive';
import { useBoardOrientation } from '../../hooks/useBoardOrientation';
import { useEngineAnalysis } from '../../hooks/useEngineAnalysis';
import { useAnalysisSounds } from '../../hooks/useGameSounds';
import { analysisArrows } from '../../utils/analysisArrows';
import { flipBoardAction } from '../gameMenuActions';
import { makeStyles, useTheme } from '../../theme';

interface AnalysisBoardContentProps {
  start: AnalysisStart;
  initialOrientation: Color;
  width: number;
  onNewAnalysis: () => void;
  // Opens the position editor on the position shown.
  onEditPosition: (fen: string) => void;
  onOpenSettings: () => void;
}

// An analysis: a board either side can move on, the engine's view of the
// position shown - its eval, best lines and arrows - the opening, and every
// move tried, variations included.
const AnalysisBoardContent: React.FC<AnalysisBoardContentProps> = ({
  start,
  initialOrientation,
  width,
  onNewAnalysis,
  onEditPosition,
  onOpenSettings,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const analysis = useAnalysisTree(start);
  const {
    game,
    lastPlayedMove,
    navigation: steps,
  } = useAnalysisBoard(start.startFen, analysis);
  const { settings } = useAnalysisSettingsContext();
  const { orientation, flip } = useBoardOrientation(initialOrientation);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // The move a long press picked, for its variation's menu.
  const [variationMenuFor, setVariationMenuFor] = useState<string | null>(null);
  useAnalysisSounds(analysis.current, settings.sounds);

  const { fen } = analysis.current;
  const over = useMemo(() => finalScore(fen), [fen]);
  // Searching only while it's seen: not behind another screen, nor with the
  // app in the background.
  const isFocused = useIsFocused();
  const isAppActive = useAppIsActive();
  const engine = useEngine();
  const engines = engine.status.kind === 'ready' ? engine.status.engines : null;
  const searching = isFocused && isAppActive && !over;
  const showsLines = settings.engineLineCount > 0;
  const searchLimit = useMemo(
    () =>
      settings.searchSeconds === null
        ? { infinite: true }
        : { movetimeMs: settings.searchSeconds * 1000 },
    [settings.searchSeconds],
  );
  const best = useEngineAnalysis(engines?.main ?? null, fen, {
    enabled:
      searching && (settings.evalBar || showsLines || settings.bestMoveArrows),
    // The best move's arrow needs a line even with none shown.
    multiPv: Math.max(1, settings.engineLineCount),
    limit: searchLimit,
  });
  const threatFen = useMemo(
    () => (settings.threatArrows ? nullMoveFen(fen) : null),
    [fen, settings.threatArrows],
  );
  const threat = useEngineAnalysis(engines?.threat ?? null, threatFen, {
    enabled: searching && settings.threatArrows,
    multiPv: 1,
    limit: THREAT_LIMIT,
  });

  const opening = useMemo(
    () => openingAt(analysis.pathFens),
    [analysis.pathFens],
  );
  const arrows = useMemo(
    () =>
      game.pendingPromotion
        ? []
        : analysisArrows(
            settings.bestMoveArrows && !best.stale ? best.lines : [],
            settings.threatArrows && !threat.stale
              ? threat.lines[0]
              : undefined,
            colors.board,
          ),
    [
      best.lines,
      best.stale,
      threat.lines,
      threat.stale,
      settings.bestMoveArrows,
      settings.threatArrows,
      game.pendingPromotion,
      colors.board,
    ],
  );
  const evalBarAt = settings.evalBar ? settings.evalBarPosition : null;
  // Beside the board, the bar takes its width from the board's.
  const isBarBeside = evalBarAt === 'left' || evalBarAt === 'right';
  const boardWidth = isBarBeside ? width - EVAL_BAR_THICKNESS : width;
  const pieceWidth = boardWidth / 8;
  const evalBar = (
    <EvalBar
      score={over ?? (best.stale ? null : best.lines[0]?.score) ?? null}
      direction={isBarBeside ? 'vertical' : 'horizontal'}
      orientation={orientation}
    />
  );

  const menuActions: ActionSheetAction[] = [
    flipBoardAction(flip),
    {
      label: 'New analysis',
      onPress: onNewAnalysis,
      immediate: true,
      testID: 'new-analysis-action',
    },
    {
      label: 'Edit position',
      onPress: () => onEditPosition(fen),
      testID: 'edit-position-action',
    },
    {
      label: 'Settings',
      onPress: onOpenSettings,
      testID: 'analysis-settings-action',
    },
  ];
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
    <View style={styles.screen} testID="analysis-board">
      {evalBarAt === 'top' && evalBar}
      {/* The lines keep their room once the game's over - empty, so the
          board doesn't jump. */}
      {showsLines && (
        <View
          style={[
            styles.lines,
            { height: settings.engineLineCount * LINE_HEIGHT + DEPTH_HEIGHT },
          ]}
          testID="engine-lines-area"
        >
          {!over && (
            <EngineLines
              status={engine.status.kind}
              downloadProgress={
                engine.status.kind === 'downloading'
                  ? engine.status.progress
                  : 0
              }
              analysis={best}
              onRetry={engine.retry}
              onPlayLine={({ pv }) => {
                const { from, to, promotion } = uciToMoveSpec(pv[0]);
                game.attemptMove(from, to, promotion);
              }}
            />
          )}
        </View>
      )}

      <View style={styles.boardRow}>
        {evalBarAt === 'left' && evalBar}
        <View style={{ width: boardWidth, height: boardWidth }}>
          <ChessGameContext.Provider value={game}>
            <Chessboard
              colors={BOARD_THEMES.test}
              width={boardWidth}
              orientation={orientation}
              lastPlayedMove={lastPlayedMove}
              slideOnReset
            />
          </ChessGameContext.Provider>
          <BoardArrows
            arrows={arrows}
            boardWidth={boardWidth}
            orientation={orientation}
          />
          {game.pendingPromotion && (
            <PromotionMenu
              promotingColor={game.turn}
              boardWidth={boardWidth}
              pieceWidth={pieceWidth}
              handlePromotion={game.promoteTo}
              onCancel={game.cancelPromotion}
            />
          )}
        </View>
        {evalBarAt === 'right' && evalBar}
      </View>
      {evalBarAt === 'bottom' && evalBar}

      <OpeningName opening={opening} />
      <VariationMoveList
        tokens={analysis.tokens}
        currentId={analysis.current.id}
        onSelect={steps.goTo}
        onLongPress={setVariationMenuFor}
      />

      <BottomBar>
        <GameToolbar onOpenMenu={() => setIsMenuOpen(true)} moveSteps={steps} />
      </BottomBar>

      <ActionSheet
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        actions={menuActions}
      />
      <ActionSheet
        visible={variationMenuFor !== null}
        onClose={() => setVariationMenuFor(null)}
        actions={variationActions}
      />
    </View>
  );
};

export default AnalysisBoardContent;

const THREAT_LIMIT = { depth: THREAT_DEPTH };

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: t.colors.background,
  },
  boardRow: {
    flexDirection: 'row',
  },
  lines: {
    justifyContent: 'center',
  },
}));
