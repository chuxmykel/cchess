import { Color } from 'chess.js';
import { Pressable, View, Text } from 'react-native';

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
import { makeStyles, useTheme } from '../../theme';

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
  /** Shows an Analyse button, to look through the game with the engine. */
  onAnalyse?: () => void;
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
  onAnalyse,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

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
          <Icon name="close" size={20} color={colors.textMuted} />
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
      {onAnalyse && (
        <Button
          label="Analyse"
          onPress={onAnalyse}
          variant="outline"
          style={styles.newOpponentButton}
          testID="analyse-button"
        />
      )}
    </View>
  );
};

const RematchControls: React.FC<NonNullable<GameOverCardProps['rematch']>> = ({
  status,
  onOffer,
  onDecline,
}) => {
  const styles = useStyles();

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

const useStyles = makeStyles((t) => ({
  card: {
    minWidth: 240,
    paddingVertical: t.spacing.xl,
    paddingHorizontal: t.spacing.xl,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: 'center',
    gap: t.spacing.sm,
    ...t.elevation.md,
    shadowColor: t.colors.shadow,
  },
  dismiss: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.h2,
    fontWeight: t.fontWeight.bold,
  },
  reason: {
    fontSize: t.fontSize.lg,
    color: t.colors.textSecondary,
    textTransform: 'capitalize',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  ratingLabel: {
    fontSize: t.fontSize.lg,
    color: t.colors.text,
  },
  // The card's buttons all as wide as it, so they line up the same size.
  newOpponentButton: {
    alignSelf: 'stretch',
    minWidth: 180,
    marginTop: t.spacing.sm,
  },
  rematchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    marginTop: t.spacing.xs,
  },
  rematchStatus: {
    fontSize: t.fontSize.base,
    color: t.colors.textSecondary,
  },
}));
