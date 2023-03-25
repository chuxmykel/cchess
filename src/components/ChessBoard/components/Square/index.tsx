import { useState } from "react";
import { View, StyleSheet, Text, LayoutChangeEvent } from "react-native";

import Coordinates from "../Coordinates";
import Piece from "../Piece";


const Square = ({ color, textColor, rank, file }) => {
  const [width, setWidth] = useState(0);
  function handleLayoutChange(layoutChangeEvent: LayoutChangeEvent) {
    setWidth(layoutChangeEvent.nativeEvent.layout.width);
  }

  return (
    <View
      style={{
        backgroundColor: color,
        ...styles.square,
      }}
      onLayout={handleLayoutChange}
    >
      <Coordinates
        rank={rank}
        file={file}
        color={textColor}
      />
      <Piece width={width} />
    </View>
  );
}

export default Square;


const styles = StyleSheet.create({
  square: {
    flex: 1,
  },
});

