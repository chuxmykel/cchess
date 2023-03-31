import { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Chess } from "chess.js";

import Chessboard from '../../components/ChessBoard';

const Game: React.FC = () => {
  // NOTE: Use positon from FEN

  // Fried liver attack (King Side Castle)
  // const [game] = useState(new Chess("r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 6 5"));

  // Queen side castle
  // const [game] = useState(new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3KBNR w KQkq - 0 1"));

  // Promotion
  // const [game] = useState(new Chess("8/4P3/8/2k5/8/4K3/8/8 w - - 0 1"));

  // Pre - en passant
  // const [game] = useState(new Chess("rnbqkbnr/pppp1ppp/4p3/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"))

  // New Game
  const [game] = useState(new Chess());

  const { width } = useWindowDimensions();

  // chess.com
  // const colors = {
  //   dark: "#769656",
  //   light: "#eeeed2",
  // };


  // lichess.org
  const colors = {
    dark: "#b58863",
    light: "#f1d9b4",
  };

  // black & white
  // const colors = {
  //   dark: "#888",
  //   light: "#fff"
  // };


  return (
    <View style={styles.container}>
      <Chessboard
        game={game}
        colors={colors}
        width={width}
      />
    </View>
  );
}

export default Game;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

