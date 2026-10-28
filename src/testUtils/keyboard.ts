import { Keyboard, KeyboardEvent, KeyboardEventName } from 'react-native';

/** Captures what's listening for the keyboard, so a test can show and hide
 * it - Jest has no keyboard to send the events. */
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
  return {
    show: (height: number) =>
      listeners.get('keyboardWillShow')?.(event(height)),
    hide: () => listeners.get('keyboardWillHide')?.(event(0)),
  };
}
