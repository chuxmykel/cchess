import { useRef } from 'react';
import {
  Image,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';


interface PieceProps {
  width: number,
  position: {
    x: number,
    y: number,
  },
  id: string,
};

const chessPiecesPath = "../../../../../assets/chess_pieces/";
const Pieces = {
  bk: require(`${chessPiecesPath}bk.png`),
  bq: require(`${chessPiecesPath}bq.png`),
  br: require(`${chessPiecesPath}br.png`),
  bb: require(`${chessPiecesPath}bb.png`),
  bn: require(`${chessPiecesPath}bn.png`),
  bp: require(`${chessPiecesPath}bp.png`),
  wk: require(`${chessPiecesPath}wk.png`),
  wq: require(`${chessPiecesPath}wq.png`),
  wr: require(`${chessPiecesPath}wr.png`),
  wb: require(`${chessPiecesPath}wb.png`),
  wn: require(`${chessPiecesPath}wn.png`),
  wp: require(`${chessPiecesPath}wp.png`),
};

const Piece: React.FC<PieceProps> = ({ width, position, id }) => {
  const pan = useRef(
    new Animated.ValueXY({
      x: position.x,
      y: position.y
    })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant() {
        pan.setOffset({
          x: position.x,
          y: position.y,
        })
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y, }],
        { useNativeDriver: false, }
      ),
      onPanResponderRelease: (_, gestureState) => {
        // TODO: Do some math to figure out where the piece should land.
        pan.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });
      },
    }),
  ).current;

  return (
    <Animated.View
      style={{
        ...styles.chessPiece,
        transform: [{ translateX: pan.x }, { translateY: pan.y }],
      }}
      {...panResponder.panHandlers}
    >
      <Image
        source={Pieces[id]}
        style={{
          width: width,
          height: width,
        }}
      />
    </Animated.View>
  );
}

export default Piece;

const styles = StyleSheet.create({
  chessPiece: {
    position: "absolute",
  }
});
