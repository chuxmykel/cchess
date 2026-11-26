import { useCallback, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { setChatWithStrangers } from '../network/restClient';

export type ChatWithStrangers = {
  isOn: boolean;
  /** Switched at once, and back if the server refuses. */
  set: (isOn: boolean) => void;
  error: string | null;
};

/** Whether the player chats in games with players who aren't friends -
 * off until they turn it on, kept on the server. */
export function useChatWithStrangers(): ChatWithStrangers {
  const session = useAuthSession();
  const saved = session.isReady
    ? (session.user.chatWithStrangers ?? false)
    : false;
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { authorized, reloadUser } = session;

  const set = useCallback(
    (isOn: boolean) => {
      setChosen(isOn);
      setError(null);
      authorized((token) => setChatWithStrangers(isOn, token))
        .then(reloadUser)
        .catch((failure: Error) => {
          setError(failure.message);
          setChosen(null);
        });
    },
    [authorized, reloadUser],
  );

  return { isOn: chosen ?? saved, set, error };
}
