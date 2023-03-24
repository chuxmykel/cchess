import { View, Pressable, Text, StyleSheet } from "react-native";

interface NewGameScreenProps {
  navigation: {
    navigate: (route: string) => any,
  },
};

const NewGameScreen: React.FC<NewGameScreenProps> = ({ navigation }) => {
  function startNewGame() {
    navigation.navigate("Game")
  }

  return (
    <View style={styles.container}>
      <View>
        <Pressable
          style={styles.newGameButton}
          onPress={startNewGame}
        >
          <Text style={styles.newGameButtonText}>Start New Game</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default NewGameScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newGameButton: {
    backgroundColor: "#769656",
    padding: 8,
    borderRadius: 4,
  },
  newGameButtonText: {
    color: "white",
  },
});

