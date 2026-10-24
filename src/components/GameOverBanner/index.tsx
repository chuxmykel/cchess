import { Color } from 'chess.js';
import { View, Text, StyleSheet } from 'react-native';

import BottomSheet from '../BottomSheet';
import Button from '../Button';
import GameResultIcon from '../GameResultIcon';
import { GameResult } from '../../domain/types';
import {
  GAME_RESULT_REASON,
  GameResultReason,
} from '../../network/socketEvents';

interface GameOverBannerProps {
  visible: boolean;
  result: 'white' | 'black' | 'draw' | null;
  myColor: Color;
  resultReason: GameResultReason | null;
  onDone: () => void;
}

// A null result (an aborted game) means neither side won
// or lost. There's no GameResult for that, so it's handled as its own case
// rather than forced into 'win'/'loss'/'draw'.
function toMyResult(
  result: 'white' | 'black' | 'draw' | null,
  myColor: Color,
): GameResult | null {
  if (result === null) {
    return null;
  }
  if (result === 'draw') {
    return 'draw';
  }
  const winnerColor: Color = result === 'white' ? 'w' : 'b';
  return winnerColor === myColor ? 'win' : 'loss';
}

export const RESULT_LABELS: Record<GameResult, string> = {
  win: 'You won',
  loss: 'You lost',
  draw: 'Draw',
};

// Mirrors cchess-be's exhaustive GameResultReason - the Record type catches
// a missing label at compile time if that union ever grows.
// describeReason's fallback stays in place as a runtime
// safety net regardless, since the server (not this type) is what actually
// decides what crosses the wire.
export const REASON_LABELS: Record<GameResultReason, string> = {
  [GAME_RESULT_REASON.CHECKMATE]: 'by checkmate',
  [GAME_RESULT_REASON.RESIGNATION]: 'by resignation',
  [GAME_RESULT_REASON.TIMEOUT]: 'on time',
  [GAME_RESULT_REASON.STALEMATE]: 'by stalemate',
  [GAME_RESULT_REASON.DRAW_AGREEMENT]: 'by agreement',
  [GAME_RESULT_REASON.THREEFOLD_REPETITION]: 'by repetition',
  [GAME_RESULT_REASON.INSUFFICIENT_MATERIAL]: 'by insufficient material',
  [GAME_RESULT_REASON.FIFTY_MOVE_RULE]: 'by the fifty-move rule',
  [GAME_RESULT_REASON.ABANDONMENT]: 'by abandonment',
  [GAME_RESULT_REASON.ABORT]: 'aborted',
};

function describeReason(reason: string | null): string {
  if (!reason) {
    return '';
  }
  return (
    (REASON_LABELS as Record<string, string>)[reason] ??
    reason.replace(/-/g, ' ')
  );
}

const GameOverBanner: React.FC<GameOverBannerProps> = ({
  visible,
  result,
  myColor,
  resultReason,
  onDone,
}) => {
  const myResult = toMyResult(result, myColor);

  return (
    <BottomSheet visible={visible} onClose={onDone}>
      <View style={styles.content} testID="game-over-banner">
        {myResult ? (
          <>
            <GameResultIcon result={myResult} size={40} />
            <Text style={styles.title}>{RESULT_LABELS[myResult]}</Text>
          </>
        ) : (
          <Text style={styles.title}>Game Over</Text>
        )}
        {resultReason ? (
          <Text style={styles.reason}>{describeReason(resultReason)}</Text>
        ) : null}
        <Button
          label="Done"
          onPress={onDone}
          variant="primary"
          style={styles.doneButton}
          testID="game-over-done-button"
        />
      </View>
    </BottomSheet>
  );
};

export default GameOverBanner;

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  reason: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  doneButton: {
    minWidth: 160,
    marginTop: 8,
  },
});
