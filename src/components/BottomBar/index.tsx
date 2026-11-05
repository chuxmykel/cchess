import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles } from '../../theme';

interface BottomBarProps {
  children?: ReactNode;
  testID?: string;
}

const BottomBar: React.FC<BottomBarProps> = ({ children, testID }) => {
  const styles = useStyles();

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

const useStyles = makeStyles((t) => ({
  bar: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.border,
    backgroundColor: t.colors.background,
  },
  content: {
    minHeight: 60,
    justifyContent: 'center',
  },
}));
