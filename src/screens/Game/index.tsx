import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

import Chessboard from '../../components/ChessBoard';


const Game: React.FC = () => {
  const { width } = useWindowDimensions();
  const board = [
    ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
    ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp",],
    ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
  ];

  // chess.com
  // const colors = {
  //   dark: "#769656",
  //   light: "#eeeed2",
  // };
  //
  // lichess.org
  const colors = {
    dark: "#b58863",
    light: "#f1d9b4",
  };

  return (
    <View style={styles.container}>
      <Chessboard
        board={board}
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

