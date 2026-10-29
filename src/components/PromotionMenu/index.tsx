import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { PieceSymbol, Color } from 'chess.js';

import { PIECES } from '../../constants';
import { MUTED_COLOR } from '../../constants/colors';
import { PROMOTION_PIECE_TYPES } from '../../domain/types';

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
              <Image
                source={PIECES[`${promotingColor}${type}`]}
                style={{ width: pieceWidth, height: pieceWidth }}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </Pressable>
  );
};

export default PromotionMenu;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  card: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED_COLOR,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#e9ebee',
  },
  pressed: {
    backgroundColor: '#d5d9de',
  },
});
