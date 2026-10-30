import { Image, StyleSheet, Text, View } from 'react-native';
import { Color } from 'chess.js';

import { PIECES } from '../../constants';
import { MUTED_COLOR } from '../../constants/colors';
import { SideMaterial } from '../../domain/material';
import { otherColor } from '../../domain/players';

const PIECE_SIZE = 16;
// Pieces of the same kind overlap, so a row of pawns stays short.
const SAME_PIECE_OVERLAP = -8;

interface CapturedPiecesProps {
  /** The color of the player who captured them. */
  color: Color;
  material: SideMaterial;
}

const CapturedPieces: React.FC<CapturedPiecesProps> = ({ color, material }) => {
  if (material.pieces.length === 0 && material.score === 0) {
    return null;
  }
  const capturedColor = otherColor(color);
  return (
    <View style={styles.container} testID={`captured-pieces-${color}`}>
      {material.pieces.map((type, index) => (
        <Image
          key={`${type}-${index}`}
          source={PIECES[`${capturedColor}${type}`]}
          style={[
            styles.piece,
            index > 0 &&
              material.pieces[index - 1] === type && {
                marginLeft: SAME_PIECE_OVERLAP,
              },
          ]}
          accessibilityLabel={type}
          testID={`captured-piece-${color}`}
        />
      ))}
      {material.score > 0 && (
        <Text style={styles.score} testID={`material-score-${color}`}>
          {`+${material.score}`}
        </Text>
      )}
    </View>
  );
};

export default CapturedPieces;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: PIECE_SIZE,
  },
  piece: {
    width: PIECE_SIZE,
    height: PIECE_SIZE,
  },
  score: {
    marginLeft: 4,
    fontSize: 12,
    color: MUTED_COLOR,
  },
});
