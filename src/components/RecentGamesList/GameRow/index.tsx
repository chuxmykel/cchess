import { View, Text, StyleSheet } from "react-native";

import Avatar from "../../Avatar";
import GameTypeIcon from "../../GameTypeIcon";
import GameResultIcon from "../../GameResultIcon";
import { RecentGame } from "../../../constants/recentGames";

interface GameRowProps {
  game: RecentGame;
}

const GameRow: React.FC<GameRowProps> = ({ game }) => {
  return (
    <View style={styles.row} testID={`game-row-${game.id}`}>
      <View style={styles.typeIcon}>
        <GameTypeIcon type={game.type} />
      </View>
      <View style={styles.avatar}>
        <Avatar name={game.opponentName} size={36} />
      </View>
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {game.opponentName}{" "}
          <Text style={styles.rating}>({game.opponentRating})</Text>
        </Text>
        <Text style={styles.playedAt}>{game.playedAt}</Text>
      </View>
      <GameResultIcon result={game.result} />
    </View>
  );
};

export default GameRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  typeIcon: {
    width: 24,
    alignItems: "center",
    marginRight: 12,
  },
  avatar: {
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
  },
  rating: {
    fontWeight: "400",
    color: "#888",
  },
  playedAt: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
});
