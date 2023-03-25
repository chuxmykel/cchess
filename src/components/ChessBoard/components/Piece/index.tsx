import React from 'react';
import { Text, View, Image, StyleSheet } from 'react-native';

// import { Container } from './styles';

interface PieceProps {
  width: number,
};

const Piece: React.FC<PieceProps> = ({ width }) => {
  return (
    <View>
      {/* TODO: Fix this messy path! */}
      <Image
        source={require("../../../../../assets/chess_pieces/wp.png")}
        style={{
          width: width,
          height: width,
          position: "absolute",
          zIndex: 1,
          bottom: 0,
          left: 0,
        }}
      />
    </View>
  );
}

export default Piece;

const styles = StyleSheet.create({
  chessPiece: {
    flex: 1,
  }
});
