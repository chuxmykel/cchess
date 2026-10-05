import React from 'react';
import { View, Pressable, Text, StyleSheet } from "react-native";

interface HomeProps {
  navigation: {
    navigate: (route: string) => any,
  },
};

const Home: React.FC<HomeProps> = ({ navigation }) => {
  function play() {
    navigation.navigate("NewGame");
  }
  return (
    <>
      <View style={styles.container}>
        <Pressable style={styles.playButton} onPress={play}>
          <Text style={styles.playButtonText}>Play</Text>
        </Pressable>
      </View>
    </>
  );
};

export default Home;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    backgroundColor: "#769656",
    padding: 8,
    borderRadius: 4,
  },
  playButtonText: {
    color: "white",
  },
});

