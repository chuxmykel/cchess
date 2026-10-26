import { Color } from 'chess.js';
import { View, Text, StyleSheet } from 'react-native';

import Button from '../Button';
import GameResultIcon from '../GameResultIcon';
import { GameResult } from '../../domain/types';
import {
  GAME_RESULT_REASON,
  GameResultReason,
} from '../../network/socketEvents';

interface GameOverCardProps {
  result: 'white' | 'black' | 'draw' | null;
  myColor: Color;
  resultReason: GameResultReason | null;
  onNewOpponent: () => void;
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

const GameOverCard: React.FC<GameOverCardProps> = ({
  result,
  myColor,
  resultReason,
  onNewOpponent,
}) => {
  const myResult = toMyResult(result, myColor);
  const wasAborted = resultReason === GAME_RESULT_REASON.ABORT;

  return (
    <View style={styles.card} testID="game-over-card">
      {myResult ? (
        <>
          <GameResultIcon result={myResult} size={40} />
          <Text style={styles.title}>{RESULT_LABELS[myResult]}</Text>
        </>
      ) : (
        <Text style={styles.title}>
          {wasAborted ? 'Game aborted' : 'Game over'}
        </Text>
      )}
      {resultReason && !wasAborted ? (
        <Text style={styles.reason}>{describeReason(resultReason)}</Text>
      ) : null}
      <Button
        label="New opponent"
        onPress={onNewOpponent}
        variant="primary"
        style={styles.newOpponentButton}
        testID="new-opponent-button"
      />
    </View>
  );
};

export default GameOverCard;

const styles = StyleSheet.create({
  card: {
    minWidth: 240,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  reason: {
    fontSize: 15,
    color: '#666',
    textTransform: 'capitalize',
  },
  newOpponentButton: {
    minWidth: 180,
    marginTop: 8,
  },
});
