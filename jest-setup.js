/* global jest */
require('react-native-reanimated').setUpTests();

// Gesture Handler 3 unconditionally schedules installing its UI-runtime
// bindings via Worklets.getUIRuntimeHolder(), which throws under Jest (there's
// no UI runtime) - no-op it.
jest.mock(
  'react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings',
  () => ({ installUIRuntimeBindings: () => {} }),
);

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const PresetModal = jest.requireActual(
    '@react-native/jest-preset/jest/mocks/Modal',
  ).default;

  class ModalReportingDismissLikeIOS extends PresetModal {
    componentDidUpdate(prevProps) {
      super.componentDidUpdate?.(prevProps);
      const wasVisible = prevProps.visible !== false;
      if (wasVisible && this.props.visible === false) {
        this.props.onDismiss?.();
      }
    }
  }

  return { __esModule: true, default: ModalReportingDismissLikeIOS };
});

// Icon fonts load at runtime through expo-font, which can't load fonts
// under Jest. Render each icon as a plain Text keeping its props, so tests
// can check which icon is shown by its name.
jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = jest.requireActual('react-native');
  const React = jest.requireActual('react');
  const IconStub = (props) => React.createElement(Text, props);
  return { MaterialDesignIcons: IconStub };
});

// The native slider reports its value only through a native event. Render it
// as a plain View keeping its props, so tests can fire valueChange directly.
jest.mock('@react-native-community/slider', () => {
  const { View } = jest.requireActual('react-native');
  const React = jest.requireActual('react');
  const SliderStub = (props) => React.createElement(View, props);
  return { __esModule: true, default: SliderStub };
});

// Skia draws on a native canvas Jest doesn't have. Charts render their
// CartesianChart as a plain View keeping its props, so tests check what
// it was given to plot, and skip what's drawn inside it.
jest.mock('@shopify/react-native-skia', () => ({
  Circle: () => null,
  LinearGradient: () => null,
  matchFont: () => ({}),
  vec: (x, y) => ({ x, y }),
}));
jest.mock('victory-native', () => {
  const { View } = jest.requireActual('react-native');
  const React = jest.requireActual('react');
  const sharedValue = (value) => ({ value });
  return {
    CartesianChart: ({ children: _children, ...props }) =>
      React.createElement(View, { testID: 'cartesian-chart', ...props }),
    Area: () => null,
    Line: () => null,
    useChartPressState: (initial) => ({
      state: {
        isActive: sharedValue(false),
        matchedIndex: sharedValue(-1),
        x: { value: sharedValue(initial.x), position: sharedValue(0) },
        y: Object.fromEntries(
          Object.keys(initial.y).map((key) => [
            key,
            { value: sharedValue(0), position: sharedValue(0) },
          ]),
        ),
        yIndex: sharedValue(0),
      },
      isActive: false,
    }),
  };
});
