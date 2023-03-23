import {
  View,
  useWindowDimensions
} from 'react-native';

import Row from './components/Row';

const NUMBER_OF_ROWS = 8;

const Chessboard = () => {
  const { width } = useWindowDimensions();

  const colors = {
    dark: "#769656",
    light: "#eeeed2",
  };

  return (
    <View
      style={{ width, height: width, }}
      testID="chessboard"
    >
      {new Array(NUMBER_OF_ROWS)
        .fill("")
        .map((_, idx) => (
          <Row
            key={idx}
            colors={colors}
            rank={NUMBER_OF_ROWS - idx}
          />))}
    </View>
  );
}

export default Chessboard;

