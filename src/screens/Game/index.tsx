import React from 'react';
import { View, StyleSheet } from 'react-native';

import Chessboard from '../../components/ChessBoard';


const Game: React.FC = () => {
  return (
    <View style={styles.container}>
      <Chessboard />
    </View>
  );
}

export default Game;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

