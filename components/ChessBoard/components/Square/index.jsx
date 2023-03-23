import { View, StyleSheet, Text } from "react-native";

import Coordinates from "../Coordinates";


const Square = ({ color, textColor, rank, file }) => {
  return (

    <View
      style={{
        backgroundColor: color,
        ...styles.square,
      }}
    >
      <Coordinates
        rank={rank}
        file={file}
        color={textColor}
      />
    </View>
  );
}

export default Square;


const styles = StyleSheet.create({
  square: {
    flex: 1,
  },
});

