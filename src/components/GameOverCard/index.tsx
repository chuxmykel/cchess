import { Color } from 'chess.js';
import { Pressable, View, Text, StyleSheet } from 'react-native';

import Button from '../Button';
import CircleIconButton from '../CircleIconButton';
import GameResultIcon from '../GameResultIcon';
import Icon from '../Icon';
import RatingDiff from '../RatingDiff';
import { GameResult } from '../../domain/types';
import { RematchStatus } from '../../hooks/useRematch';
import {
  GAME_RESULT_REASON,
  GameResultReason,
} from '../../network/socketEvents';

interface GameOverCardProps {
  result: 'white' | 'black' | 'draw' | null;
  /** Null when the viewer didn't play in the game. */
  myColor: Color | null;
  resultReason: GameResultReason | null;
  myRating: number | null;
  myRatingDiff: number | null;
  onNewOpponent: () => void;
  /** What the new-game button says - "New opponent" unless given. */
  newGameLabel?: string;
  /** Offering and answering a rematch, for a game the viewer played. */
  rematch?: {
    status: RematchStatus;
    onOffer: () => void;
    onDecline: () => void;
  };
  /** Shows a close button that hides the card. */
  onDismiss?: () => void;
}

const WINNER_LABELS = { white: 'White won', black: 'Black won' } as const;

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
  myRating,
  myRatingDiff,
  onNewOpponent,
  newGameLabel = 'New opponent',
  rematch,
  onDismiss,
}) => {
  const myResult = myColor === null ? null : toMyResult(result, myColor);
  const wasAborted = resultReason === GAME_RESULT_REASON.ABORT;

  return (
    <View style={styles.card} testID="game-over-card">
      {onDismiss && (
        <Pressable
          style={styles.dismiss}
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
          testID="game-over-dismiss"
        >
          <Icon name="close" size={20} color="#888" />
        </Pressable>
      )}
      {myColor === null && result !== null ? (
        <Text style={styles.title}>
          {result === 'draw' ? 'Draw' : WINNER_LABELS[result]}
        </Text>
      ) : myResult ? (
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
      {myRating !== null && myRatingDiff !== null && (
        <View style={styles.rating} testID="game-over-rating">
          <Text style={styles.ratingLabel}>
            Rating {myRating + myRatingDiff}
          </Text>
          <RatingDiff diff={myRatingDiff} />
        </View>
      )}
      <Button
        label={newGameLabel}
        onPress={onNewOpponent}
        variant="primary"
        style={styles.newOpponentButton}
        testID="new-opponent-button"
      />
      {rematch && <RematchControls {...rematch} />}
    </View>
  );
};

const RematchControls: React.FC<NonNullable<GameOverCardProps['rematch']>> = ({
  status,
  onOffer,
  onDecline,
}) => {
  switch (status) {
    case 'none':
      return (
        <Button
          label="Rematch"
          onPress={onOffer}
          variant="outline"
          style={styles.newOpponentButton}
          testID="rematch-button"
        />
      );
    case 'offered':
      return (
        <View style={styles.rematchRow}>
          <Text style={styles.rematchStatus} testID="rematch-status">
            Rematch sent
          </Text>
          <CircleIconButton
            icon="close"
            label="Cancel rematch"
            onPress={onDecline}
            testID="rematch-cancel-button"
          />
        </View>
      );
    case 'received':
      return (
        <View style={styles.rematchRow}>
          <Text style={styles.rematchStatus} testID="rematch-status">
            Rematch offered
          </Text>
          <CircleIconButton
            icon="close"
            label="Decline rematch"
            onPress={onDecline}
            testID="rematch-decline-button"
          />
          <CircleIconButton
            icon="check"
            label="Accept rematch"
            variant="primary"
            onPress={onOffer}
            testID="rematch-accept-button"
          />
        </View>
      );
    case 'declined':
      return (
        <Text style={styles.rematchStatus} testID="rematch-status">
          Rematch declined
        </Text>
      );
  }
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
  dismiss: {
    position: 'absolute',
    top: 10,
    right: 10,
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
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingLabel: {
    fontSize: 15,
    color: '#333',
  },
  newOpponentButton: {
    minWidth: 180,
    marginTop: 8,
  },
  rematchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  rematchStatus: {
    fontSize: 14,
    color: '#666',
  },
});
