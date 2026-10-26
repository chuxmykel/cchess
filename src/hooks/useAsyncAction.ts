import { useCallback, useRef, useState } from 'react';

import { ApiError } from '../network/restClient';

export type AsyncAction = {
  isRunning: boolean;
  errorMessage: string | null;
  run: () => Promise<boolean>;
};

const NO_RESPONSE = 0;

function isServerRejection(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status !== NO_RESPONSE;
}

export function useAsyncAction(
  action: () => Promise<void>,
  fallbackErrorMessage: string,
): AsyncAction {
  const [isRunning, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isInFlight = useRef(false);

  const run = useCallback(async () => {
    if (isInFlight.current) {
      return false;
    }
    isInFlight.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await action();
      return true;
    } catch (error) {
      setErrorMessage(
        isServerRejection(error) ? error.message : fallbackErrorMessage,
      );
      return false;
    } finally {
      isInFlight.current = false;
      setIsSubmitting(false);
    }
  }, [action, fallbackErrorMessage]);

  return { isRunning, errorMessage, run };
}
