import { ReactElement } from 'react';
import { Metrics, SafeAreaProvider } from 'react-native-safe-area-context';

// A component under test that calls useSafeAreaInsets() throws ("No safe
// area value available") unless it's wrapped in a provider - there's no
// real native measurement to supply these in a unit test, so we provide
// fixed metrics via `initialMetrics` instead of waiting on one.
const TEST_SAFE_AREA_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export function withSafeArea(children: ReactElement) {
  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      {children}
    </SafeAreaProvider>
  );
}
