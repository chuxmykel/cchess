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
