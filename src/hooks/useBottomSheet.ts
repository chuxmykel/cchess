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
  // `translateY`/`panResponder` are created once via useRef and never
  // reassigned - reading `.current` here is the standard "lazy-init a
  // stable value" idiom, not a bug. react-hooks/refs is a
  // React-Compiler-readiness rule, not a correctness bug under React's
  // current (non-compiled) runtime - revisit this if this project ever
  // turns the compiler on.
  /* eslint-disable react-hooks/refs */
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
      // Mounting the modal and starting its spring-in animation in the
      // same effect is intentional: the Modal must be in the tree before
      // the slide-in animation plays. react-hooks/set-state-in-effect is a
      // React-Compiler-readiness rule, not a correctness bug under React's
      // current (non-compiled) runtime - revisit this if this project
      // ever turns the compiler on.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [visible, translateY]);

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
  /* eslint-enable react-hooks/refs */
}
