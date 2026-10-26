import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomBarProps {
  children?: ReactNode;
  testID?: string;
}

const BottomBar: React.FC<BottomBarProps> = ({ children, testID }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.bar, { paddingBottom: insets.bottom }]}
      testID={testID}
    >
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export default BottomBar;

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d0d0d0',
    backgroundColor: 'white',
  },
  content: {
    minHeight: 60,
    justifyContent: 'center',
  },
});
