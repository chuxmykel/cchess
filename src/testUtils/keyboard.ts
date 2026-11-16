import {
  Keyboard,
  KeyboardEvent,
  KeyboardEventName,
  Platform,
} from 'react-native';

/** Captures what's listening for the keyboard, so a test can show and hide
 * it - Jest has no keyboard to send the events. It sends what the platform
 * under test does: iOS says the keyboard will move and then that it did,
 * Android only that it did. */
export function captureKeyboardListeners() {
  const listeners = new Map<
    KeyboardEventName,
    (event: KeyboardEvent) => void
  >();
  jest
    .spyOn(Keyboard, 'addListener')
    .mockImplementation((eventName, listener) => {
      listeners.set(eventName, listener as (event: KeyboardEvent) => void);
      return { remove: jest.fn() } as never;
    });
  const event = (height: number) =>
    ({ duration: 250, endCoordinates: { height } }) as KeyboardEvent;
  function send(
    will: KeyboardEventName,
    did: KeyboardEventName,
    height: number,
  ) {
    if (Platform.OS === 'ios') listeners.get(will)?.(event(height));
    listeners.get(did)?.(event(height));
  }
  return {
    show: (height: number) =>
      send('keyboardWillShow', 'keyboardDidShow', height),
    hide: () => send('keyboardWillHide', 'keyboardDidHide', 0),
  };
}
