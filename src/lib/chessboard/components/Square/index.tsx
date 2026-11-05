import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CHAR_CODE_FOR_LETTER_A,
  COORDINATE_FONT_SIZE,
  COORDINATE_PADDING,
} from '../../constants';

const Square = ({
  colors,
  rank,
  file,
  orientation = 'w',
  onPress = () => {},
}) => {
  const isDark = (file.charCodeAt(0) - CHAR_CODE_FOR_LETTER_A + rank) % 2 === 1;
  const backgroundColor = isDark ? colors.dark : colors.light;
  const textColor = isDark ? colors.light : colors.dark;
  const showRankLabel = file === (orientation === 'w' ? 'a' : 'h');
  const showFileLabel = rank === (orientation === 'w' ? 1 : 8);

  return (
    <Pressable
      onPress={onPress}
      testID={`square-${file}${rank}`}
      style={{
        backgroundColor,
        ...styles.square,
      }}
    >
      <View style={styles.coordinateContainer}>
        <View>
          <Text
            style={{
              ...styles.coordinateText,
              color: textColor,
              display: `${showRankLabel ? 'flex' : 'none'}`,
            }}
          >
            {rank}
          </Text>
        </View>
        <View style={styles.file}>
          <Text
            style={{
              ...styles.coordinateText,
              color: textColor,
              display: `${showFileLabel ? 'flex' : 'none'}`,
            }}
          >
            {file}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default Square;

const styles = StyleSheet.create({
  square: {
    flex: 1,
  },
  coordinateContainer: {
    padding: COORDINATE_PADDING,
    flex: 1,
    justifyContent: 'space-between',
  },
  coordinateText: {
    fontSize: COORDINATE_FONT_SIZE,
  },
  file: {
    alignItems: 'flex-end',
  },
});
