/* global jest */
require('react-native-reanimated').setUpTests();

// Gesture Handler 3 unconditionally schedules installing its UI-runtime
// bindings via Worklets.getUIRuntimeHolder(), which throws under Jest (there's
// no UI runtime) - no-op it.
jest.mock(
  'react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings',
  () => ({ installUIRuntimeBindings: () => {} }),
);
