import React from 'react';
import { View, Pressable, Text, ScrollView, StyleSheet } from "react-native";

import HomeHeader from "../../components/HomeHeader";
import FriendsCarousel from "../../components/FriendsCarousel";
import RecentGamesList from "../../components/RecentGamesList";

interface HomeProps {
  navigation: {
    navigate: (route: string) => any,
  },
};

const Home: React.FC<HomeProps> = ({ navigation }) => {
  function play() {
    navigation.navigate("NewGame");
  }

  function goToProfile() {
    navigation.navigate("Profile");
  }

  return (
    <View style={styles.screen}>
      <HomeHeader onAvatarPress={goToProfile} />
      <ScrollView>
        <FriendsCarousel />
        <RecentGamesList />
        <View style={styles.container}>
          <Pressable style={styles.playButton} onPress={play}>
            <Text style={styles.playButtonText}>Play</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;


const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    alignItems: "center",
    paddingVertical: 32,
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

