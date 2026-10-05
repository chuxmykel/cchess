import { View, StyleSheet, useWindowDimensions } from "react-native";

import { NUMBER_OF_ROWS } from "../../constants";
import Chessboard from "../../components/ChessBoard";
import PromotionMenu from "../../components/PromotionMenu";
import { ChessGameProvider, useChessGameContext } from "./ChessGameContext";

const themes = {
  "chess.com": {
    dark: "#769656",
    light: "#eeeed2",
  },
  "lichess.org": {
    dark: "#b58863",
    light: "#f1d9b4",
  },
  monochrome: {
    dark: "#888",
    light: "#fff",
  },
  powderblue: {
    light: "powderblue",
    dark: "grey",
  },
  test: {
    light: "#d0dff4",
    dark: "#4b648a",
  },
};

const GameBoard: React.FC<{ width: number }> = ({ width }) => {
  const { turn, pendingPromotion, promoteTo } = useChessGameContext();
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;

  return (
    <>
      <Chessboard colors={themes.test} width={width} />
      {pendingPromotion && (
        <PromotionMenu
          promotingColor={turn}
          boardWidth={width}
          pieceWidth={PIECE_WIDTH}
          handlePromotion={promoteTo}
        />
      )}
    </>
  );
};

const Game: React.FC = () => {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <ChessGameProvider>
        <GameBoard width={width} />
      </ChessGameProvider>
    </View>
  );
};

export default Game;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
