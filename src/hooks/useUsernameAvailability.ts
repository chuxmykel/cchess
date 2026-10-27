import { useEffect, useState } from 'react';

import { USERNAME_PATTERN } from '../constants/account';
import { useAuthSession } from '../context/AuthSessionContext';
import { isUsernameAvailable } from '../network/restClient';

export const USERNAME_AVAILABILITY = {
  NOT_CHECKED: 'not-checked',
  CHECKING: 'checking',
  AVAILABLE: 'available',
  TAKEN: 'taken',
} as const;

export type UsernameAvailability =
  (typeof USERNAME_AVAILABILITY)[keyof typeof USERNAME_AVAILABILITY];

export const USERNAME_CHECK_DELAY_MS = 400;

type CheckedUsername = {
  username: string;
  availability: UsernameAvailability;
};

export function useUsernameAvailability(
  username: string,
): UsernameAvailability {
  const session = useAuthSession();
  const { authorized } = session;
  const candidate = username.trim();
  const isCheckable = session.isReady && USERNAME_PATTERN.test(candidate);
  const [checked, setChecked] = useState<CheckedUsername | null>(null);

  useEffect(() => {
    if (!isCheckable) {
      return;
    }
    let isCurrent = true;
    const timer = setTimeout(() => {
      authorized((accessToken) => isUsernameAvailable(candidate, accessToken))
        .then((available) =>
          available
            ? USERNAME_AVAILABILITY.AVAILABLE
            : USERNAME_AVAILABILITY.TAKEN,
        )
        .catch(() => USERNAME_AVAILABILITY.NOT_CHECKED)
        .then((availability) => {
          if (isCurrent) {
            setChecked({ username: candidate, availability });
          }
        });
    }, USERNAME_CHECK_DELAY_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [candidate, authorized, isCheckable]);

  if (!isCheckable) {
    return USERNAME_AVAILABILITY.NOT_CHECKED;
  }
  if (checked?.username !== candidate) {
    return USERNAME_AVAILABILITY.CHECKING;
  }
  return checked.availability;
}
