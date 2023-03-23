import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import ChessBoard from "./components/ChessBoard";

export default function App() {
  return (
    <View style={styles.container}>
      <ChessBoard />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
});
