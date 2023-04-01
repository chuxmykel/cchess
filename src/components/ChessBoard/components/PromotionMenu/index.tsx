import { View, StyleSheet, Image, Pressable } from 'react-native';
import { PieceSymbol, Color } from 'chess.js';
import { PIECES } from '../../../../constants';

interface PromotionMenuProps {
  boardWidth: number;
  pieceWidth: number;
  handlePromotion: (selectedType: PieceSymbol) => void;
  promotingColor: Color;
}

// FIXME: Looks terrible for black and doesn't look too good for white either.
const PromotionMenu: React.FC<PromotionMenuProps> = ({ boardWidth, pieceWidth, handlePromotion, promotingColor }) => {
  return (
    <View
      style={{
        ...styles.promotionMenu,
        height: boardWidth,
        width: boardWidth,
      }}
    >
      <View
        style={{
          height: pieceWidth * 2,
          backgroundColor: "#000",
          opacity: 1,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 15
        }}
      >
        {
          ["q", "r", "b", "n"].map((type: PieceSymbol) => {
            return (
              <Pressable
                onPress={() => {
                  handlePromotion(type);
                }}
                key={type}
              >
                <Image
                  source={PIECES[`${promotingColor}${type}`]}
                  style={{
                    width: pieceWidth,
                    height: pieceWidth,

                  }}
                />
              </Pressable>
            );
          })
        }
      </View>
    </View>

  );
}

export default PromotionMenu;

const styles = StyleSheet.create({
  promotionMenu: {
    position: "absolute",
    backgroundColor: "#fff",
    zIndex: 100,
    justifyContent: "center",
    opacity: 0.8
  }
});

