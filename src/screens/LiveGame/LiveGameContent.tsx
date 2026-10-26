import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Color } from 'chess.js';

import { NUMBER_OF_ROWS } from '../../constants';
import { BOARD_THEMES } from '../../constants/boardThemes';
import Chessboard from '../../components/ChessBoard';
import PromotionMenu from '../../components/PromotionMenu';
import PlayerBar, { PlayerBarProps } from '../../components/PlayerBar';
import GameControls from '../../components/GameControls';
import GameOverBanner from '../../components/GameOverBanner';
import Button from '../../components/Button';
import { useGameScreenGestureLock } from '../../hooks/useGameScreenGestureLock';
import { useGameClock } from '../../hooks/useGameClock';
import { useBoardOrientation } from '../../hooks/useBoardOrientation';
import { GameUserSummary } from '../../network/socketEvents';
import { HomeStackParamList } from '../HomeStack/types';
import { useOnlineChessGameContext } from '../../context/LiveGame/OnlineChessGameContext';

// Only what this component actually calls - setOptions for the swipe-back
// gesture lock, popToTop for the game-over Done button - so it can be
// rendered with a plain stub instead of a whole navigator.
export type LiveGameContentNavigation = Pick<
  NativeStackNavigationProp<HomeStackParamList, 'LiveGame'>,
  'setOptions' | 'popToTop'
>;

interface LiveGameContentProps {
  width: number;
  navigation: LiveGameContentNavigation;
  white: GameUserSummary;
  black: GameUserSummary;
}

// Everything on the LiveGame screen once the game has loaded: the board,
// both players' bars, the in-game controls and the game-over banner. Must
// render inside an OnlineChessGameProvider, which LiveGame sets up.
const LiveGameContent: React.FC<LiveGameContentProps> = ({
  width,
  navigation,
  white,
  black,
}) => {
  const {
    turn,
    pendingPromotion,
    promoteTo,
    isGameOver,
    myColor,
    result,
    resultReason,
    whiteTimeMs,
    blackTimeMs,
    drawOfferedBy,
    hasAnyMoveBeenMade,
    resign,
    offerDraw,
    respondToDraw,
    abort,
  } = useOnlineChessGameContext();
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const { orientation, flip } = useBoardOrientation(myColor);

  useGameScreenGestureLock(navigation, isGameOver);
  const clock = useGameClock(whiteTimeMs, blackTimeMs, turn, !isGameOver);

  function handleDone() {
    navigation.popToTop();
  }

  // Each player's bar sits on their own side of the board, so the bars swap
  // along with it when the board is flipped.
  const topColor: Color = orientation === 'w' ? 'b' : 'w';
  const sharedPlayerBarProps: Omit<PlayerBarProps, 'color'> = {
    white,
    black,
    clock,
    turn,
    isGameOver,
  };

  return (
    <>
      <PlayerBar color={topColor} {...sharedPlayerBarProps} />

      <Chessboard
        colors={BOARD_THEMES.test}
        width={width}
        orientation={orientation}
      />
      {pendingPromotion && (
        <PromotionMenu
          promotingColor={turn}
          boardWidth={width}
          pieceWidth={PIECE_WIDTH}
          handlePromotion={promoteTo}
        />
      )}

      <PlayerBar color={orientation} {...sharedPlayerBarProps} />

      <Button
        label="Flip board"
        variant="text"
        onPress={flip}
        testID="flip-board-button"
      />

      {!isGameOver && (
        <GameControls
          canAbort={!hasAnyMoveBeenMade}
          drawOfferedByOpponent={
            drawOfferedBy !== null && drawOfferedBy !== myColor
          }
          drawOfferedByMe={drawOfferedBy === myColor}
          onResign={resign}
          onAbort={abort}
          onOfferDraw={offerDraw}
          onAcceptDraw={() => respondToDraw(true)}
          onDeclineDraw={() => respondToDraw(false)}
        />
      )}

      <GameOverBanner
        visible={isGameOver}
        result={result}
        myColor={myColor}
        resultReason={resultReason}
        onDone={handleDone}
      />
    </>
  );
};

export default LiveGameContent;
