import { Animated } from 'react-native';

type SpringTarget = Parameters<typeof Animated.spring>[0];
type SpringConfig = Parameters<typeof Animated.spring>[1];
type EndCallback = (result: { finished: boolean }) => void;

// Native-driven springs never run under Jest - the native animated module is
// mocked, so a spring started with useNativeDriver neither moves its value
// nor calls back. These stand in for Animated.spring so tests can see where
// a spring was headed, and what happens once it lands.

// Every spring lands the moment it starts.
export function settleSpringsInstantly(): jest.SpyInstance {
  return jest
    .spyOn(Animated, 'spring')
    .mockImplementation((value: SpringTarget, config: SpringConfig) =>
      fakeSpring((callback) => {
        (value as Animated.Value).setValue(config.toValue as number);
        callback?.({ finished: true });
      }),
    );
}

// Springs wait mid-flight until `land()` - to check what shows while a piece
// is still on its way. `takeInFlight()` sets aside the springs started so
// far, to land later on their own.
export function holdSprings(): {
  land: () => void;
  takeInFlight: () => () => void;
  spy: jest.SpyInstance;
} {
  let inFlight: (() => void)[] = [];
  const spy = jest
    .spyOn(Animated, 'spring')
    .mockImplementation((value: SpringTarget, config: SpringConfig) =>
      fakeSpring((callback) => {
        inFlight.push(() => {
          (value as Animated.Value).setValue(config.toValue as number);
          callback?.({ finished: true });
        });
      }),
    );
  function takeInFlight() {
    const landing = inFlight;
    inFlight = [];
    return () => landing.forEach((settle) => settle());
  }
  return { spy, takeInFlight, land: () => takeInFlight()() };
}

function fakeSpring(
  start: (callback?: EndCallback) => void,
): Animated.CompositeAnimation {
  return { start, stop: () => {}, reset: () => {} };
}
