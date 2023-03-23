import {
  View,
  useWindowDimensions
} from 'react-native';

import Row from './components/Row';

const NUMBER_OF_ROWS = 8;

const Chessboard = () => {
  const { width } = useWindowDimensions();

  const colors = {
    light: "white",
    dark: "green",
  };

  return (
    <View style={{ width, height: width, }}>
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

