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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <FriendsCarousel />
        <RecentGamesList />
      </ScrollView>
      <View style={styles.playButtonContainer}>
        <Pressable style={styles.playButton} onPress={play}>
          <Text style={styles.playButtonText}>Play</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Home;


const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  playButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    // Matches the tab bar's background so this reads as one
    // continuous section rather than a separate floating bar.
    backgroundColor: "white",
  },
  playButton: {
    backgroundColor: "#769656",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  playButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
