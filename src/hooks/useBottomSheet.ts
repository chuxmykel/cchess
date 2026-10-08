import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';

export interface UseBottomSheetOptions {
  visible: boolean;
  onClose: () => void;
}

export interface BottomSheetAnimation {
  modalVisible: boolean;
  translateY: Animated.Value;
  backdropOpacity: Animated.AnimatedInterpolation<number>;
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DRAG_CLOSE_DISTANCE = 100;
const DRAG_CLOSE_VELOCITY = 0.5;

export function useBottomSheet({
  visible,
  onClose,
}: UseBottomSheetOptions): BottomSheetAnimation {
  const [modalVisible, setModalVisible] = useState(visible);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (!visible) return;
    }

    if (visible) {
      setModalVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (
          gesture.dy > DRAG_CLOSE_DISTANCE ||
          gesture.vy > DRAG_CLOSE_VELOCITY
        ) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 150,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return {
    modalVisible,
    translateY,
    backdropOpacity,
    panHandlers: panResponder.panHandlers,
  };
}
