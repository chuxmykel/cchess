import { Text, View } from 'react-native';
import { Color } from 'chess.js';

import { BoardPieceIcon } from '../Board';
import { SideMaterial } from '../../domain/material';
import { otherColor } from '../../domain/players';
import { makeStyles, useTheme } from '../../theme';

const PIECE_SIZE = 16;
// Pieces of the same kind overlap, so a row of pawns stays short.
const SAME_PIECE_OVERLAP = -8;

interface CapturedPiecesProps {
  /** The color of the player who captured them. */
  color: Color;
  material: SideMaterial;
}

const CapturedPieces: React.FC<CapturedPiecesProps> = ({ color, material }) => {
  const styles = useStyles();
  const { colors } = useTheme();

  if (material.pieces.length === 0 && material.score === 0) {
    return null;
  }
  const capturedColor = otherColor(color);
  return (
    <View style={styles.container} testID={`captured-pieces-${color}`}>
      {material.pieces.map((type, index) => (
        <View
          key={`${type}-${index}`}
          style={
            index > 0 &&
            material.pieces[index - 1] === type && {
              marginLeft: SAME_PIECE_OVERLAP,
            }
          }
          accessibilityLabel={type}
          testID={`captured-piece-${color}`}
        >
          {/* One grey, a silhouette whichever its side. */}
          <BoardPieceIcon
            color={capturedColor}
            type={type}
            size={PIECE_SIZE}
            tint={colors.capturedPiece}
            testID="captured-piece-drawing"
          />
        </View>
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

const useStyles = makeStyles((t) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: PIECE_SIZE,
  },
  score: {
    marginLeft: t.spacing.xs,
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
}));
