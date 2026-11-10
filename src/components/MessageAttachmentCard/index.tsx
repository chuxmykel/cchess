import { Pressable, Text, View } from 'react-native';

import { EmptyBoard, PositionBoard } from '../Board';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { useGameSummary } from '../../hooks/useGameSummary';
import { MessageAttachment } from '../../network/restClient';
import { GameSnapshot } from '../../network/socketEvents';
import { makeStyles } from '../../theme';

/** How wide a card's board is drawn. */
export const ATTACHMENT_BOARD_SIZE = 184;

function resultOf(game: GameSnapshot): string {
  if (game.status === 'aborted') return 'Aborted';
  if (game.status === 'active') return 'In progress';
  if (game.result === 'white') return '1-0';
  if (game.result === 'black') return '0-1';
  return '½-½';
}

function sideToMove(fen: string): string {
  return fen.split(' ')[1] === 'b' ? 'Black to move' : 'White to move';
}

interface MessageAttachmentCardProps {
  attachment: MessageAttachment;
  onOpenGame: (gameId: string) => void;
  onOpenPosition: (fen: string) => void;
  testID?: string;
}

const GameCard: React.FC<{
  gameId: string;
  onOpen: (gameId: string) => void;
  testID?: string;
}> = ({ gameId, onOpen, testID }) => {
  const styles = useStyles();
  const game = useGameSummary(gameId);
  const isReady = game !== null && game !== 'error';
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onOpen(gameId)}
      disabled={game === 'error'}
      accessibilityRole="button"
      accessibilityLabel={
        isReady
          ? `Game, ${game.white.displayName} against ${game.black.displayName}`
          : 'Game'
      }
      testID={testID}
    >
      {isReady ? (
        <PositionBoard
          fen={game.fen}
          width={ATTACHMENT_BOARD_SIZE}
          coordinates={false}
        />
      ) : (
        <EmptyBoard width={ATTACHMENT_BOARD_SIZE} coordinates={false} />
      )}
      <View style={styles.caption}>
        {game === 'error' ? (
          <Text style={styles.muted}>This game can’t be shown</Text>
        ) : isReady ? (
          <>
            <Text style={styles.title} numberOfLines={1}>
              {game.white.displayName} vs {game.black.displayName}
            </Text>
            <Text style={styles.muted} numberOfLines={1}>
              {resultOf(game)} · {GAME_TYPE_LABELS[game.gameType]}
            </Text>
          </>
        ) : (
          <Text style={styles.muted}>Game</Text>
        )}
      </View>
    </Pressable>
  );
};

// A game or position shared in a message: its board, and a line on what it
// is - a tap opens the game, or the position on an analysis board.
const MessageAttachmentCard: React.FC<MessageAttachmentCardProps> = ({
  attachment,
  onOpenGame,
  onOpenPosition,
  testID,
}) => {
  const styles = useStyles();
  if (attachment.kind === 'game') {
    return (
      <GameCard
        gameId={attachment.gameId}
        onOpen={onOpenGame}
        testID={testID}
      />
    );
  }
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onOpenPosition(attachment.fen)}
      accessibilityRole="button"
      accessibilityLabel="Position, to analyse"
      testID={testID}
    >
      <PositionBoard
        fen={attachment.fen}
        width={ATTACHMENT_BOARD_SIZE}
        coordinates={false}
      />
      <View style={styles.caption}>
        <Text style={styles.title}>Position</Text>
        <Text style={styles.muted}>
          {sideToMove(attachment.fen)} · Tap to analyse
        </Text>
      </View>
    </Pressable>
  );
};

export default MessageAttachmentCard;

const useStyles = makeStyles((t) => ({
  card: {
    width: ATTACHMENT_BOARD_SIZE,
    borderRadius: t.radius.lg,
    overflow: 'hidden',
    backgroundColor: t.colors.surfaceStrong,
  },
  pressed: {
    opacity: 0.8,
  },
  caption: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    gap: t.spacing.xxs,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
  },
  muted: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
  },
}));
