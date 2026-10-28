import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomSheet } from '../../hooks/useBottomSheet';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  children: ReactNode;
  overlay?: ReactNode;
  /** A fixed height, as a share (0-1) of the screen above the keyboard,
   * for content that lays itself out to fill it: the sheet then doesn't
   * scroll, and sits on the keyboard while it's up, shrinking to fit.
   * Otherwise the sheet fits its content, scrolling past 75% of the
   * screen. */
  heightRatio?: number;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  onDismiss,
  children,
  overlay,
  heightRatio,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight(visible);
  const fillsHeight = heightRatio !== undefined;
  const { modalVisible, translateY, backdropOpacity, panHandlers } =
    useBottomSheet({
      visible,
      onClose,
    });

  // Close the keyboard along with the sheet, rather than leave it up over
  // the screen until the sheet's modal has gone - only on closing, so a
  // sheet mounting closed leaves the screen's own keyboard alone.
  const wasVisible = useRef(visible);
  useEffect(() => {
    if (wasVisible.current && !visible) Keyboard.dismiss();
    wasVisible.current = visible;
  }, [visible]);

  const sheet = (
    <Animated.View
      style={[
        styles.sheetWrapper,
        fillsHeight && styles.fillsFrame,
        { transform: [{ translateY }] },
      ]}
      testID="bottom-sheet"
    >
      <View {...panHandlers} style={styles.handleArea}>
        <View style={styles.handle} />
      </View>
      {fillsHeight ? (
        <Animated.View
          style={[
            styles.sheet,
            styles.filled,
            {
              // Keeps the content above the keyboard, which covers the
              // sheet's bottom - and the home indicator's inset with it.
              paddingBottom: keyboardHeight.interpolate({
                inputRange: [0, 1, windowHeight],
                outputRange: [insets.bottom + 16, 17, windowHeight + 16],
              }),
            },
          ]}
        >
          {children}
        </Animated.View>
      ) : (
        <ScrollView
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}
    </Animated.View>
  );

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            testID="bottom-sheet-backdrop"
          />
        </Animated.View>
        {fillsHeight ? (
          // Follows the keyboard on a view of its own, so its JS-driven
          // height never shares a view with the natively driven slide
          // below. The sheet runs on down behind the keyboard, so its
          // rounded top corners show the sheet rather than a gap: the part
          // above the keyboard is (window - keyboard) * heightRatio, and
          // the keyboard covers the rest.
          <Animated.View
            style={[
              styles.keyboardFrame,
              {
                height: keyboardHeight.interpolate({
                  inputRange: [0, windowHeight],
                  outputRange: [windowHeight * heightRatio, windowHeight],
                }),
              },
            ]}
            testID="bottom-sheet-frame"
          >
            {sheet}
          </Animated.View>
        ) : (
          sheet
        )}
        {overlay}
      </View>
    </Modal>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  handleArea: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d8d8d8',
  },
  keyboardFrame: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fillsFrame: {
    top: 0,
    maxHeight: undefined,
  },
  sheet: {
    paddingHorizontal: 16,
  },
  filled: {
    flex: 1,
  },
});
