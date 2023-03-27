import { View, StyleSheet, useWindowDimensions } from 'react-native';

import { Chess } from "chess.js";

import Chessboard from '../../components/ChessBoard';
import { useState } from 'react';


const Game: React.FC = () => {
  // Use positon from FEN
  // const [game] = useState(new Chess("r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 6 5"));

  const [game] = useState(new Chess());
  const { width } = useWindowDimensions();

  // chess.com
  const colors = {
    dark: "#769656",
    light: "#eeeed2",
  };


  // lichess.org
  // const colors = {
  //   dark: "#b58863",
  //   light: "#f1d9b4",
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

