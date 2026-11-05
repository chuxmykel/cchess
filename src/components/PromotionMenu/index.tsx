import { Pressable, Text, View } from 'react-native';
import { PieceSymbol, Color } from 'chess.js';

import { BoardPieceIcon } from '../Board';
import { PROMOTION_PIECE_TYPES } from '../../domain/types';
import { makeStyles } from '../../theme';

interface PromotionMenuProps {
  boardWidth: number;
  pieceWidth: number;
  handlePromotion: (selectedType: PieceSymbol) => void;
  /** Puts the pawn back, from a tap on the board around the card. */
  onCancel?: () => void;
  promotingColor: Color;
}

const PIECE_NAMES: Record<string, string> = {
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
};

// The pieces a pawn can become, each on a light tile so white and black
// pieces both stand out, in a card over the faded board.
const PromotionMenu: React.FC<PromotionMenuProps> = ({
  boardWidth,
  pieceWidth,
  handlePromotion,
  onCancel,
  promotingColor,
}) => {
  const styles = useStyles();

  const tileSize = pieceWidth * 1.2;
  return (
    <Pressable
      style={[styles.overlay, { width: boardWidth, height: boardWidth }]}
      onPress={onCancel}
      disabled={!onCancel}
      // Not a button to screen readers - the pieces are the choices.
      accessible={false}
      testID="promotion-menu"
    >
      {/* Claims its own touches, so a tap on the card doesn't cancel. */}
      <View style={styles.card} onStartShouldSetResponder={() => true}>
        <Text style={styles.title}>Promote to</Text>
        <View style={styles.options}>
          {PROMOTION_PIECE_TYPES.map((type: PieceSymbol) => (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.tile,
                { width: tileSize, height: tileSize },
                pressed && styles.pressed,
              ]}
              onPress={() => handlePromotion(type)}
              accessibilityRole="button"
              accessibilityLabel={PIECE_NAMES[type]}
              testID={`promote-${type}`}
            >
              <BoardPieceIcon
                color={promotingColor}
                type={type}
                size={pieceWidth}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </Pressable>
  );
};

export default PromotionMenu;

const useStyles = makeStyles((t) => ({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.board.veil,
  },
  card: {
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surfaceRaised,
    ...t.elevation.lg,
    shadowColor: t.colors.shadow,
  },
  title: {
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textMuted,
  },
  options: {
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md,
    backgroundColor: t.colors.board.promotionTile,
  },
  pressed: {
    backgroundColor: t.colors.board.promotionTilePressed,
  },
}));
