import type { SendToFriend } from '../hooks/useSendToFriend';

// A stand-in for useSendToFriend, for a game screen tested on its own,
// with no session or friends: there's nobody to send to.
export function useSendToFriend(): SendToFriend {
  return {
    isAvailable: false,
    friends: null,
    pending: null,
    open: jest.fn(),
    close: jest.fn(),
    sendTo: jest.fn(),
  };
}
