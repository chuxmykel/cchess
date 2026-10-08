import { View, Text, StyleSheet } from 'react-native';

interface ProfileProps {
  navigation: {
    navigate: (route: string) => any;
  };
}

const Profile: React.FC<ProfileProps> = () => {
  return (
    <View style={styles.container}>
      <View>
        <Text>Profile Screen</Text>
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
