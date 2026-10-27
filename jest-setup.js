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

// Icon fonts load through expo-asset, which has no asset registry under
// Jest. Render each icon as a plain Text keeping its props, so tests can
// check which icon is shown by its name.
jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native');
  const React = jest.requireActual('react');
  const IconStub = (props) => React.createElement(Text, props);
  return { MaterialCommunityIcons: IconStub };
});

// The native slider reports its value only through a native event. Render it
// as a plain View keeping its props, so tests can fire valueChange directly.
jest.mock('@react-native-community/slider', () => {
  const { View } = jest.requireActual('react-native');
  const React = jest.requireActual('react');
  const SliderStub = (props) => React.createElement(View, props);
  return { __esModule: true, default: SliderStub };
});
